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

export function PerformancesClient({ userId, performances, flyerByPerformanceId, detailsByPerformanceId, prep, profileName}: Prop) {
    // const [prepByPerformanceId, setPrepByPerformanceId ] = useState<PrepMap>({});

    const prepByPerformanceId = prep;
    const rank = (s: string | null) => (s === "offered" ? 0 : s === "pending_reconfirm" ? 1 : 2);
    const todayStr = useMemo(() => toYmdLocal(), []);
    const todayDate = useMemo(() => parseYmdLocal(todayStr), [todayStr]);
    const futurePerformances = useMemo(
        () => performances.filter((p) => p.event_date >= todayStr),
        [performances, todayStr],
    );
    const pastPerformances = useMemo(
        () => performances.filter((p) => p.event_date < todayStr),
        [performances, todayStr],
    );

    const [showSchedulePost, setShowSchedulePost] = useState(false);

    // まとめ告知文（日付昇順）
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
            const updated = await updatePrepTaskDone({
                taskId: row.id,
                nextDone: !row.is_done,
                userId,
            });

            // setPrepByPerformanceId((prev) => ({
            //     ...prev,
            //     [updated.performance_id]: {
            //         ...(prev[updated.performance_id] ?? {}),
            //         [updated.task_key]: updated,
            //     },
            // }));
        } catch (e) {
            console.error("prep update error", e);
        }
    };

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
                    <div className="space-y-3">
                        {[...futurePerformances].sort((a, b) => {
                            const r = rank(a.status) - rank(b.status);
                            if (r !== 0) return r;
                            return (b.event_date ?? "").localeCompare(a.event_date ?? "");
                        }).map((p) => {
                            const flyer = flyerByPerformanceId[p.id];
                            const d = detailsByPerformanceId[p.id];
                            const tasks = prepByPerformanceId[p.id] ?? {};

                            return (
                                <PerformanceCard
                                    key={p.id}
                                    p={p}
                                    flyer={flyer}
                                    details={d}
                                    tasks={tasks}
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
                        })}
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
