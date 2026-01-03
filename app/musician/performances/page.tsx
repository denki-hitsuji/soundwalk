"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PerformanceCard } from "@/components/performances/PerformanceCard";
import {
  PREP_DEFS,
  normalizeAct,
  detailsSummary,
  statusText,
  type PerformanceWithActs,
  type FlyerMap,
  type DetailsRow,
  type DetailsMap,
  type PrepTaskRow,
  type PrepMap,
  getPerformances,
} from "@/lib/performanceUtils";

import { updatePrepTaskDone } from "@/lib/db/performanceWrites";
import { toYmdLocal, parseYmdLocal, addDaysLocal, diffDaysLocal, addDays, fmtMMdd } from "@/lib/utils/date";
import { get } from "http";
import { getCurrentUser, supabase } from "@/lib/auth/session";

export default function PerformancesPage() {
  const [loading, setLoading] = useState(true);

  const [userId, setUserId] = useState<string | null>(null);

  const [performances, setPerformances] = useState<PerformanceWithActs[]>([]);
  const [flyerByPerformanceId, setFlyerByPerformanceId] = useState<FlyerMap>({});
  const [detailsByPerformanceId, setDetailsByPerformanceId] = useState<DetailsMap>({});
  const [prepByPerformanceId, setPrepByPerformanceId] = useState<PrepMap>({});

  const todayStr = useMemo(() => toYmdLocal(), []);
  const todayDate = useMemo(() => parseYmdLocal(todayStr), [todayStr]);
  const rank = (s: string | null) => (s === "offered" ? 0 : s === "pending_reconfirm" ? 1 : 2);
  const futurePerformances = useMemo(
    () => performances.filter((p) => p.event_date >= todayStr),
    [performances, todayStr],
  );

  const pastPerformances = useMemo(
    () => performances.filter((p) => p.event_date < todayStr),
    [performances, todayStr],
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      // user id を先に取る（done_by に使う）
      {
        const data = await getCurrentUser();
        setUserId(data?.id ?? null);
      }

      // 1) ライブ一覧（acts も一緒）
      const { data, error } = await getPerformances();

      if (error) {
        console.error("load performances error", error);
        setPerformances([]);
        setFlyerByPerformanceId({});
        setDetailsByPerformanceId({});
        setPrepByPerformanceId({});
        setLoading(false);
        return;
      }

      const list = (data ?? []) as unknown as PerformanceWithActs[];

      list.sort((a, b) => {
        const r = rank(a.status) - rank(b.status);
        if (r !== 0) return r;
        return (b.event_date ?? "").localeCompare(a.event_date ?? "");
      });
      setPerformances(list);

      const futureIds = list.filter((p) => p.event_date >= todayStr).map((p) => p.id);
      if (futureIds.length === 0) {
        setFlyerByPerformanceId({});
        setDetailsByPerformanceId({});
        setPrepByPerformanceId({});
        setLoading(false);
        return;
      }

      // 2) 未来分の代表フライヤー（最新1枚）
      {
        const { data: atts, error: attErr } = await supabase
          .from("performance_attachments")
          .select("performance_id, file_url, created_at")
          .eq("file_type", "flyer")
          .in("performance_id", futureIds)
          .order("created_at", { ascending: false });

        if (attErr) {
          console.error("load future flyers error", attErr);
          setFlyerByPerformanceId({});
        } else {
          const map: FlyerMap = {};
          for (const a of atts ?? []) {
            if (!map[a.performance_id]) map[a.performance_id] = { file_url: a.file_url, created_at: a.created_at };
          }
          setFlyerByPerformanceId(map);
        }
      }

      // 3) 未来分の details
      {
        const { data: dets, error: detErr } = await supabase
          .from("performance_details")
          .select("performance_id, load_in_time, set_start_time, set_end_time, set_minutes, customer_charge_yen, one_drink_required")
          .in("performance_id", futureIds);

        if (detErr) {
          console.error("load future details error", detErr);
          setDetailsByPerformanceId({});
        } else {
          const dmap: DetailsMap = {};
          for (const d of dets ?? []) dmap[d.performance_id] = d as DetailsRow;
          setDetailsByPerformanceId(dmap);
        }
      }

      // 4) 段取りタスク：未来分を upsert（方式B）
      //    まず desired rows を作る → upsert → select して state に入れる
      {
        const desired = list
          .filter((p) => p.event_date >= todayStr && p.act_id && p.status !== "cancelled")
          .flatMap((p) => {
            const eventDate = parseYmdLocal(p.event_date);
            return PREP_DEFS.map((def) => {
              const due = addDays(eventDate, def.offsetDays);
              const dueStr = due.toISOString().slice(0, 10);
              return {
                performance_id: p.id,
                task_key: def.key,
                act_id: p.act_id, // performance.act_id が入ってれば共有が自然に揃う
                due_date: dueStr,
              };
            });
          });

        const { error: upErr } = await supabase
          .from("performance_prep_tasks")
          .upsert(desired, { onConflict: "performance_id,task_key" });

        if (upErr) {
          console.error("prep upsert error", upErr);
          setPrepByPerformanceId({});
        } else {
          const { data: tasks, error: tErr } = await supabase
            .from("performance_prep_tasks")
            .select("id, performance_id, task_key, act_id, due_date, is_done, done_at, done_by_profile_id")
            .in("performance_id", futureIds);

          if (tErr) {
            console.error("prep select error", tErr);
            setPrepByPerformanceId({});
          } else {
            const pm: PrepMap = {};
            for (const t of tasks ?? []) {
              const row = t as PrepTaskRow;
              pm[row.performance_id] ??= {};
              pm[row.performance_id][row.task_key] = row;
            }
            setPrepByPerformanceId(pm);
          }
        }
      }

      setLoading(false);
    };

    void load();
  }, [todayStr]);

  const toggleDone = async (performanceId: string, taskKey: string) => {
    const row = prepByPerformanceId[performanceId]?.[taskKey];
    if (!row) return;

    try {
      const updated = await updatePrepTaskDone({
        taskId: row.id,
        nextDone: !row.is_done,
        userId,
      });

      setPrepByPerformanceId((prev) => ({
        ...prev,
        [updated.performance_id]: {
          ...(prev[updated.performance_id] ?? {}),
          [updated.task_key]: updated,
        },
      }));
    } catch (e) {
      console.error("prep update error", e);
    }
  };

  if (loading) {
    return <main className="text-sm text-gray-500">読み込み中…</main>;
  }

  return (
    <main className="space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">ライブタイムライン</h1>
          <p className="text-xs text-gray-600 mt-1">
            未来のライブは「フライヤー + 確認事項 + 段取りチェック（共有）」を一覧で確認できます。
          </p>
        </div>

        <Link
          href="/musician/performances/new"
          className="shrink-0 inline-flex items-center rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white"
        >
          + 新規登録
        </Link>
      </header>

      {/* 未来 */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-800">これからのライブ</h2>

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
      <section className="space-y-2">
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
    </main>
  );
}
