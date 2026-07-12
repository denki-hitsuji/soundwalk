import { Suspense } from "react";
import { NextPerformanceSectionServer } from "@/components/performances/NextPerformanceSection.server";
import { SongSummaryCard } from "@/components/songs/SongSummaryCard";
import SectionSkeleton from "@/components/layout/SectionSkeleton";
import { getCurrentUser } from "@/lib/auth/session.server";
import { redirect } from "next/navigation";

export default async function MusicianDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <main className="w-full mx-auto">
      <Suspense fallback={<SectionSkeleton />}>
        <NextPerformanceSectionServer />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <SongSummaryCard />
      </Suspense>
    </main>
  );
}
