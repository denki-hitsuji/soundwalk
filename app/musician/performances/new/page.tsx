// app/musician/performances/new/page.tsx
import { Suspense } from "react";
import NewPerformanceClient from "./NewPerformanceClient";

export default function Page() {
  return (
    <Suspense
      fallback={<main className="p-4 text-sm text-gray-500">読み込み中…</main>}
    >
      <NewPerformanceClient />
    </Suspense>
  );
}
