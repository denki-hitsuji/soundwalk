"use client";

import Link from "next/link";
import { useCurrentAct } from "@/lib/useCurrentAct"; // ← あなたの実パスに合わせて
import { NextPerformanceSection } from "@/components/performances/NextPerformanceSection";
import { SongSummaryCard } from "@/components/songs/SongSummaryCard";
// import { QuickPerformanceBar } from "@/components/performances/QuickPerformanceBar"; // あるなら

export default function DashboardClient() {
  const { currentActId, loading } = useCurrentAct();

  if (loading) return null;

  return (
    <div className="">
      {/* ★最上部：次回ライブ */}
      <NextPerformanceSection />

      {/* 例：クイック入力 */}
      {/* <QuickPerformanceBar /> */}

      {/* 演奏できる曲（act 選択UIがあるなら initialActId 無くてもOK） */}
      <SongSummaryCard />

      {/* 例：導線など */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-white shadow-sm">
          <h2 className="text-sm font-semibold mb-1">ライブタイムライン</h2>
          <p className="text-xs text-gray-600 mb-3">
            未来のライブはフライヤーと段取りをまとめて確認できます。
          </p>
          <Link
            href="/musician/performances"
            className="inline-flex items-center rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white"
          >
            タイムラインを見る
          </Link>
        </div>
      </div>
    </div>
  );
}
