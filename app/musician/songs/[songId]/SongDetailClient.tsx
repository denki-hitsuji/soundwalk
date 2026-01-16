// app/musician/songs/[songId]/SongDetailClient.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { makeSongMemoTemplate } from "@/lib/utils/templates";
import SongMemoEditor from "@/components/songs/SongMemoEditor";
import SongAssetsBox from "@/components/songs/SongAssetsBox";
import { useRouter } from "next/navigation";
import { deleteSong, updateSong } from "@/lib/api/songsAction";
import { SongRow } from "@/lib/db/songs";
import { ActRow } from "@/lib/utils/acts";
type Props = {
  songId: string
  song: SongRow
  act?: ActRow
}

export default function SongDetailClient({songId, song, act }: Props) {
  const router = useRouter();

  const templateText = useMemo(() => makeSongMemoTemplate(), []);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  // setMemo(song.memo ?? "");
  // 空なら自動挿入（初回だけ）
  useEffect(() => {
   if (!song.memo?.trim()) {
      song.memo = templateText;
    }
  }, [ templateText]);

  const save = async (text:string) => {
    if (!song) return;
    // console.log("before update" + text);
    try {
      const trimmed = text.trim();
      const updated = await updateSong({ ...song, memo: trimmed ? trimmed : null});
      song = updated; 
      // console.log("after update " + JSON.stringify(song));

      alert("保存しました。");
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  if (!song) {
    return (
      <main className="space-y-2">
        <p className="text-sm text-red-600">曲が見つかりませんでした。</p>
        <Link href="/musician/songs" className="text-sm text-blue-700 underline">
          一覧へ戻る
        </Link>
      </main>
    );
  }

  const deleteSongLocally = async () => {
    window.alert("tap"); // これが出ないなら「クリックが届いてない」
    const ok = window.confirm(
      "この曲を削除します。\n譜面・音源などの添付（assets）がある場合、それも削除されます。\n本当に実行しますか？"
    );
    if (!ok) return;

    setDeleting(true);
    try {
      // ✅ 曲本体を削除
      {
        await deleteSong(song.id);
      }

      alert("削除しました。");
      router.push("/musician/songs");
      router.refresh();
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "削除に失敗しました");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className="flex flex-col gap-4 min-h-[calc(100vh-64px)]">
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-gray-500">{act ? `${act.name}${act.act_type ? `（${act.act_type}）` : ""}` : "名義"}</div>
          <h1 className="text-xl font-bold">{song.title}</h1>
        </div>

        <Link href="/musician/songs" className="text-xs text-blue-700 underline underline-offset-2">
          一覧へ
        </Link>
      </header>

      <section className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
        <SongMemoEditor initialText={song.memo} onSave={save}/>
      </section>

      <SongAssetsBox actSongId={song.id} />

            {/* 危険操作：ページ下部に置くのが無難 */}
      <section className="rounded border bg-white p-4">
        <div className="text-sm font-semibold text-gray-900">危険操作</div>
        <p className="mt-1 text-xs text-gray-600">
          この曲を削除すると元に戻せません。
        </p>

        <div className="mt-3">
          <button
            type="button"
            onClick={() => void deleteSongLocally()}
            disabled={deleting}
            className={[
              "inline-flex items-center rounded px-3 py-2 text-xs font-semibold",
              "border border-red-600 text-red-700 hover:bg-red-50",
              deleting ? "opacity-60" : "",
            ].join(" ")}
          >
            {deleting ? "削除中…" : "この曲を削除"}
          </button>
        </div>
      </section>
    </main>
  );
}
