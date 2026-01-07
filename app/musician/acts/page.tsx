import { getMyActs, getMyMemberActs, getMyOwnerActs, updateAct as updateActDb } from "@/lib/api/acts";
import { ActRow } from "@/lib/utils/acts";
import ActsClient from "./ActsClient";

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
