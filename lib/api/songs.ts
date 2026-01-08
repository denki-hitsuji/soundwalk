"use server"
import {
  listSongAssetsDb,
  deleteSongAssetDb,
  getSignedUrlDb,
  SongAssetRow,
} from "@/lib/db/songAssets";
import { getMySongsDb, getSongByIdDb, getSongsByActIdsDb } from "@/lib/db/songs";
export type { SongRow } from "@/lib/db/songs";


export async function getMySongs(actId: string) {
    return await getMySongsDb(actId);
}

export async function getSongsByActIds(actIds: string[]) {
    return await getSongsByActIdsDb(actIds);
}


export async function getSongById(songId: string) {
    return await getSongByIdDb(songId);
}

export async function getSignedUrl(objectPath: string, expiresInSec: number) {
    return await getSignedUrlDb(objectPath, expiresInSec);
}

export async function deleteSongAsset(asset: SongAssetRow) {
    return await deleteSongAssetDb(asset)
}

export async function listSongAssets(songId: string) {
  return await listSongAssetsDb(songId);
}