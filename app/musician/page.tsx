"use server"
import { NextPerformanceSectionServer } from "@/components/performances/NextPerformanceSection.server";
import { DashboardSongsSection } from "@/components/songs/DashboardSongsSection"
import { SongSummaryCard } from "@/components/songs/SongSummaryCard";
import { getCurrentUser } from "@/lib/auth/session.server";
import DashboardClient from "./DashboardClient";
import { redirect } from "next/navigation";

export default async function MusicianDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("login");
  return (
    <main className="w-full mx-auto">
      <NextPerformanceSectionServer />
      <SongSummaryCard />
    </main>
  );
}
