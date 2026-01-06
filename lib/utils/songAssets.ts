import { validateSongAssetFile as validateSongAssetFileDb } from "../db/songAssets";

export async function validateSongAssetFile(file: File): Promise<string | null >{
    return await validateSongAssetFileDb({ file });
}
export {
  type SongAssetRow,
} from "@/lib/db/songAssets";

// 方針：10MB、動画NG、whitelist、音声はmp3のみ
export const SONG_ASSET_MAX_BYTES = 10 * 1024 * 1024;

export const ALLOWED_MIME_TYPES = new Set<string>([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "audio/mpeg", // mp3
]);