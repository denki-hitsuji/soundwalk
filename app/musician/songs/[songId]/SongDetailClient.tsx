// app/musician/songs/[songId]/SongDetailClient.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { makeSongMemoTemplate } from "@/lib/utils/templates";
import SongMemoEditor from "@/components/songs/SongMemoEditor";
import SongAssetsBox from "@/components/songs/SongAssetsBox";
import { deleteSong, updateSong } from "@/lib/api/songsAction";
import type { SongRow } from "@/lib/db/songs";
import type { ActRow } from "@/lib/utils/acts";
import { useRef } from "react";

type Props = {
  songId: string;
  song: SongRow;
  act?: ActRow;
};

export default function SongDetailClient({ songId, song, act }: Props) {
  // props を破壊しないため、表示・編集用のローカル state を持つ
  const [localSong, setLocalSong] = useState<SongRow>(song);

  const templateText = useMemo(() => makeSongMemoTemplate(), []);
  const initialMemo = useMemo(() => {
    return localSong.memo?.trim() ? localSong.memo : templateText;
  }, [localSong.memo, templateText]);

  const [savingMemo, setSavingMemo] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // タイトル編集 UI
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(localSong.title ?? "");
  const [savingTitle, setSavingTitle] = useState(false);

  const titleInputRef = useRef<HTMLInputElement | null>(null);
  if (!localSong) {
    return (
      <main className="space-y-2">
        <p className="text-sm text-red-600">曲が見つかりませんでした。</p>
        <Link href="/musician/songs" className="text-sm text-blue-700 underline">
          一覧へ戻る
        </Link>
      </main>
    );
  }

  const saveMemo = async (text: string) => {
    setSavingMemo(true);
    try {
      const trimmed = text.trim();
      const updated = await updateSong({
        ...localSong,
        memo: trimmed ? trimmed : null,
      });
      setLocalSong(updated);
      alert("保存しました。");
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "保存に失敗しました。");
    } finally {
      setSavingMemo(false);
    }
  };

  const beginEditTitle = () => {
    setTitleDraft(localSong.title ?? "");
    setIsEditingTitle(true);
  };

  const cancelEditTitle = () => {
    titleInputRef.current?.blur(); // ★ 重要
    setTitleDraft(localSong.title ?? "");
    setIsEditingTitle(false);
  };

  const saveTitle = async () => {
    const next = (titleDraft ?? "").trim();
    if (!next) {
      alert("曲名を入力してください。");
      return;
    }
    if (next === (localSong.title ?? "")) {
      titleInputRef.current?.blur(); // ★ 重要
      setIsEditingTitle(false);
      return;
    }

    setSavingTitle(true);
    try {
      const updated = await updateSong({
        ...localSong,
        title: next,
      });
      setLocalSong(updated);
      setIsEditingTitle(false);
      // alert("曲名を更新しました。");
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "曲名の更新に失敗しました。");
    } finally {
      setSavingTitle(false);
    }
  };

  const deleteSongLocally = async () => {
    const ok = window.confirm(
      "この曲を削除します。\n譜面・音源などの添付（assets）がある場合、それも削除されます。\n本当に実行しますか？"
    );
    if (!ok) return;

    setDeleting(true);
    try {
      // deleteSong は server redirect する想定
      await deleteSong(localSong.id);
    } catch (e: any) {
      // redirect() は内部的に例外を投げるので、ここに来ることがある
      if (typeof e?.digest === "string" && e.digest.startsWith("NEXT_REDIRECT")) {
        // UX的に明示したければ残してOK（不要なら消してもOK）
        alert("削除しました。");
        return;
      }
      console.error(e);
      alert(e?.message ?? "削除に失敗しました");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className="flex flex-col gap-4 min-h-[calc(100vh-64px)]">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-gray-500">
            {act ? `${act.name}${act.act_type ? `（${act.act_type}）` : ""}` : "名義"}
          </div>

          {/* タイトル表示 / 編集 */}
          {!isEditingTitle ? (
            <div className="flex items-baseline gap-3 min-w-0">
              <h1 className="text-xl font-bold truncate">{localSong.title}</h1>
              <button
                type="button"
                onClick={beginEditTitle}
                className="shrink-0 text-xs text-blue-700 underline underline-offset-2"
              >
                編集
              </button>
            </div>
          ) : (
            <div className="mt-1 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <input
                  value={titleDraft}
                  ref={titleInputRef}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void saveTitle();
                    if (e.key === "Escape") cancelEditTitle();
                  }}
                  autoFocus
                  className="w-full max-w-md rounded border px-3 py-2 text-sm"
                  placeholder="曲名"
                />
                <button
                  type="button"
                  onClick={() => void saveTitle()}
                  disabled={savingTitle}
                  className={[
                    "inline-flex items-center rounded px-3 py-2 text-xs font-semibold",
                    "bg-blue-600 text-white hover:bg-blue-700",
                    savingTitle ? "opacity-60" : "",
                  ].join(" ")}
                >
                  {savingTitle ? "保存中…" : "保存"}
                </button>
                <button
                  type="button"
                  onClick={cancelEditTitle}
                  disabled={savingTitle}
                  className="inline-flex items-center rounded px-3 py-2 text-xs font-semibold border hover:bg-gray-50"
                >
                  キャンセル
                </button>
              </div>
              <div className="text-[11px] text-gray-500">
                Enterで保存、Escでキャンセル
              </div>
            </div>
          )}
        </div>

        <Link href="/musician/songs" className="text-xs text-blue-700 underline underline-offset-2">
          一覧へ
        </Link>
      </header>

      <section className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
        <SongMemoEditor initialText={initialMemo} onSave={saveMemo} />
        {/* 保存中のUIが欲しければ、SongMemoEditor側が対応していない場合はここに出してもOK */}
        {savingMemo ? <div className="text-xs text-gray-500">保存中…</div> : null}
      </section>

      <SongAssetsBox actSongId={localSong.id} />

      {/* 危険操作：ページ下部に置くのが無難 */}
      <section className="rounded border bg-white p-4">
        <div className="text-sm font-semibold text-gray-900">危険操作</div>
        <p className="mt-1 text-xs text-gray-600">この曲を削除すると元に戻せません。</p>

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
