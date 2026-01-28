"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SongRow } from "@/lib/db/songs";
import { addSetlistItemAction } from "@/lib/api/setlistsAction";

type Props = {
  performanceId: string;
  setlistId: string;
  actSongs: SongRow[];
};

type InputMode = "select" | "freetext";

export function AddSetlistItemForm({ performanceId, setlistId, actSongs }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<InputMode>("select");
  const [selectedSongId, setSelectedSongId] = useState<string>("");
  const [customTitle, setCustomTitle] = useState("");
  const [memo, setMemo] = useState("");
  const [adding, setAdding] = useState(false);

  const canAdd =
    mode === "select"
      ? selectedSongId !== ""
      : customTitle.trim() !== "";

  const handleAdd = async () => {
    if (!canAdd) return;

    setAdding(true);
    try {
      if (mode === "select") {
        await addSetlistItemAction({
          setlistId,
          performanceId,
          songId: selectedSongId,
          memo: memo.trim() || null,
        });
      } else {
        await addSetlistItemAction({
          setlistId,
          performanceId,
          title: customTitle.trim(),
          memo: memo.trim() || null,
        });
      }

      // Reset form
      setSelectedSongId("");
      setCustomTitle("");
      setMemo("");
      router.refresh();
    } catch (e: any) {
      alert(e?.message ?? "追加に失敗しました");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="border-t pt-3 space-y-2">
      <div className="text-xs font-medium text-gray-600">+ 曲を追加</div>

      {/* Mode tabs */}
      <div className="flex gap-1">
        <button
          onClick={() => setMode("select")}
          className={[
            "px-3 py-1 text-xs rounded-t border-b-2",
            mode === "select"
              ? "bg-white border-emerald-500 text-emerald-700"
              : "bg-gray-100 border-transparent text-gray-500 hover:bg-gray-200",
          ].join(" ")}
        >
          登録曲から選ぶ
        </button>
        <button
          onClick={() => setMode("freetext")}
          className={[
            "px-3 py-1 text-xs rounded-t border-b-2",
            mode === "freetext"
              ? "bg-white border-emerald-500 text-emerald-700"
              : "bg-gray-100 border-transparent text-gray-500 hover:bg-gray-200",
          ].join(" ")}
        >
          自由入力
        </button>
      </div>

      {/* Input area */}
      <div className="space-y-2">
        {mode === "select" ? (
          <select
            value={selectedSongId}
            onChange={(e) => setSelectedSongId(e.target.value)}
            className="w-full border rounded px-2 py-1.5 text-sm"
          >
            <option value="">曲を選択...</option>
            {actSongs.map((song) => (
              <option key={song.id} value={song.id}>
                {song.title}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="曲名を入力（カバー曲など）"
            className="w-full border rounded px-2 py-1.5 text-sm"
          />
        )}

        {/* Memo input */}
        <input
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="メモ（キー、クリック、MC等）任意"
          className="w-full border rounded px-2 py-1.5 text-xs text-gray-600"
        />

        {/* Add button */}
        <button
          onClick={handleAdd}
          disabled={!canAdd || adding}
          className={[
            "w-full rounded py-1.5 text-sm font-medium text-white",
            canAdd && !adding
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-gray-300 cursor-not-allowed",
          ].join(" ")}
        >
          {adding ? "追加中..." : "追加"}
        </button>
      </div>

      {/* Help text */}
      {actSongs.length === 0 && mode === "select" && (
        <p className="text-xs text-gray-400">
          登録曲がありません。「自由入力」モードで追加するか、先に曲を登録してください。
        </p>
      )}
    </div>
  );
}
