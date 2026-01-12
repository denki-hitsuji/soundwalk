"use server"
import "server-only"
import { getCurrentUser } from "@/lib/auth/session.server";;
import { toYmdLocal } from "@/lib/utils/date";
import { createSupabaseServerClient } from "../supabase/server";
import { ActRow } from "../utils/acts";
import { getMyActs } from "../api/acts";

// このユーザーの acts 一覧(オーナー・メンバー両方)
export async function getMyActsDb(): Promise<ActRow[]> {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();
  if (!user) throw new Error("ログインが必要です");

  const { data, error } = await supabase
    .from("v_my_acts")
    .select("*")

  if (error) throw error;
  return (data ?? []) as ActRow[];
}

// このユーザーの acts 一覧(オーナーのみ)
export async function getMyOwnerActsDb(): Promise<ActRow[]> {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();
  if (!user) throw new Error("ログインが必要です");

  const { data, error } = await supabase
    .from("v_my_acts")
    .select("*")
    .eq("owner_profile_id", user.id);

  if (error) throw error;
  return (data ?? []) as ActRow[];
}

// このユーザーの acts 一覧(メンバーのみ)
export async function getMyMemberActsDb(): Promise<ActRow[]> {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();
  if (!user) throw new Error("ログインが必要です");

  const { data, error } = await supabase
    .from("v_my_acts")
    .select("*")
    .neq("owner_profile_id", user.id);

  if (error) throw error;
  return (data ?? []) as ActRow[];
}

export async function getNextPerformanceDb() {
  const today = toYmdLocal();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("v_my_performances")
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
  // “できる範囲で” storage から消す（photo_url しか無いので推測）
  const tryRemoveFromStorageByUrl = async (url: string) => {
  const supabase = await createSupabaseServerClient();
    // 例: https://xxx.supabase.co/storage/v1/object/public/act-photos/<PATH>
    const marker = "/storage/v1/object/public/act-photos/";
    const idx = url.indexOf(marker);
    if (idx < 0) return; // 形式が違うなら諦める
    const path = url.slice(idx + marker.length).split("?")[0]; // クエリ除去
    await supabase.storage.from("act-photos").remove([path]);
  };

export async function uploadActPhotoDb(actId: string, file: File): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const ext = file.name.split(".").pop() || "png";
  const filename = `${crypto.randomUUID()}.${ext}`;
  const path = `${actId}/${filename}`;

  const { error: upErr } = await supabase.storage
    .from("act-photos")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "image/png",
    });
  if (upErr) throw upErr;

  const { data } = supabase.storage.from("act-photos").getPublicUrl(path);
  const publicUrl = data.publicUrl;

  return publicUrl;
}

export async function deletePhotoDataAndStorageDb(act: ActRow) {
    if (!act.photo_url ) return;

    try {
      // 先にDBを消す（表示＆共有が一発で揃う）
      await updateActDb({ id: act.id, photo_url: null });

      // storage実ファイルは“ベスト努力”
      if (act.photo_url) {
        try {
          await tryRemoveFromStorageByUrl(act.photo_url);
        } catch (e) {
          // 消せなくても致命ではないので握りつぶす
          console.warn("remove storage file skipped:", e);
        }
      }

    } catch (e: any) {
      console.error(e);
    } 
}
export async function getActByIdDb(actId: string): Promise<ActRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("acts")
    .select("*")
    .eq("id", actId)
    .maybeSingle();

  if (error) throw error;
  if (data == null) return null;
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
export async function getActsByIdsDb(actIds: string[]) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("acts")
    .select("*")
    .in("id", actIds);  

  if (error) throw error;
  return data;
}

export async function createActInviteDb(params: {
  p_act_id: string,
  p_grant_admin: boolean,
  p_expires_in_days: number,
  p_max_uses: number,
}) { 
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_act_invite", params);
  if (error) throw error;
  return data;
  
}
export async function deleteActByIdDb(actId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("acts")
    .delete()
    .eq("id", actId);

  if (error) throw error;
}

export async function getAllActsDb(): Promise<ActRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("acts")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ActRow[];
}

export async function insertActDb(params: {
  name: string,
  act_type: string,
  description: string,
  is_temporary: boolean,
  photo_url: string | null,
  profile_link_url: string | null,
  icon_url: string | null,
}): Promise<{ id: string }> {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();
  const { data, error } = await supabase
      .from("acts")
    .insert({
      name: params.name,
      act_type: params.act_type,
      owner_profile_id: user?.id,
      description: params.description,
      is_temporary: params.is_temporary,
      photo_url: params.photo_url,
      profile_link_url: params.profile_link_url,
      icon_url: params.icon_url,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data as { id: string };
}
export async function ensureMyDefaultActDb(): Promise<ActRow> {
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

export async function updateActDb(act : Partial<ActRow> & { id: string }) {
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
