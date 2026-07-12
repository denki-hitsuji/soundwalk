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

export const SONG_ASSET_BUCKET = "song-assets";
export const SONG_ASSET_MAX_BYTES = 10 * 1024 * 1024;

export const ALLOWED_MIME_TYPES = new Set<string>([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "audio/mpeg",
  "audio/mp4",
  "audio/x-m4a",
]);

export function normalizeSongAssetMimeType(file: File): string {
  if (file.type === "audio/x-m4a" || (file.type === "" && file.name.toLowerCase().endsWith(".m4a"))) {
    return "audio/mp4";
  }
  return file.type;
}

export function validateSongAssetFile(file: File): string | null {
  if (!file) return "ファイルが選択されていません。";
  if (file.size > SONG_ASSET_MAX_BYTES) return "ファイルサイズが10MBを超えています。";

  const mimeType = normalizeSongAssetMimeType(file);
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return `許可されていないファイル形式です: ${file.type || "unknown"}`;
  }

  const lower = file.name.toLowerCase();
  if ([".mp4", ".mov", ".m4v", ".avi"].some((extension) => lower.endsWith(extension))) {
    return "動画ファイルはアップロードできません。";
  }
  return null;
}
