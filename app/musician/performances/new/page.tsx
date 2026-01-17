// app/musician/performances/new/page.tsx
import { Suspense } from "react";
import NewPerformanceClient from "./NewPerformanceClient";
import { getCurrentUser } from "@/lib/auth/session.server";
import { getMyActs, getMyMemberActs } from "@/lib/api/acts";
import { redirect } from "next/navigation";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const myActs = await getMyActs();
  return (
    <Suspense
      fallback={<main className="p-4 text-sm text-gray-500">読み込み中…</main>}
    >
      <NewPerformanceClient userId={user?.id} myActs={myActs}/>
    </Suspense>
  );
}
