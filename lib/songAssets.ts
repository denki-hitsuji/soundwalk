// lib/songAssets.ts
import { supabase } from "@/lib/supabase/client";

// UUID生成のpolyfill（crypto.randomUUID非対応環境用）
function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// MIMEタイプの正規化（Supabase Storage対応）
function normalizeMimeType(file: File): string {
  // audio/x-m4a は Supabase Storage でサポートされていないため audio/mp4 に正規化
  if (file.type === "audio/x-m4a" || (file.type === "" && file.name.toLowerCase().endsWith(".m4a"))) {
    return "audio/mp4";
  }
  return file.type;
}

export type SongAssetRow = {
  id: string;
  act_song_id: string;
  uploader_profile_id: string;
  bucket: string;
  object_path: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  asset_kind: string;
  created_at: string;
};

const BUCKET = "song-assets";

// 方針：10MB、動画NG、whitelist、音声はmp3推奨（m4aも可）
export const SONG_ASSET_MAX_BYTES = 10 * 1024 * 1024;

export const ALLOWED_MIME_TYPES = new Set<string>([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "audio/mpeg", // mp3
  "audio/mp4", // m4a
  "audio/x-m4a", // m4a (alternative MIME)
]);

export function validateSongAssetFile(file: File): string | null {
  if (!file) return "ファイルが選択されていません。";
  if (file.size > SONG_ASSET_MAX_BYTES) return "ファイルサイズが10MBを超えています。";

  const mimeType = normalizeMimeType(file);
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return `許可されていないファイル形式です: ${file.type || "unknown"}`;
  }

  const lower = file.name.toLowerCase();
  if (lower.endsWith(".mp4") || lower.endsWith(".mov") || lower.endsWith(".m4v") || lower.endsWith(".avi")) {
    return "動画ファイルはアップロードできません。";
  }
  return null;
}

function sanitizeFilename(name: string) {
  // パスとして安全な最低限
  return name.replace(/[^\w.\-() ]+/g, "_").slice(0, 80);
}

export async function listSongAssets(actSongId: string) {
  const { data, error } = await supabase
    .from("act_song_assets")
    .select("id, act_song_id, uploader_profile_id, bucket, object_path, original_filename, mime_type, size_bytes, asset_kind, created_at")
    .eq("act_song_id", actSongId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as SongAssetRow[];
}

export async function getSignedUrl(objectPath: string, expiresInSec = 60 * 10) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(objectPath, expiresInSec);
  if (error) throw error;
  return data.signedUrl;
}

export async function uploadSongAsset(params: {
  actSongId: string;
  file: File;
  assetKind: string;
}) {
  const { actSongId, file, assetKind } = params;

  const msg = validateSongAssetFile(file);
  if (msg) throw new Error(msg);

  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) throw new Error("ログインが必要です。");

  // 1) まずDB行を作るための asset id を生成
  const assetId = generateUUID();
  const safeName = sanitizeFilename(file.name);

  const objectPath = `songs/${actSongId}/${assetId}_${safeName}`;
  const mimeType = normalizeMimeType(file);

  // MIMEタイプが変更された場合は新しいFileオブジェクトを作成
  const uploadFile = file.type !== mimeType
    ? new File([file], file.name, {
        type: mimeType,
        lastModified: file.lastModified,
      })
    : file;

  // 2) Storage upload
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, uploadFile, {
      contentType: mimeType,
      upsert: false,
    });

  if (upErr) {
    console.error("Storage upload error:", upErr);
    throw upErr;
  }

  // 3) DB insert
  const { data, error } = await supabase
    .from("act_song_assets")
    .insert({
      id: assetId,
      act_song_id: actSongId,
      uploader_profile_id: uid,
      bucket: BUCKET,
      object_path: objectPath,
      original_filename: file.name,
      mime_type: mimeType,
      size_bytes: file.size,
      asset_kind: assetKind,
    })
    .select("id, act_song_id, uploader_profile_id, bucket, object_path, original_filename, mime_type, size_bytes, asset_kind, created_at")
    .single();

  if (error) {
    // DB insertに失敗したら、Storageを掃除（できる範囲で）
    await supabase.storage.from(BUCKET).remove([objectPath]);
    throw error;
  }

  return data as SongAssetRow;
}

export async function deleteSongAsset(asset: SongAssetRow) {
  // 1) DB delete (RLSで弾けるはず)
  const { error: dbErr } = await supabase
    .from("act_song_assets")
    .delete()
    .eq("id", asset.id);

  if (dbErr) throw dbErr;

  // 2) Storage delete（ここもRLS）
  const { error: stErr } = await supabase.storage.from(BUCKET).remove([asset.object_path]);
  if (stErr) throw stErr;
}
