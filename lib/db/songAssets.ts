import "server-only";

import { getCurrentUser } from "@/lib/auth/session.server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  normalizeSongAssetMimeType,
  SONG_ASSET_BUCKET,
  validateSongAssetFile,
  type SongAssetRow,
} from "@/lib/utils/songAssets";

function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w.\-() ]+/g, "_").slice(0, 80);
}

const SONG_ASSET_COLUMNS =
  "id, act_song_id, uploader_profile_id, bucket, object_path, original_filename, mime_type, size_bytes, asset_kind, created_at";

export async function listSongAssetsDb(actSongId: string): Promise<SongAssetRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("act_song_assets")
    .select(SONG_ASSET_COLUMNS)
    .eq("act_song_id", actSongId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as SongAssetRow[];
}

export async function getSignedUrlDb(objectPath: string, expiresInSec = 60 * 10): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.storage
    .from(SONG_ASSET_BUCKET)
    .createSignedUrl(objectPath, expiresInSec);
  if (error) throw error;
  return data.signedUrl;
}

export async function uploadSongAssetDb(params: {
  actSongId: string;
  file: File;
  assetKind: string;
}): Promise<SongAssetRow> {
  const { actSongId, file, assetKind } = params;
  const message = validateSongAssetFile(file);
  if (message) throw new Error(message);

  const user = await getCurrentUser();
  if (!user) throw new Error("ログインが必要です。");

  const supabase = await createSupabaseServerClient();
  const assetId = generateUUID();
  const safeName = sanitizeFilename(file.name);
  const objectPath = `songs/${actSongId}/${assetId}_${safeName}`;
  const mimeType = normalizeSongAssetMimeType(file);
  const uploadFile = file.type !== mimeType
    ? new File([file], file.name, { type: mimeType, lastModified: file.lastModified })
    : file;

  const { error: uploadError } = await supabase.storage
    .from(SONG_ASSET_BUCKET)
    .upload(objectPath, uploadFile, { contentType: mimeType, upsert: false });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("act_song_assets")
    .insert({
      id: assetId,
      act_song_id: actSongId,
      uploader_profile_id: user.id,
      bucket: SONG_ASSET_BUCKET,
      object_path: objectPath,
      original_filename: file.name,
      mime_type: mimeType,
      size_bytes: file.size,
      asset_kind: assetKind,
    })
    .select(SONG_ASSET_COLUMNS)
    .single();

  if (error) {
    await supabase.storage.from(SONG_ASSET_BUCKET).remove([objectPath]);
    throw error;
  }
  return data as SongAssetRow;
}

export async function deleteSongAssetDb(asset: SongAssetRow): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error: dbError } = await supabase
    .from("act_song_assets")
    .delete()
    .eq("id", asset.id);
  if (dbError) throw dbError;

  const { error: storageError } = await supabase.storage
    .from(SONG_ASSET_BUCKET)
    .remove([asset.object_path]);
  if (storageError) throw storageError;
}
