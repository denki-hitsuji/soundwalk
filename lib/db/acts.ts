// lib/actQueries.ts
import { getCurrentUser, supabase } from "@/lib/auth/session";;
import { toYmdLocal } from "@/lib/utils/date";
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

// このユーザーの acts 一覧(オーナー・メンバー両方)
export async function getMyActs(): Promise<ActRow[]> {
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
  const user = await getCurrentUser();
  if (!user) throw new Error("ログインが必要です");

  const { data, error } = await supabase
    .from("v_my_acts")
    .select("*")
    .eq("owner_profile_id", user.id);

  if (error) throw error;
  return (data ?? []) as ActRow[];
}

// このユーザーの acts 一覧(オーナーのみ)
export async function getMyMemberActs(): Promise<ActRow[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error("ログインが必要です");

  const { data, error } = await supabase
    .from("v_my_acts")
    .select("*")
    .neq("owner_profile_id", user.id);

  if (error) throw error;
  return (data ?? []) as ActRow[];
}

// デフォルトActを保証：なければ作る
export async function ensureMyDefaultAct(): Promise<ActRow> {
  const user = await getCurrentUser();
  if (!user) throw new Error("ログインが必要です");

  // 既にあるか確認
  const acts = (await getMyActs()).filter((a) => a.owner_profile_id === user.id);
  if (acts.length > 0) return acts[0];

  // なければ作る
  const defaultName = "My Act"; // あとでユーザー名から決めてもいい

  const { data, error } = await supabase
    .from("v_my_acts")
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

export async function updateAct(act : Partial<ActRow> & { id: string }) {
  const { id, ...patch } = act;
  const { error } = await supabase
    .from("acts")
    .update(patch)
    .eq("id", id);

  if (error) throw error;
  const inserted = { id: id, ...patch } as ActRow;

  return inserted;
}
export async function getNextPerformance() {
  const today = toYmdLocal();

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
    // 例: https://xxx.supabase.co/storage/v1/object/public/act-photos/<PATH>
    const marker = "/storage/v1/object/public/act-photos/";
    const idx = url.indexOf(marker);
    if (idx < 0) return; // 形式が違うなら諦める
    const path = url.slice(idx + marker.length).split("?")[0]; // クエリ除去
    await supabase.storage.from("act-photos").remove([path]);
  };

export async function uploadActPhoto(actId: string, file: File): Promise<string> {
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
export async function getActById(actId: string): Promise<ActRow> {
  const { data, error } = await supabase
    .from("acts")
    .select("*")
    .eq("id", actId)
    .single();

  if (error) throw error;
  return data as ActRow;
}
export async function getActsByIds(actIds: string[]) {
  const { data, error } = await supabase
    .from("acts")
    .select("id, name, act_type")
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
  const { data, error } = await supabase.rpc("create_act_invite", params);
  if (error) throw error;
  return data;
  
}