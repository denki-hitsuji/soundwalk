"use server";
import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// 本人の過去ライブ全件（acts / venues / attachments を join した生データ）。
// status での除外は行わない（正規化側で isCanceledStatus により両綴りを弾く）。
export async function getMyPastPerformancesRawDb(params: {
  profileId: string;
  todayYmd: string;
}) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("musician_performances")
    .select(
      `
      id, event_date, status, act_id, venue_id, venue_name, open_time, start_time,
      acts:acts ( id, name, act_type, photo_url, icon_url ),
      venues:venues ( id, name, short_name, city, prefecture, latitude, longitude ),
      attachments:performance_attachments ( file_url, file_type, caption, created_at )
    `
    )
    .eq("profile_id", params.profileId)
    .lte("event_date", params.todayYmd)
    .order("event_date", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}
