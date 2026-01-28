"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SetlistItemView } from "@/lib/utils/setlist";
import {
  deleteSetlistItemAction,
  reorderSetlistItemsAction,
  updateSetlistItemAction,
} from "@/lib/api/setlistsAction";

type Props = {
  performanceId: string;
  setlistId: string;
  items: SetlistItemView[];
};

export function SetlistItemList({ performanceId, setlistId, items }: Props) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [memoText, setMemoText] = useState("");

  const handleDelete = async (itemId: string) => {
    if (!confirm("この曲を削除しますか？")) return;
    setDeletingId(itemId);
    try {
      await deleteSetlistItemAction({ itemId, performanceId });
      router.refresh();
    } catch (e: any) {
      alert(e?.message ?? "削除に失敗しました");
    } finally {
      setDeletingId(null);
    }
  };

  const handleMove = async (itemId: string, direction: "up" | "down") => {
    const currentIndex = items.findIndex((i) => i.item_id === itemId);
    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    // Create new order
    const newItems = [...items];
    const [removed] = newItems.splice(currentIndex, 1);
    newItems.splice(targetIndex, 0, removed);

    const orderedItemIds = newItems.map((i) => i.item_id);

    setMovingId(itemId);
    try {
      await reorderSetlistItemsAction({
        setlistId,
        performanceId,
        orderedItemIds,
      });
      router.refresh();
    } catch (e: any) {
      alert(e?.message ?? "並び替えに失敗しました");
    } finally {
      setMovingId(null);
    }
  };

  const handleEditMemo = (item: SetlistItemView) => {
    setEditingMemoId(item.item_id);
    setMemoText(item.memo ?? "");
  };

  const handleSaveMemo = async (itemId: string) => {
    try {
      await updateSetlistItemAction({
        itemId,
        performanceId,
        memo: memoText.trim() || null,
      });
      setEditingMemoId(null);
      router.refresh();
    } catch (e: any) {
      alert(e?.message ?? "メモの保存に失敗しました");
    }
  };

  const handleCancelMemo = () => {
    setEditingMemoId(null);
    setMemoText("");
  };

  if (items.length === 0) {
    return (
      <div className="text-xs text-gray-500 py-2">
        曲がありません。下のフォームから追加してください。
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div
          key={item.item_id}
          className="flex flex-col gap-1 rounded border p-2 bg-gray-50"
        >
          <div className="flex items-center gap-2">
            {/* Order number */}
            <span className="text-xs text-gray-500 w-6 shrink-0">
              {index + 1}.
            </span>

            {/* Title */}
            <span className="flex-1 text-sm font-medium truncate">
              {item.display_title}
              {item.song_id === null && (
                <span className="ml-1 text-xs text-gray-400">(自由入力)</span>
              )}
            </span>

            {/* Move buttons */}
            <button
              onClick={() => handleMove(item.item_id, "up")}
              disabled={index === 0 || movingId === item.item_id}
              className={[
                "px-1.5 py-0.5 text-xs rounded",
                index === 0
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-600 hover:bg-gray-200",
              ].join(" ")}
              title="上に移動"
            >
              ↑
            </button>
            <button
              onClick={() => handleMove(item.item_id, "down")}
              disabled={index === items.length - 1 || movingId === item.item_id}
              className={[
                "px-1.5 py-0.5 text-xs rounded",
                index === items.length - 1
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-600 hover:bg-gray-200",
              ].join(" ")}
              title="下に移動"
            >
              ↓
            </button>

            {/* Delete button */}
            <button
              onClick={() => handleDelete(item.item_id)}
              disabled={deletingId === item.item_id}
              className="px-1.5 py-0.5 text-xs text-red-600 hover:bg-red-50 rounded"
              title="削除"
            >
              {deletingId === item.item_id ? "..." : "削除"}
            </button>
          </div>

          {/* Memo section */}
          {editingMemoId === item.item_id ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                value={memoText}
                onChange={(e) => setMemoText(e.target.value)}
                className="flex-1 text-xs border rounded px-2 py-1"
                placeholder="メモ（キー、クリック、MC等）"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveMemo(item.item_id);
                  if (e.key === "Escape") handleCancelMemo();
                }}
              />
              <button
                onClick={() => handleSaveMemo(item.item_id)}
                className="text-xs text-blue-600 hover:underline"
              >
                保存
              </button>
              <button
                onClick={handleCancelMemo}
                className="text-xs text-gray-500 hover:underline"
              >
                取消
              </button>
            </div>
          ) : (
            <div
              onClick={() => handleEditMemo(item)}
              className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 pl-6"
            >
              {item.memo ? (
                <span>memo: {item.memo}</span>
              ) : (
                <span className="italic text-gray-400">+ メモを追加</span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
