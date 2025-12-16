import { supabase } from "@/lib/supabaseClient";
export type ActOption = {
  id: string;
  name: string;
  act_type: string | null;
};

export async function getMyActsForSelect() {
  // act_members から、自分が所属している act を引く（共有対応）
  const { data, error } = await supabase
    .from("act_members")
    .select(
      `
      act:acts (
        id,
        name,
        act_type
      )
    `
    )
    .eq("profile_id", (await supabase.auth.getUser()).data.user?.id ?? "")
    .eq("status", "active");

  if (error) throw error;

  // join が配列/単体で揺れる可能性があるので安全に正規化
  const acts: ActOption[] = [];
  for (const row of data ?? []) {
    const a = (row as any).act;
    const act = Array.isArray(a) ? a[0] : a;
    if (act?.id && act?.name) acts.push(act);
  }

  // 重複除去（念のため）
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
