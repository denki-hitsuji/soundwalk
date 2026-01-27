import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session.server";
import { getPerformancesInRangeDb } from "@/lib/db/performances";
import { toYmdLocal } from "@/lib/utils/date";
import CalendarClient from "./CalendarClient";

export default async function CalendarPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // 現在月±2ヶ月の範囲を計算（計5ヶ月分）
  const today = new Date();
  const startDate = toYmdLocal(
    new Date(today.getFullYear(), today.getMonth() - 2, 1)
  );
  const endDate = toYmdLocal(
    new Date(today.getFullYear(), today.getMonth() + 3, 0)
  );

  // パフォーマンスデータ取得
  const performances = await getPerformancesInRangeDb({ startDate, endDate });

  return <CalendarClient performances={performances} />;
}
