import { getMyActs, getMyMemberActs, getMyOwnerActs } from "@/lib/api/acts";
import { ActRow, normalizeAct } from "@/lib/utils/acts";
import ActsClient from "./ActsClient";
import { getCurrentUser } from "@/lib/auth/session.server";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page( ) {
  const user = await getCurrentUser();
  if (!user) throw Error("ログイン情報が見つかりません。");
  const userId = user?.id;
  const myActs: ActRow[] = await getMyActs();
  const myOwnerActs: ActRow[] = await getMyOwnerActs();
  const myMemberActs: ActRow[] = await getMyMemberActs();

  return <ActsClient userId={String(userId)} myActs={myActs} myOwnerActs={myOwnerActs} myMemberActs={myMemberActs}  />;
}
