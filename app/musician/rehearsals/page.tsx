import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session.server";
import { getMyActs } from "@/lib/api/acts";
import { getRehearsalsForAct, getRehearsalsInRange } from "@/lib/api/rehearsals";
import { toYmdLocal } from "@/lib/utils/date";
import { RehearsalRow } from "@/lib/utils/rehearsals";
import RehearsalsClient from "./RehearsalsClient";

type SearchParams = Promise<{ actId?: string }>;

export default async function RehearsalsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { actId } = await searchParams;
  const myActs = await getMyActs();

  let rehearsals: RehearsalRow[] = [];
  if (actId) {
    rehearsals = await getRehearsalsForAct(actId);
  } else {
    // 所属全actのリハを取得（直近3ヶ月）
    const today = new Date();
    const startDate = toYmdLocal(new Date(today.getFullYear(), today.getMonth() - 3, 1));
    const endDate = toYmdLocal(new Date(today.getFullYear(), today.getMonth() + 3, 0));
    rehearsals = await getRehearsalsInRange({ startDate, endDate });
  }

  return (
    <RehearsalsClient
      rehearsals={rehearsals}
      myActs={myActs}
      currentProfileId={user.id}
      initialActId={actId ?? null}
    />
  );
}
