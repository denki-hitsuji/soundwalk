// app/musician/songs/[songId]/page.tsx
import { getSongById as getSongByIdDb } from "@/lib/api/songs";
import SongDetailClient from "./SongDetailClient";
import { getCurrentUser } from "@/lib/auth/session.server";
import { getMyActs } from "@/lib/api/acts";

export async function getSongById(songId: string){
  return await getSongByIdDb(songId);
}

export default async function SongDetailPage({ params }: { params: Promise<{ songId: string }> }) {
  const { songId } = await params;
  const user = await getCurrentUser();
  const song = await getSongById(songId);
  const act = (await getMyActs()).find(a => a.id === song.act_id);
  return <SongDetailClient songId={songId} song={song} act={act} />;
}
