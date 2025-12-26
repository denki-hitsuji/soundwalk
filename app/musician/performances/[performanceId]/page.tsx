// app/musician/performances/[performanceId]/page.tsx
import { Suspense } from "react";
import PerformanceDetailClient from "./PerformanceDetailClient";
import Link from "next/link";

type Props = {
  params: Promise<{ performanceId: string }>;
};

export default async function Page({ params }: Props) {
  const { performanceId } = await params;

  return (
    <Suspense fallback={<main className="text-sm text-gray-500">読み込み中…</main>}>
      <PerformanceDetailClient performanceId={performanceId} />
      <Link
        href="/musician/performances"
        className="shrink-0 inline-flex items-center rounded bg-gray-800 px-3 py-1.5 text-xs font-medium text-white"
      >
        タイムラインへ
      </Link>
    </Suspense>
  );
}
