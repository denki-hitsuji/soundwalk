import { uploadSongAssetDb } from "../db/songAssets";
import { addSongDb, deleteSongDb, updateSongDb } from "../db/songs";
import { SongRow } from "./songs";

export async function addSong(actId: string , title: string) {
    return await addSongDb(actId, title);
}

export async function deleteSong(songId: string) {
    return await deleteSongDb(songId);
}

export async function updateSong(song: SongRow) {
    return await updateSongDb(song);
}

export async function uploadSongAsset(formData: FormData) {
  const actSongId = String(formData.get("actSongId") ?? "");
  const assetKind = String(formData.get("assetKind") ?? "");
  const file = formData.get("file");

  if (!(file instanceof File)) throw new Error("file が不正です");
  return await uploadSongAssetDb({ actSongId, file, assetKind });
}