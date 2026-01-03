// lib/songQueries.ts

import { getCurrentUser, supabase } from "../auth/session";
import { getMyActs } from "./acts";

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


export async function getRecentSongs(actId: string, limit = 2) {
  const { data, error } = await supabase
    .from("act_songs")
    .select("id, title, created_at")
    .eq("act_id", actId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function getSongCount(actId: string) {
  const { count, error } = await supabase
    .from("act_songs")
    .select("*", { count: "exact", head: true })
    .eq("act_id", actId);

  if (error) throw error;
  return count ?? 0;
}

export async function addSong(actId: string, title: string) {
  const { error } = await supabase.from("act_songs").insert({
    act_id: actId,
    title,
  });

  if (error) throw error;
}
