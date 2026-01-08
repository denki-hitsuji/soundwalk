"use server"
import { getCurrentUser } from "@/lib/auth/session.server";;
import { toYmdLocal } from "@/lib/utils/date";
import { createSupabaseServerClient } from "../supabase/server";
import { ActRow } from "../utils/acts";
import { updateAct } from "./actsAction";

// このユーザーの acts 一覧(オーナー・メンバー両方)
export async function getMyActs(): Promise<ActRow[]> {
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
export async function getMyOwnerActs(): Promise<ActRow[]> {
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
export async function getMyMemberActs(): Promise<ActRow[]> {
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

export async function getNextPerformance() {
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

export async function uploadActPhoto(actId: string, file: File): Promise<string> {
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

export async function deletePhotoDataAndStorage(act: ActRow) {
    if (!act.photo_url ) return;

    try {
      // 先にDBを消す（表示＆共有が一発で揃う）
      await updateAct({ id: act.id, photo_url: null });

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
export async function getActById(actId: string): Promise<ActRow | null> {
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
export async function getActsByIds(actIds: string[]) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("acts")
    .select("*")
    .in("id", actIds);  

  if (error) throw error;
  return data;
}

export async function createActInvite(params: {
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
export async function deleteActById(actId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("acts")
    .delete()
    .eq("id", actId);

  if (error) throw error;
}

export async function getAllActs(): Promise<ActRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("acts")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ActRow[];
}

export async function insertAct(params: {
  guestName: string;
  guestActType: string;
  ownerProfileId: string;
}): Promise<{ id: string }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
      .from("acts")
      .insert({
        name: params.guestName.trim(),
        act_type: params.guestActType,
        owner_profile_id: params.ownerProfileId, 
        is_temporary: true,
      })
      .select("id")
      .single();
  
  if (error) throw error;
  return data as { id: string };
}
function normalizeAct(a: ActRow | ActRow[] | null): ActRow | null {
  if (!a) return null;
  return Array.isArray(a) ? a[0] ?? null : a;
}
