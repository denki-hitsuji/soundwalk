"use client";

import type { HistorySummary, Memory, Narration } from "@/lib/utils/history";
import HistoryOpening from "@/components/history/HistoryOpening";
import MemoryStream from "@/components/history/MemoryStream";
import HistoryMap from "@/components/history/HistoryMap";
import FrequentVenues from "@/components/history/FrequentVenues";
import ActJourneys from "@/components/history/ActJourneys";

type Props = {
  opening: Narration;
  summary: HistorySummary;
  memories: { memory: Memory; narration: Narration }[];
};

export default function HistoryClient({ opening, summary, memories }: Props) {
  const empty = summary.totalCount === 0;

  return (
    <main className="space-y-6">
      <HistoryOpening opening={opening} summary={summary} />

      {empty ? (
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-600">
            これからの足跡が、ここに増えていきます。
          </p>
        </div>
      ) : (
        <>
          <MemoryStream memories={memories} />
          <HistoryMap points={summary.mapPoints} />
          <FrequentVenues ranking={summary.venueRanking} />
          <ActJourneys journeys={summary.actJourneys} />
        </>
      )}
    </main>
  );
}
