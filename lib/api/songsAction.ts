"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addSongDb, deleteSongDb, updateSongDb } from "@/lib/db/songs";
import type { SongRow } from "@/lib/db/songs";

function assertNonEmpty(name: string, v: unknown): string {
  const s = String(v ?? "").trim();
  if (!s) throw new Error(`${name} が不正です（空）`);
  return s;
}

/**
 * ✅ 追加（一覧の再描画が必要なら revalidate）
 */
export async function addSong(actId: string, title: string): Promise<SongRow> {
  const a = assertNonEmpty("actId", actId);
  const t = assertNonEmpty("title", title);

  const row = await addSongDb(a, t);
  revalidatePath("/musician/songs");
  // 画面遷移は呼び出し側で必要なら。削除ほど不安定要因が少ないので redirect は必須ではない。
  return JSON.parse(JSON.stringify(row)) as SongRow;
}

/**
 * ✅ 更新
 * - id が空/undefined なら即 throw（今回の事故をここで止める）
 */
export async function updateSong(song: Pick<SongRow, "id" | "act_id" | "title" | "memo">): Promise<SongRow> {
  const id = assertNonEmpty("song.id", (song as any)?.id);
  const actId = assertNonEmpty("song.act_id", (song as any)?.act_id);
  const title = assertNonEmpty("song.title", (song as any)?.title);
  const memo = (song as any)?.memo;

  const row = await updateSongDb({ id, act_id: actId, title, memo } as SongRow);
  revalidatePath("/musician/songs");
  return JSON.parse(JSON.stringify(row)) as SongRow;
}

/**
 * ✅ 削除（破壊的操作なので server redirect に統一）
 */
export async function deleteSong(songId: string): Promise<never> {
  const id = assertNonEmpty("songId", songId);

  await deleteSongDb(id);

  revalidatePath("/musician/songs");
  redirect("/musician/songs");
}
/**
 * ✅ Server Action: 曲を追加（insert）
 * - actId/title は必須
 * - 新規追加で updateSongDb を呼ばない（id undefined 地雷回避）
 */
export async function addSongAction(actId: string, title: string): Promise<SongRow> {
  const a = (actId ?? "").trim();
  const t = (title ?? "").trim();

  if (!a) throw new Error("actId が不正です（空）");
  if (!t) throw new Error("曲名を入力してください");

  // DB層に「追加」を明示
  const row = await addSongDb(a, t);

  // 念のため、RSC境界で安全なプレーン化
  return JSON.parse(JSON.stringify(row)) as SongRow;
}