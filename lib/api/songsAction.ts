"use server"
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addSongDb, deleteSongDb, updateSongDb } from "../db/songs";
import { SongRow } from "./songs";

export async function addSong(actId: string , title: string) {
    return await addSongDb(actId, title);
}

export async function deleteSong(songId: string) {
    await deleteSongDb(songId);
    revalidatePath("/musician/songs");
    redirect("/musician/songs");
}

export async function updateSong(song: SongRow) {
    return await updateSongDb(song);
}

