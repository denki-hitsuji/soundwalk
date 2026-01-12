"use server"
import { uploadActPhotoDb, deletePhotoDataAndStorageDb, createActInviteDb, deleteActByIdDb, ensureMyDefaultActDb, insertActDb, updateActDb } from "../db/acts";
import { ActRow } from "../utils/acts";
import { BookingWithDetails } from "../utils/bookings";

// デフォルトActを保証：なければ作る

export async function uploadActPhoto(actId: string, file: File): Promise<string> {
  return await uploadActPhotoDb(actId, file);
}
export async function deletePhotoDataAndStorage(act: ActRow) {
  return await deletePhotoDataAndStorageDb(act);
}
export async function createActInvite(params: {
    p_act_id: string;
    p_grant_admin: boolean;
    p_expires_in_days: number;
    p_max_uses: number;
}): Promise<any> {
  return await createActInviteDb(params);
}
export async function deleteActById(actId: string) {
  return await deleteActByIdDb(actId);
}
export async function insertAct(params: {
  name: string,
  act_type: string,
  description: string,
  is_temporary: boolean,
  photo_url: string | null,
  profile_link_url: string | null,
  icon_url: string | null,
}): Promise<{
    id: string;
}>{
  return await insertActDb(params);
 }

export async function ensureMyDefaultAct(): Promise<ActRow> {
  return await ensureMyDefaultActDb();
}
export async function updateAct(act: Partial<ActRow> & { id: string }) {
  return await updateActDb(act);
}