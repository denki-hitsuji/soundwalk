"use server";

import {
  deleteSongAssetDb,
  getSignedUrlDb,
  listSongAssetsDb,
  uploadSongAssetDb,
} from "@/lib/db/songAssets";
import type { SongAssetRow } from "@/lib/utils/songAssets";

export type { SongAssetRow } from "@/lib/utils/songAssets";

export async function listSongAssetsAction(actSongId: string) {
  return listSongAssetsDb(actSongId);
}

export async function getSignedUrlAction(objectPath: string, expiresInSec = 60 * 10) {
  return getSignedUrlDb(objectPath, expiresInSec);
}

export async function uploadSongAssetAction(params: {
  actSongId: string;
  file: File;
  assetKind: string;
}) {
  return uploadSongAssetDb(params);
}

export async function deleteSongAssetAction(asset: SongAssetRow) {
  return deleteSongAssetDb(asset);
}
