// app/musician/performances/[performanceId]/page.tsx
import { Suspense } from "react";
import PerformanceDetailClient from "./PerformanceDetailClient";

type Props = {
  params: Promise<{ performanceId: string }>;
};

export default async function Page({ params }: Props) {
  const { performanceId } = await params;

  return (
    <Suspense fallback={<main className="p-4 text-sm text-gray-500">読み込み中…</main>}>
      <PerformanceDetailClient performanceId={performanceId} />
    </Suspense>
  );
}
