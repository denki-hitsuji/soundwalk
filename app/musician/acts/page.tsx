import { useCurrentAct } from "@/lib/hooks/useCurrentAct";
import { ActRow, getMyActs, getMyMemberActs, getMyOwnerActs, updateAct as updateActDb } from "@/lib/api/acts";
import { getMyProfile } from "@/lib/api/profiles";
import ActsClient from "./ActsClient";

type MemberRow = {
  act_id: string;
  is_admin: boolean;
  status: string | null;
  acts: ActRow | ActRow[] | null;
};

function normalizeAct(a: ActRow | ActRow[] | null): ActRow | null {
  if (!a) return null;
  return Array.isArray(a) ? a[0] ?? null : a;
}

export function updateAct(act: ActRow) {
  updateActDb(act);
  return act;
}
export default async function Page( ) {
  const myActs: ActRow[] = await getMyActs();
  const myOwnerActs: ActRow[] = await getMyOwnerActs();
  const myMemberActs: ActRow[] = await getMyMemberActs();

  return <ActsClient myActs={myActs} myOwnerActs={myOwnerActs} myMemberActs={myMemberActs}  />;
}
