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

