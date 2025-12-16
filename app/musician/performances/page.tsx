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

type PerformanceWithAct = PerformanceRow & {
  acts:  ActRow[];
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

function padTimeHHMM(t: string | null) {
  if (!t) return null;
  return t.slice(0, 5); // "19:30:00" -> "19:30"
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

// ===== 段取り（表示のみ） =====
function parseLocalDate(yyyyMMdd: string) {
  // 文字列だけのDateはタイムゾーン罠があるので固定
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
  // a - b （日単位）
  const ms = a.getTime() - b.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

type PrepItem = {
  key: string;
  label: string;
  date: Date;
};

function getPrepItems(eventDateStr: string): PrepItem[] {
  const eventDate = parseLocalDate(eventDateStr);

  return [
    { key: "2w", label: "告知（2週前）", date: addDays(eventDate, -14) },
    { key: "1w", label: "告知（1週前）", date: addDays(eventDate, -7) },
    { key: "1d", label: "告知（前日）", date: addDays(eventDate, -1) },
  ];
}

function prepStatusText(target: Date, today: Date) {
  const dd = diffDays(target, today);
  if (dd < 0) return "済";
  if (dd === 0) return "今日";
  return `あと${dd}日`;
}

export default function PerformancesPage() {
  const [loading, setLoading] = useState(true);
  const [performances, setPerformances] = useState<PerformanceWithAct[]>([]);
  const [flyerByPerformanceId, setFlyerByPerformanceId] = useState<FlyerMap>({});
  const [detailsByPerformanceId, setDetailsByPerformanceId] = useState<DetailsMap>({});

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

      // 1) ライブ一覧（acts も一緒）
      const { data, error } = await supabase
        .from("musician_performances")
        .select(`
  id,
  event_date,
  venue_name,
  memo,
  act_id,
  acts:acts ( id, name, act_type )
`)
        .order("event_date", { ascending: false });

      if (error) {
        console.error("load performances error", error);
        setPerformances([]);
        setFlyerByPerformanceId({});
        setDetailsByPerformanceId({});
        setLoading(false);
        return;
      }

      const list = (data ?? []) as PerformanceWithAct[];
      setPerformances(list);

      // 2) 未来のIDだけ抽出
      const futureIds = list.filter((p) => p.event_date >= todayStr).map((p) => p.id);

      if (futureIds.length === 0) {
        setFlyerByPerformanceId({});
        setDetailsByPerformanceId({});
        setLoading(false);
        return;
      }

      // 3) 未来分の代表フライヤー（最新1枚）
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
          if (!map[a.performance_id]) {
            map[a.performance_id] = { file_url: a.file_url, created_at: a.created_at };
          }
        }
        setFlyerByPerformanceId(map);
      }

      // 4) 未来分の確認事項（details）まとめ取得
      const { data: dets, error: detErr } = await supabase
        .from("performance_details")
        .select(
          "performance_id, load_in_time, set_start_time, set_end_time, set_minutes, customer_charge_yen, one_drink_required",
        )
        .in("performance_id", futureIds);

      if (detErr) {
        console.error("load future details error", detErr);
        setDetailsByPerformanceId({});
      } else {
        const dmap: DetailsMap = {};
        for (const d of dets ?? []) {
          dmap[d.performance_id] = d as DetailsRow;
        }
        setDetailsByPerformanceId(dmap);
      }

      setLoading(false);
    };

    void load();
  }, [todayStr]);

  if (loading) {
    return <main className="p-4 text-sm text-gray-500">読み込み中…</main>;
  }

  return (
    <main className="p-4 space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">ライブタイムライン</h1>
          <p className="text-xs text-gray-600 mt-1">
            未来のライブは「フライヤー + 入り/出番/チャージ + 段取り」を一覧で確認できます。
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
          <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">
            未来のライブはまだありません。
          </div>
        ) : (
          <div className="space-y-3">
            {futurePerformances.map((p) => {
              const flyer = flyerByPerformanceId[p.id];
              const d = detailsByPerformanceId[p.id];
              const venue = p.venue_name ? `@ ${p.venue_name}` : "@（未設定）";
              const actName = p.acts?.[0]?.name ?? "出演名義：なし";
              const summary = detailsSummary(d);
              const prep = getPrepItems(p.event_date);

              return (
                <Link
                  key={p.id}
                  href={`/musician/performances/${p.id}`}
                  className="block rounded-xl border bg-white shadow-sm hover:bg-gray-50"
                >
                  <div className="p-3 flex gap-3">
                    {/* 未来だけサムネ */}
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
                        {p.event_date}{" "}
                        <span className="text-gray-700 font-normal">{venue}</span>
                      </div>
                      <div className="text-base font-bold truncate">{actName}</div>

                      <div className="mt-2 text-xs text-gray-700 truncate">{summary}</div>

                      {/* 段取り（表示だけ） */}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {prep.map((it) => {
                          const status = prepStatusText(it.date, todayDate);
                          return (
                            <span
                              key={it.key}
                              className="inline-flex items-center gap-1 rounded border bg-white px-2 py-0.5 text-[11px] text-gray-700"
                              title={`${it.label}: ${fmtMMdd(it.date)} (${status})`}
                            >
                              <span className="text-gray-500">{fmtMMdd(it.date)}</span>
                              <span className="font-medium">{it.label}</span>
                              <span className="text-gray-500">({status})</span>
                            </span>
                          );
                        })}
                      </div>

                      <div className="mt-1 text-[11px] text-gray-500">
                        タップして詳細（フライヤー/案内文/確認事項）
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
          <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">
            まだライブの記録がありません。
          </div>
        ) : (
          <div className="space-y-2">
            {pastPerformances.map((p) => {
              const venue = p.venue_name ? `@ ${p.venue_name}` : "@（未設定）";
              const actName = p.acts?.[0]?.name ?? "出演名義：なし";

              return (
                <Link
                  key={p.id}
                  href={`/musician/performances/${p.id}`}
                  className="block rounded-lg border bg-white px-3 py-3 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">
                        {p.event_date}{" "}
                        <span className="text-gray-700 font-normal">{venue}</span>
                      </div>
                      <div className="text-base font-bold truncate">{actName}</div>
                      {p.memo && (
                        <div className="mt-1 text-xs text-gray-600 whitespace-pre-wrap">
                          {p.memo}
                        </div>
                      )}
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
