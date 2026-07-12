"use client";

import type { ActJourney } from "@/lib/utils/history";
import { typeLabel } from "@/lib/utils/acts";

function fmtYearMonth(ymd: string) {
  const [y, m] = ymd.split("-");
  return `${y}年${Number(m)}月`;
}

type Props = {
  journeys: ActJourney[];
};

export default function ActJourneys({ journeys }: Props) {
  if (journeys.length === 0) return null;

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-700">名義それぞれの歩み</h2>
      <p className="text-xs text-gray-500">
        名義ごとに、歩幅は違っていい。
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {journeys.map((j) => {
          const cover = j.coverAttachment?.file_url ?? j.photoUrl;
          const samePeriod = j.firstDate === j.lastDate;
          return (
            <article
              key={j.actId ?? j.actName}
              className="overflow-hidden rounded-xl border bg-white shadow-sm"
            >
              {cover ? (
                <img
                  src={cover}
                  alt={`${j.actName}のフライヤー`}
                  loading="lazy"
                  className="h-28 w-full object-cover"
                />
              ) : (
                <div className="flex h-28 w-full items-center justify-center bg-gray-100 text-2xl text-gray-300">
                  🎵
                </div>
              )}
              <div className="space-y-1 p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-sm font-semibold text-gray-900">{j.actName}</h3>
                  <span className="shrink-0 text-[11px] text-gray-400">{typeLabel(j.actType)}</span>
                </div>
                <p className="text-xs text-gray-600">
                  {j.count}回、この名前でステージに立った。
                </p>
                <p className="text-[11px] text-gray-400">
                  {samePeriod
                    ? fmtYearMonth(j.firstDate)
                    : `${fmtYearMonth(j.firstDate)} 〜 ${fmtYearMonth(j.lastDate)}`}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
