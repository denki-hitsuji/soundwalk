"use client";

import type { VenueTally } from "@/lib/utils/history";

const MAX_VENUES = 5;

type Props = {
  ranking: VenueTally[];
};

export default function FrequentVenues({ ranking }: Props) {
  const venues = ranking.slice(0, MAX_VENUES);
  if (venues.length === 0) return null;

  const [home, ...rest] = venues;

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-700">何度も帰ってきた場所</h2>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <p className="font-serif text-sm leading-relaxed text-gray-700">
          {home.name}には、{home.count}回。
          <br />
          あなたのホームみたいな場所。
        </p>

        {rest.length > 0 && (
          <ul className="mt-4 space-y-1.5 border-t pt-3">
            {rest.map((v) => (
              <li key={v.name} className="flex items-baseline justify-between text-sm text-gray-600">
                <span>{v.name}</span>
                <span className="text-xs text-gray-400">{v.count}回、帰った</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
