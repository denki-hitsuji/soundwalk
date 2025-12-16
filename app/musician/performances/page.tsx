"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type PerformanceRow = {
  id: string;
  event_date: string; // YYYY-MM-DD
  venue_name: string | null;
  memo: string | null;
  act_id: string | null;
};

type ActRow = {
  id: string;
  name: string;
  act_type: string | null;
};

type PerformanceWithActs = PerformanceRow & {
  // あなたの環境では join が単体で返るケースがあるので両対応にして正規化する
  acts: ActRow | ActRow[] | null;
};

type FlyerMap = Record<string, { file_url: string; created_at: string }>;

type DetailsRow = {
  performance_id: string;
  load_in_time: string | null;
  set_start_time: string | null;
  set_end_time: string | null;
  set_minutes: number | null;
  customer_charge_yen: number | null;
  one_drink_required: boolean | null;
};
type DetailsMap = Record<string, DetailsRow>;

type PrepTaskRow = {
  id: string;
  performance_id: string;
  task_key: string; // announce_2w | announce_1w | announce_1d
  act_id: string | null;
  due_date: string; // YYYY-MM-DD
  is_done: boolean;
  done_at: string | null;
  done_by_profile_id: string | null;
};
type PrepMap = Record<string, Record<string, PrepTaskRow>>; // prep[performanceId][task_key] = row

function padTimeHHMM(t: string | null) {
  if (!t) return null;
  return t.slice(0, 5);
}

function detailsSummary(d?: DetailsRow) {
  if (!d) return "未登録（入り/出番/チャージ）";

  const loadIn = padTimeHHMM(d.load_in_time);
  const start = padTimeHHMM(d.set_start_time);
  const end = padTimeHHMM(d.set_end_time);
  const minutes = d.set_minutes ?? null;
  const charge = d.customer_charge_yen ?? null;
  const oneDrink = d.one_drink_required;

  const parts: string[] = [];
  if (loadIn) parts.push(`入り ${loadIn}`);
  if (start && end) parts.push(`出番 ${start}-${end}`);
  else if (start) parts.push(`出番 ${start}`);
  if (minutes !== null) parts.push(`${minutes}分`);
  if (charge !== null) parts.push(`¥${charge.toLocaleString()}`);
  if (oneDrink === true) parts.push("1Dあり");
  if (oneDrink === false) parts.push("1Dなし");

  return parts.length > 0 ? parts.join(" / ") : "未登録（入り/出番/チャージ）";
}

function parseLocalDate(yyyyMMdd: string) {
  return new Date(`${yyyyMMdd}T00:00:00`);
}
function fmtMMdd(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${m}/${day}`;
}
function addDays(date: Date, deltaDays: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + deltaDays);
  return d;
}
function diffDays(a: Date, b: Date) {
  return Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}
function statusText(target: Date, today: Date) {
  const dd = diffDays(target, today);
  if (dd < 0) return "期限超過";
  if (dd === 0) return "今日";
  return `あと${dd}日`;
}

const PREP_DEFS = [
  { key: "announce_2w", label: "告知（2週前）", offsetDays: -14 },
  { key: "announce_1w", label: "告知（1週前）", offsetDays: -7 },
  { key: "announce_1d", label: "告知（前日）", offsetDays: -1 },
] as const;

function normalizeAct(p: PerformanceWithActs): ActRow | null {
  const a = p.acts;
  if (!a) return null;
  return Array.isArray(a) ? a[0] ?? null : a;
}

export default function PerformancesPage() {
  const [loading, setLoading] = useState(true);

  const [userId, setUserId] = useState<string | null>(null);

  const [performances, setPerformances] = useState<PerformanceWithActs[]>([]);
  const [flyerByPerformanceId, setFlyerByPerformanceId] = useState<FlyerMap>({});
  const [detailsByPerformanceId, setDetailsByPerformanceId] = useState<DetailsMap>({});
  const [prepByPerformanceId, setPrepByPerformanceId] = useState<PrepMap>({});

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const todayDate = useMemo(() => parseLocalDate(todayStr), [todayStr]);

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
        const { data } = await supabase.auth.getUser();
        setUserId(data.user?.id ?? null);
      }

      // 1) ライブ一覧（acts も一緒）
      const { data, error } = await supabase
        .from("musician_performances")
        .select(
          `
          id,
          event_date,
          venue_name,
          memo,
          act_id,
          acts:acts ( id, name, act_type )
        `,
        )
        .order("event_date", { ascending: false });

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
          .filter((p) => p.event_date >= todayStr)
          .flatMap((p) => {
            const eventDate = parseLocalDate(p.event_date);
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

    const nextDone = !row.is_done;
    const payload = nextDone
      ? { is_done: true, done_at: new Date().toISOString(), done_by_profile_id: userId }
      : { is_done: false, done_at: null, done_by_profile_id: null };

    const { data, error } = await supabase
      .from("performance_prep_tasks")
      .update(payload)
      .eq("id", row.id)
      .select("id, performance_id, task_key, act_id, due_date, is_done, done_at, done_by_profile_id")
      .single();

    if (error) {
      console.error("prep update error", error);
      return;
    }

    const updated = data as PrepTaskRow;
    setPrepByPerformanceId((prev) => ({
      ...prev,
      [updated.performance_id]: {
        ...(prev[updated.performance_id] ?? {}),
        [updated.task_key]: updated,
      },
    }));
  };

  if (loading) {
    return <main className="p-4 text-sm text-gray-500">読み込み中…</main>;
  }

  return (
    <main className="p-4 space-y-6">
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
            {futurePerformances.map((p) => {
              const flyer = flyerByPerformanceId[p.id];
              const d = detailsByPerformanceId[p.id];
              const venue = p.venue_name ? `@ ${p.venue_name}` : "@（未設定）";
              const act = normalizeAct(p);
              const actName = act?.name ?? "出演名義：なし";
              const summary = detailsSummary(d);

              const tasks = prepByPerformanceId[p.id] ?? {};

              return (
                <Link
                  key={p.id}
                  href={`/musician/performances/${p.id}`}
                  className="block rounded-xl border bg-white shadow-sm hover:bg-gray-50"
                >
                  <div className="p-3 flex gap-3">
                    {flyer ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={flyer.file_url}
                        alt="フライヤー"
                        className="h-24 w-24 rounded object-cover border"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-24 w-24 rounded border bg-gray-50 flex items-center justify-center text-[11px] text-gray-400">
                        flyerなし
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">
                        {p.event_date} <span className="text-gray-700 font-normal">{venue}</span>
                      </div>
                      <div className="text-base font-bold truncate">{actName}</div>

                      <div className="mt-2 text-xs text-gray-700 truncate">{summary}</div>

                      {/* 段取り（永続化＆共有） */}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {PREP_DEFS.map((def) => {
                          const row = tasks[def.key];
                          // row がまだ無いことは基本ないが保険
                          const due = row?.due_date ? parseLocalDate(row.due_date) : addDays(parseLocalDate(p.event_date), def.offsetDays);
                          const dueLabel = fmtMMdd(due);

                          const done = row?.is_done === true;
                          const stat = done ? "済" : statusText(due, todayDate);

                          return (
                            <button
                              key={def.key}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault(); // Link遷移を止める
                                e.stopPropagation();
                                void toggleDone(p.id, def.key);
                              }}
                              className={[
                                "inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px]",
                                done ? "bg-gray-100 text-gray-600" : "bg-white text-gray-800",
                              ].join(" ")}
                              title="クリックで済/未済を切り替え"
                            >
                              <span className="text-gray-500">{dueLabel}</span>
                              <span className={done ? "line-through" : ""}>{def.label}</span>
                              <span className="text-gray-500">({stat})</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-1 text-[11px] text-gray-500">
                        タップで詳細（フライヤー/案内文/確認事項） / 段取りはここでチェック可
                      </div>
                    </div>
                  </div>
                </Link>
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
