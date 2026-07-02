import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session.server";
import { getMyHistory } from "@/lib/api/history";
import {
  groupIntoMemories,
  buildHistorySummary,
  buildOpeningNarration,
  buildMemoryNarration,
} from "@/lib/utils/history";
import HistoryClient from "./HistoryClient";

export default async function HistoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const perfs = await getMyHistory(); // 昇順・canceled除外済み
  const summary = buildHistorySummary(perfs);
  const memories = groupIntoMemories(perfs).map((m) => ({
    memory: m,
    narration: buildMemoryNarration(m),
  }));
  const opening = buildOpeningNarration(summary);

  // すべて plain object（Date やクラスを渡さない）にしてクライアントへ
  return <HistoryClient opening={opening} summary={summary} memories={memories} />;
}
