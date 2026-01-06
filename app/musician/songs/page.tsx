// app/musician/songs/page.tsx
"use server"
import { getCurrentUser } from "@/lib/auth/session.server";
import SongsPageClient from "./SongsPageClient";
import { getMyActs, getMyMemberActs } from "@/lib/api/acts";
import {addSong as addSongDB, getSongsByActIds as DBgetSongsByActIds, SongRow} from "@/lib/api/songs"
import { toString, toStringOrNull } from "@/lib/utils/convert";

export async function addSong(actId: string, title: string) {
  return addSongDB(actId, title);
}
export async function getSongsByActIds(actIds: string[]) : Promise<SongRow[]>{
  console.log(`fetching songs...`);
  const songs = await DBgetSongsByActIds(actIds);
  console.log(`songs: ${JSON.stringify(songs)}`)
  const obj = songs.map(s => {
    return {
      id: toString(s.id),
      act_id: toString(s.act_id),
      title: toString(s.title),
      created_at: toStringOrNull(s.created_at),
      memo: toStringOrNull(s.memo)
    }
  }) satisfies SongRow[];
  return obj;
}

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
