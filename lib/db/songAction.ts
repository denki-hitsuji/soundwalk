"use server";
import { SongRow, updateSongDb } from "@/lib/db/songs";
/**
 * ✅ Server Action: 曲を追加（/lib/db/songs の updateSong をサーバー側で叩く）
 * - Clientから渡せるのは「string等のプレーン」だけ
 * - 返すのも「プレーンな object」だけ
 */
export async function addSongAction(actId: string, title: string) {

  const t = title.trim();
  if (!t) throw new Error("曲名を入力してください");

  // updateSong が「insert/upsert」想定のまま使えるならそれでOK
  const data = await updateSongDb({ act_id: actId, title: t } as SongRow);

  // 念のため、返すのはプレーンオブジェクト化（null prototype対策にもなる）
  return JSON.parse(JSON.stringify(data)) as SongRow;
}