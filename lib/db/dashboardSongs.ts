// lib/db/dashboardSongs.ts
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getDashboardSongs(limit = 10) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("act_songs")
    .select(`
      id,
      title,
      created_at,
      acts (
        id,
        name
      )
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}
