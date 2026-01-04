import { NextPerformanceSectionServer } from "@/components/performances/NextPerformanceSection.server";
import { DashboardSongsSection } from "@/components/songs/DashboardSongsSection"
import { SongSummaryCard } from "@/components/songs/SongSummaryCard";

export default function MusicianDashboardPage() {
  return (
    <main className="w-full mx-auto">
      <NextPerformanceSectionServer />
      <SongSummaryCard />
    </main>
  );
}
