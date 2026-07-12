"use server"
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
