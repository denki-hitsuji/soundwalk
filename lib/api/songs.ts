"use server"
import {
  listSongAssetsDb,
  uploadSongAssetDb,
  deleteSongAssetDb,
  getSignedUrlDb,
  SongAssetRow,
} from "@/lib/db/songAssets";
export type { SongRow } from "@/lib/db/songs";
import {
    getMySongs as getMySongsDb, getSongsByActIds as getSongsByActIdsDb,
    addSong as addSongDb, deleteSong as deleteSongDb, getSongById as getSongsByIdDb,
    updateSong as updateSongDb,
    SongRow
} from "@/lib/db/songs"

export async function getMySongs(actId: string) {
    return await getMySongsDb(actId);
}

export async function getSongsByActIds(actIds: string[]) {
    return await getSongsByActIdsDb(actIds);
}

export async function addSong(actId: string , title: string) {
    return await addSongDb(actId, title);
}

export async function deleteSong(songId: string) {
    return await deleteSongDb(songId);
}

export async function getSongById(songId: string) {
    return await getSongsByIdDb(songId);
}

export async function getSignedUrl(objectPath: string, expiresInSec: number) {
    return await getSignedUrlDb(objectPath, expiresInSec);
}

export async function deleteSongAsset(asset: SongAssetRow) {
    return await deleteSongAssetDb(asset)
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
export async function listSongAssets(songId: string) {
  return await listSongAssetsDb(songId);
}