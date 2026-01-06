// app/musician/songs/[songId]/SongDetailClient.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { makeSongMemoTemplate } from "@/lib/utils/templates";
import SongMemoEditor from "@/components/songs/SongMemoEditor";
import SongAssetsBox from "@/components/songs/SongAssetsBox";
import { useRouter } from "next/navigation";
import { ActRow, deleteSong, getSongById, SongRow, updateSong } from "./page";
type Props = {
  songId: string
  song: SongRow
  act?: ActRow
}

export default function SongDetailClient({songId, song, act }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [memo, setMemo] = useState("");
  const didInit = useRef(false);

  const templateText = useMemo(() => makeSongMemoTemplate(), []);
  const [deleting, setDeleting] = useState(false);
  // setMemo(song.memo ?? "");
  // 空なら自動挿入（初回だけ）
  useEffect(() => {
   if (!memo.trim()) {
      setMemo(templateText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ templateText]);

  const save = async () => {
    if (!song) return;
    setSaving(true);
    try {
      const trimmed = memo.trim();
      const updated = await updateSong({ ...song, memo: trimmed ? trimmed : null});
      song = updated; 

      alert("保存しました。");
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <main className="text-sm text-gray-500">読み込み中…</main>;

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
    // songId が act_songs.id である設計ならそのまま使える
    // もし songId が別キーなら、ここは song?.id を使う
    const targetId = song.id;

    const ok = window.confirm(
      "この曲を削除します。\n譜面・音源などの添付（assets）がある場合、それも削除されます。\n本当に実行しますか？"
    );
    if (!ok) return;

    setDeleting(true);
    try {
      // ✅ CASCADEが無い場合は先に assets を消す
      // CASCADEがあるなら、このブロックは消してOK
      // {
      //   const { error: aErr } = await supabase
      //     .from("act_song_assets")
      //     .delete()
      //     .eq("act_song_id", targetId);
      //   if (aErr) throw new Error(aErr.message);
      // }

      // ✅ 曲本体を削除
      {
        deleteSong(song.id);
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
  const changed = (song.memo ?? "") !== memo;

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
        <SongMemoEditor initialText={memo} />
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
