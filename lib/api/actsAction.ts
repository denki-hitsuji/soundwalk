import { getCurrentUser } from "../auth/session.server";
import { createSupabaseServerClient } from "../supabase/server";
import { ActRow } from "../utils/acts";
import { getMyActs } from "./acts";

// デフォルトActを保証：なければ作る
export async function ensureMyDefaultAct(): Promise<ActRow> {
  const supabase = await createSupabaseServerClient();
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
  return {
    id: data.id,
    name: data.name,
    act_type: data.act_type,
    owner_profile_id: data.owner_profile_id,
    icon_url: data.icon_url,
    is_temporary: data.is_temporary,
    description: data.description,
    photo_url: data.photo_url,
    profile_link_url: data.profile_link_url
   } satisfies ActRow;
}

export async function updateAct(act : Partial<ActRow> & { id: string }) {
  const supabase = await createSupabaseServerClient();
  const { id, ...patch } = act;
  const { error } = await supabase
    .from("acts")
    .update(patch)
    .eq("id", id);

  if (error) throw error;
  const inserted = { id: id, ...patch } as ActRow;

  return inserted;
}