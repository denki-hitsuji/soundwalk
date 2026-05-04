import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session.server";
import { getPerformancesInRangeDb } from "@/lib/db/performances";
import { getMyActs } from "@/lib/api/acts";
import { getRehearsalsInRange } from "@/lib/api/rehearsals";
import { toYmdLocal } from "@/lib/utils/date";
import CalendarClient from "./CalendarClient";

type SearchParams = Promise<{ month?: string }>;

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // ?month=YYYY-MM があればその月、なければ今月を基準にする
  const { month } = await searchParams;
  const base = month ? new Date(`${month}-01`) : new Date();
  const baseYear = base.getFullYear();
  const baseMonth = base.getMonth();

  const startDate = toYmdLocal(new Date(baseYear, baseMonth, 1));
  const endDate = toYmdLocal(new Date(baseYear, baseMonth + 1, 0));

  // パフォーマンスデータ・リハーサル・出演名義を取得
  const [performances, rehearsals, myActs] = await Promise.all([
    getPerformancesInRangeDb({ startDate, endDate }),
    getRehearsalsInRange({ startDate, endDate }),
    getMyActs(),
  ]);

  return (
    <CalendarClient
      performances={performances}
      rehearsals={rehearsals}
      myActs={myActs}
      userId={user.id}
      initialMonth={`${baseYear}-${String(baseMonth + 1).padStart(2, "0")}`}
    />
  );
}
