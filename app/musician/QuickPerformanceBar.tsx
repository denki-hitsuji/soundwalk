"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toYmdLocal, parseYmdLocal, addDaysLocal, diffDaysLocal } from "@/lib/utils/date";
import { getMyActs } from "@/lib/api/acts";

type ActOption = { id: string; name: string; act_type: string | null };

export default function QuickPerformanceBar() {
  const router = useRouter();

  const today = useMemo(() => toYmdLocal(), []);
  const [eventDate, setEventDate] = useState(today);
  const [venueName, setVenueName] = useState("");
  const [actId, setActId] = useState("");

  const [acts, setActs] = useState<ActOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await getMyActs();
      const list = (data ?? []) as ActOption[];
      setActs(list);
      // 初回は先頭を選んでおく（ワンクリック減）
      if (!actId && list.length > 0) setActId(list[0].id);

      setLoading(false);
    };

    void load();
    // actId は依存に入れない（初回自動選択のため）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goNewWithPrefill = () => {
    const qs = new URLSearchParams();
    if (eventDate) qs.set("date", eventDate);
    if (actId) qs.set("actId", actId);
    if (venueName.trim()) qs.set("venue", venueName.trim());

    router.push(`/musician/performances/new?${qs.toString()}`);
  };

  const noActs = !loading && acts.length === 0;

  return (
    <section className="rounded-xl border bg-white px-4 py-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">
            まずは1件、ライブを記録してみましょう
          </div>
          <div className="text-xs text-gray-600 mt-0.5">
            今日でも過去でもOK。あとから整えられます。
          </div>
        </div>
        <button
          type="button"
          onClick={goNewWithPrefill}
          disabled={loading || noActs}
          className="shrink-0 inline-flex items-center rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        >
          この内容で記録
        </button>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-4">
        {/* 日付 */}
        <label className="block">
          <span className="text-[11px] text-gray-500">日付</span>
          <input
            type="date"
            className="mt-1 w-full rounded border px-2 py-1 text-sm"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />
        </label>

        {/* 出演名義 */}
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-500">出演名義</span>
            <Link
              href="/musician/acts"
              className="text-[11px] text-blue-600 hover:underline"
            >
              追加/編集
            </Link>
          </div>

          {loading ? (
            <div className="mt-1 rounded border px-2 py-1 text-sm text-gray-400">
              読み込み中…
            </div>
          ) : noActs ? (
            <div className="mt-1 rounded border px-2 py-1 text-sm text-red-600">
              まだ名義がありません
            </div>
          ) : (
            <select
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={actId}
              onChange={(e) => setActId(e.target.value)}
            >
              {acts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                  {a.act_type ? `（${a.act_type}）` : ""}
                </option>
              ))}
            </select>
          )}

          {noActs && (
            <div className="mt-1 text-[11px] text-gray-600">
              まずは{" "}
              <Link href="/musician/acts" className="text-blue-600 underline">
                出演名義
              </Link>{" "}
              を1つ作ると、ライブ記録がスムーズになります。
            </div>
          )}
        </div>

        {/* 会場 */}
        <label className="block md:col-span-2">
          <span className="text-[11px] text-gray-500">会場（任意）</span>
          <input
            type="text"
            placeholder="例: NINETY EAST / 水戸駅前ストリート"
            className="mt-1 w-full rounded border px-2 py-1 text-sm"
            value={venueName}
            onChange={(e) => setVenueName(e.target.value)}
          />
        </label>
      </div>
    </section>
  );
}
