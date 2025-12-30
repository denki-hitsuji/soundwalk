// lib/actQueries.ts
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/supabaseClient";
import { toYmdLocal } from "./dateUtils";
export type ActRow = {
  id: string;
  name: string;
  act_type: string | null;
  owner_profile_id: string;
  is_temporary: boolean;
  description: string | null;
  icon_url: string | null;
  photo_url: string | null;
  profile_link_url: string | null;
};

export type DetailsRow = {
  performance_id: string;
  load_in_time: string | null;
  set_start_time: string | null;
  set_end_time: string | null;
  set_minutes: number | null;
  customer_charge_yen: number | null;
  one_drink_required: boolean | null;
  notes: string | null;
};

export type AttachmentRow = {
  id: string;
  file_url: string;
  file_path: string | null;
  file_type: string;
  caption: string | null;
  created_at: string;
  performance_id: string;
};

export type MessageRow = {
    id: string;
    body: string;
    source: string | null;
    created_at: string;
};

export type MyAct = {
  id: string;
  name: string;
  act_type: string;
  owner_profile_id: string;
  description: string | null;
  icon_url: string | null;
};

// このユーザーの acts 一覧
export async function getMyActs(): Promise<ActRow[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error("ログインが必要です");

  const { data, error } = await supabase
    .from("acts")
    .select("*")
    .eq("owner_profile_id", user.id)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ActRow[];
}

// デフォルトActを保証：なければ作る
export async function ensureMyDefaultAct(): Promise<ActRow> {
  const user = await getCurrentUser();
  if (!user) throw new Error("ログインが必要です");

  // 既にあるか確認
  const acts = await getMyActs();
  if (acts.length > 0) return acts[0];

  // なければ作る
  const defaultName = "My Act"; // あとでユーザー名から決めてもいい

  const { data, error } = await supabase
    .from("acts")
    .insert({
      name: defaultName,
      act_type: "solo",
      owner_profile_id: user.id,
      description: null,
      icon_url: null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as ActRow;
}

export async function getNextPerformance() {
  const today = toYmdLocal();

  const { data, error } = await supabase
    .from("performances")
    .select(`
      id,
      event_date,
      venue_name,
      memo,
      flyer_url,
      acts (
        id,
        name,
        act_type
      )
    `)
    .gte("event_date", today)
    .order("event_date", { ascending: true })
    .limit(1);

  if (error) throw error;

  // 0 or 1 件
  return data?.[0] ?? null;
}
