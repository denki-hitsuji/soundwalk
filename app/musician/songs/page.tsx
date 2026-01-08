// app/musician/songs/page.tsx
"use server"
import { getCurrentUser } from "@/lib/auth/session.server";
import SongsPageClient from "./SongsPageClient";
import { getMyActs, getMyMemberActs } from "@/lib/api/acts";

export default async function SongsPage() {
  const user = await getCurrentUser();
  const acts = await getMyActs();
  const memberActs = await getMyMemberActs();
  
  return <SongsPageClient
    userId={ user? user.id : null}
    acts={acts}
    memberActIds= {new Set(memberActs.map(a => a.id))}
  />;
}
