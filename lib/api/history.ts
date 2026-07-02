"use server";
import { getCurrentUser } from "@/lib/auth/session.server";
import { getMyPastPerformancesRawDb } from "@/lib/db/history";
import { normalizeHistoryRows, type HistoryPerformance } from "@/lib/utils/history";
import { toYmdLocal } from "@/lib/utils/date";

// 本人の過去ライブ履歴（event_date 昇順・canceled/cancelled 除外済み）
export async function getMyHistory(): Promise<HistoryPerformance[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error("ログインが必要です");
  const todayYmd = toYmdLocal();
  const raw = await getMyPastPerformancesRawDb({ profileId: user.id, todayYmd });
  return normalizeHistoryRows(raw);
}
