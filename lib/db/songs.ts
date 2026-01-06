// lib/songQueries.ts
import "server-only"
import { getCurrentUser } from "../auth/session.server";
import { createSupabaseServerClient } from "../supabase/server";
import { getMyActs } from "@/lib/api/acts";
export type SongRow = {
  id: string;
  act_id: string;
  title: string;
  created_at: string | null;
  memo: string | null;
};

export type ActOption = {
  id: string;
  name: string;
  act_type: string | null;
};

export async function getMyActsForSelect() {
  const user = await getCurrentUser();
  if (!user) return []; // ★ここが重要（uuid "" を投げない）

  const members = await getMyActs();

  const acts: ActOption[] = [];
  for (const row of members ?? []) {
    const a = (row as any).act;
    const act = Array.isArray(a) ? a[0] : a;
    if (act?.id && act?.name) acts.push(act);
  }

  const uniq = new Map<string, ActOption>();
  for (const a of acts) uniq.set(a.id, a);
  return Array.from(uniq.values());
}

export async function getMySongs(actId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("act_songs")
    .select("id, title, act_id, created_at")
    .eq("act_id", actId)
    .order("created_at", { ascending: false })

  if (error) throw error;
  return data as SongRow[] ?? [];
}

export async function getRecentSongs(actId: string, limit = 2) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("act_songs")
    .select("id, title, created_at")
    .eq("act_id", actId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as SongRow[] ?? [];
}

export async function getSongCount(actId: string) {
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("act_songs")
    .select("*", { count: "exact", head: true })
    .eq("act_id", actId);

  if (error) throw error;
  return count ?? 0;
}

export async function getSongById(songId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("act_songs")
    .select("*")
    .eq("id", songId)
    .single();

  if (error) throw error;
  return data as SongRow;
}

export async function addSong(actId: string, title: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("act_songs").insert({
    act_id: actId,
    title,
  });

  if (error) throw error;
  const added = await supabase
    .from("act_songs")
    .select("*")
    .eq("act_id", actId)
    .eq("title", title)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  return added.data as SongRow;
}

export async function updateSong(song: SongRow) {
  const supabase = await createSupabaseServerClient();
  const { id, title } = song;
  const { error } = await supabase
    .from("act_songs")
    .update({ title })
    .eq("id", id);
  if (error) throw error;
  return song;
}

export async function deleteSong(songId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("act_songs").delete().eq("id", songId);
  if (error) throw error;
}

export async function getSongsByActIds(actIds: string[]) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("act_songs")
    .select("id, act_id, title, created_at")
    .in("act_id", actIds)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as SongRow[] ?? [];
}