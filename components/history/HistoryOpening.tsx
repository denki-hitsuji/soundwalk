"use client";

import type { HistorySummary, Narration } from "@/lib/utils/history";

type Props = {
  opening: Narration;
  summary: HistorySummary;
};

export default function HistoryOpening({ opening, summary }: Props) {
  const hasHistory = summary.totalCount > 0;

  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm">
      <h1 className="font-serif text-xl font-bold leading-relaxed text-gray-900">
        {opening.title}
      </h1>
      <div className="mt-3 space-y-1">
        {opening.lines.map((line, i) => (
          <p key={i} className="font-serif text-sm leading-relaxed text-gray-600">
            {line}
          </p>
        ))}
      </div>

      {hasHistory && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-gray-50 px-3 py-2 text-center">
            <div className="text-lg font-semibold text-gray-800">{summary.totalCount}</div>
            <div className="text-[11px] text-gray-500">立ったステージ</div>
          </div>
          <div className="rounded-xl bg-gray-50 px-3 py-2 text-center">
            <div className="text-lg font-semibold text-gray-800">{summary.venueCount}</div>
            <div className="text-[11px] text-gray-500">巡った場所</div>
          </div>
          <div className="rounded-xl bg-gray-50 px-3 py-2 text-center">
            <div className="text-lg font-semibold text-gray-800">
              {summary.activeYears >= 1 ? `約${summary.activeYears}年` : "1年目"}
            </div>
            <div className="text-[11px] text-gray-500">歩いてきた時間</div>
          </div>
        </div>
      )}
    </section>
  );
}
