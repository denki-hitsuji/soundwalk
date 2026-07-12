// lib/db/eventAttachments.ts
import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session.server";
import { EventAttachmentRow } from "@/lib/utils/eventAttachments";

const BUCKET = "event-attachments";

/**
 * イベントのフライヤー一覧を取得
 */
export async function getEventAttachmentsDb(params: {
  eventId: string;
}): Promise<EventAttachmentRow[]> {
  const { eventId } = params;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("event_attachments")
    .select("id, event_id, file_url, file_path, file_type, caption, created_at, uploaded_by_profile_id")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * イベントにフライヤーをアップロード
 * 企画者のみ実行可能
 */
export async function uploadEventFlyerDb(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  // 認証チェック
  const user = await getCurrentUser();
  const userId = user?.id;
  if (!userId) throw new Error("ログインが必要です");

  const eventId = String(formData.get("eventId") ?? "");
  const file = formData.get("file");

  if (!eventId) throw new Error("eventIdが指定されていません");
  if (!(file instanceof File)) throw new Error("ファイルが見つかりません");

  // 企画者チェック
  const { data: event, error: evErr } = await supabase
    .from("events")
    .select("id, organizer_profile_id")
    .eq("id", eventId)
    .single();

  if (evErr || !event) throw new Error("イベントが見つかりません");
  if (event.organizer_profile_id !== userId) {
    throw new Error("企画者のみがフライヤーをアップロードできます");
  }

  // 拡張子検証
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const safeExt = ["png", "jpg", "jpeg", "webp", "gif"].includes(ext) ? ext : "bin";
  const path = `${eventId}/${crypto.randomUUID()}.${safeExt}`;

  // ストレージにアップロード
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type });

  if (upErr) throw new Error(upErr.message);

  // 公開URLを取得
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const fileUrl = pub.publicUrl;

  // DBに記録
  const { error: insErr } = await supabase.from("event_attachments").insert({
    event_id: eventId,
    file_url: fileUrl,
    file_path: path,
    file_type: "flyer",
    caption: null,
    uploaded_by_profile_id: userId,
  });

  if (insErr) throw new Error(insErr.message);
}

/**
 * イベントのフライヤーを削除
 * 企画者のみ実行可能
 */
export async function deleteEventAttachmentDb(params: {
  eventId: string;
  attachmentId: string;
}) {
  const supabase = await createSupabaseServerClient();

  // 認証チェック
  const user = await getCurrentUser();
  const userId = user?.id;
  if (!userId) throw new Error("ログインが必要です");

  // 企画者チェック
  const { data: event, error: evErr } = await supabase
    .from("events")
    .select("id, organizer_profile_id")
    .eq("id", params.eventId)
    .single();

  if (evErr || !event) throw new Error("イベントが見つかりません");
  if (event.organizer_profile_id !== userId) {
    throw new Error("企画者のみがフライヤーを削除できます");
  }

  // まずfile_pathを取る
  const { data: row, error: selErr } = await supabase
    .from("event_attachments")
    .select("id, file_path")
    .eq("id", params.attachmentId)
    .eq("event_id", params.eventId)
    .single();

  if (selErr) throw new Error(selErr.message);

  // DB削除
  const { error: delErr } = await supabase
    .from("event_attachments")
    .delete()
    .eq("id", params.attachmentId)
    .eq("event_id", params.eventId);

  if (delErr) throw new Error(delErr.message);

  // storage削除（失敗は致命じゃない）
  if (row?.file_path) {
    const { error: stErr } = await supabase.storage.from(BUCKET).remove([row.file_path]);
    if (stErr) console.warn("storage remove failed", stErr);
  }
}
