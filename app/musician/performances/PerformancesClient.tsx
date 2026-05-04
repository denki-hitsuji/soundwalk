"use client";

import { PerformanceCard } from "@/components/performances/PerformanceCard";
import { updatePrepTaskDone } from "@/lib/api/performancesAction";
import { addDays, fmtMMdd, parseYmdLocal, toYmdLocal } from "@/lib/utils/date";
import { DetailsMap, detailsSummary, FlyerMap, normalizeAct, PerformanceWithActs, PREP_DEFS, PrepMap, statusText } from "@/lib/utils/performance";
import { buildSchedulePost } from "@/lib/utils/buildSchedulePost";
import { SharePostPreview } from "@/components/share/SharePostPreview";
import Link from "next/link";
import { useMemo, useState } from "react";
type Prop = {
    userId: string;
    performances: PerformanceWithActs[];
    flyerByPerformanceId: FlyerMap;
    detailsByPerformanceId: DetailsMap;
    prep: PrepMap;
    profileName: string;
};

const ACTION_STATUSES = new Set(["offered", "pending_reconfirm"]);

export function PerformancesClient({ userId, performances, flyerByPerformanceId, detailsByPerformanceId, prep, profileName}: Prop) {
    const prepByPerformanceId = prep;
    const todayStr = useMemo(() => toYmdLocal(), []);
    const todayDate = useMemo(() => parseYmdLocal(todayStr), [todayStr]);

    // 翌月末日のYMD文字列（初期表示の境界）
    const cutoffStr = useMemo(() => {
        const d = new Date(todayDate.getFullYear(), todayDate.getMonth() + 2, 0);
        return toYmdLocal(d);
    }, [todayDate]);

    const futurePerformances = useMemo(
        () => performances.filter((p) => p.event_date >= todayStr),
        [performances, todayStr],
    );
    const pastPerformances = useMemo(
        () => performances.filter((p) => p.event_date < todayStr),
        [performances, todayStr],
    );

    // 要対応（offered / pending_reconfirm）: 日付昇順、件数に関わらず全件表示
    const actionRequired = useMemo(
        () => [...futurePerformances]
            .filter((p) => ACTION_STATUSES.has(p.status ?? ""))
            .sort((a, b) => (a.event_date ?? "").localeCompare(b.event_date ?? "")),
        [futurePerformances],
    );

    // 確定済み（その他）: 日付昇順、翌月末以降は折りたたむ
    const confirmedAll = useMemo(
        () => [...futurePerformances]
            .filter((p) => !ACTION_STATUSES.has(p.status ?? ""))
            .sort((a, b) => (a.event_date ?? "").localeCompare(b.event_date ?? "")),
        [futurePerformances],
    );
    const confirmedVisible = useMemo(
        () => confirmedAll.filter((p) => (p.event_date ?? "") <= cutoffStr),
        [confirmedAll, cutoffStr],
    );
    const confirmedHidden = useMemo(
        () => confirmedAll.filter((p) => (p.event_date ?? "") > cutoffStr),
        [confirmedAll, cutoffStr],
    );

    const [showMoreConfirmed, setShowMoreConfirmed] = useState(false);
    const [showSchedulePost, setShowSchedulePost] = useState(false);

    // まとめ告知文（日付昇順・全件）
    const schedulePostText = useMemo(() => {
        if (futurePerformances.length === 0) return "";
        const sorted = [...futurePerformances]
            .filter((p) => p.status !== "canceled")
            .sort((a, b) => (a.event_date ?? "").localeCompare(b.event_date ?? ""));
        return buildSchedulePost({
            performances: sorted.map((p) => ({
                event_date: p.event_date,
                venue_name: p.venue_name,
                open_time: p.open_time,
                start_time: p.start_time,
                event_title: p.event_title,
                act_name: normalizeAct(p)?.name ?? null,
            })),
            profileName,
        });
    }, [futurePerformances, profileName]);

    const toggleDone = async (performanceId: string, taskKey: string) => {
        const row = prepByPerformanceId[performanceId]?.[taskKey];
        if (!row) return;

        try {
            await updatePrepTaskDone({
                taskId: row.id,
                nextDone: !row.is_done,
                userId,
            });
        } catch (e) {
            console.error("prep update error", e);
        }
    };

    const renderCard = (p: PerformanceWithActs) => (
        <PerformanceCard
            key={p.id}
            p={p}
            flyer={flyerByPerformanceId[p.id]}
            details={detailsByPerformanceId[p.id]}
            tasks={prepByPerformanceId[p.id] ?? {}}
            prepDefs={PREP_DEFS}
            todayDate={todayDate}
            normalizeAct={normalizeAct}
            detailsSummary={detailsSummary}
            parseYmdLocal={parseYmdLocal}
            addDays={addDays}
            fmtMMdd={fmtMMdd}
            statusText={statusText}
            onToggleDone={toggleDone}
        />
    );

    return (
        <div>
            {/* 未来 */}
            <section className="space-y-2">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-gray-800">これからのライブ</h2>
                    {futurePerformances.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setShowSchedulePost((v) => !v)}
                            className="inline-flex items-center rounded border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                            {showSchedulePost ? "閉じる" : "まとめて告知文"}
                        </button>
                    )}
                </div>

                {showSchedulePost && schedulePostText && (
                    <SharePostPreview text={schedulePostText} title="ライブスケジュール告知文" />
                )}

                {futurePerformances.length === 0 ? (
                    <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">未来のライブはまだありません。</div>
                ) : (
                    <div className="space-y-4">
                        {/* 要対応セクション */}
                        {actionRequired.length > 0 && (
                            <div className="space-y-3">
                                <p className="text-xs font-medium text-gray-500">要対応</p>
                                {actionRequired.map(renderCard)}
                            </div>
                        )}

                        {/* 確定済みセクション */}
                        {confirmedAll.length > 0 && (
                            <div className="space-y-3">
                                {actionRequired.length > 0 && (
                                    <p className="text-xs font-medium text-gray-500">確定済み</p>
                                )}
                                {confirmedVisible.map(renderCard)}
                                {confirmedHidden.length > 0 && (
                                    <>
                                        {showMoreConfirmed && confirmedHidden.map(renderCard)}
                                        <button
                                            type="button"
                                            onClick={() => setShowMoreConfirmed((v) => !v)}
                                            className="w-full rounded-lg border border-dashed border-gray-300 bg-white py-2 text-xs text-gray-500 hover:bg-gray-50"
                                        >
                                            {showMoreConfirmed
                                                ? "▲ 折りたたむ"
                                                : `▼ 先の予定をさらに ${confirmedHidden.length} 件表示`}
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </section>

            {/* 過去 */}
            <section className="space-y-2 mt-4">
                <h2 className="text-sm font-semibold text-gray-800">過去のライブ</h2>

                {pastPerformances.length === 0 ? (
                    <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">まだライブの記録がありません。</div>
                ) : (
                    <div className="space-y-2">
                        {pastPerformances.map((p) => {
                            const venue = p.venue_name ? `@ ${p.venue_name}` : "@（未設定）";
                            const act = normalizeAct(p);
                            const actName = act?.name ?? "出演名義：なし";

                            return (
                                <Link
                                    key={p.id}
                                    href={`/musician/performances/${p.id}`}
                                    className="block rounded-lg border bg-white px-3 py-3 hover:bg-gray-50"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <div className="text-sm font-semibold truncate">
                                                {p.event_date} <span className="text-gray-700 font-normal">{venue}</span>
                                            </div>
                                            <div className="text-base font-bold truncate">{actName}</div>
                                            {p.memo && <div className="mt-1 text-xs text-gray-600 whitespace-pre-wrap">{p.memo}</div>}
                                        </div>

                                        <span className="shrink-0 text-[11px] text-gray-400">詳細</span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}
