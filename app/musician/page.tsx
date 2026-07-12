import { NextPerformanceSectionServer } from "@/components/performances/NextPerformanceSection.server";
import { SongSummaryCard } from "@/components/songs/SongSummaryCard";
import { getCurrentUser } from "@/lib/auth/session.server";
import { redirect } from "next/navigation";

export default async function MusicianDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <main className="w-full mx-auto">
      <NextPerformanceSectionServer />
      <SongSummaryCard />
    </main>
  );
}
