import { supabase } from "@/lib/supabaseClient";

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
