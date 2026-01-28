"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SetlistRow, SetlistItemView } from "@/lib/utils/setlist";
import type { SongRow } from "@/lib/db/songs";
import { SetlistItemList } from "./SetlistItemList";
import { AddSetlistItemForm } from "./AddSetlistItemForm";
import { createSetlistAction } from "@/lib/api/setlistsAction";

type Props = {
  performanceId: string;
  setlist: SetlistRow | null;
  items: SetlistItemView[];
  actSongs: SongRow[];
};

export function SetlistSection({ performanceId, setlist, items, actSongs }: Props) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  const handleCreateSetlist = async () => {
    setCreating(true);
    try {
      await createSetlistAction(performanceId);
      router.refresh();
    } catch (e: any) {
      alert(e?.message ?? "セットリストの作成に失敗しました");
    } finally {
      setCreating(false);
    }
  };

  // セットリストがない場合
  if (!setlist) {
    return (
      <section className="rounded-xl border bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Setlist</h2>
        </div>
        <div className="mt-3">
          <button
            onClick={handleCreateSetlist}
            disabled={creating}
            className={[
              "rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white",
              creating ? "opacity-60" : "hover:bg-emerald-700",
            ].join(" ")}
          >
            {creating ? "作成中..." : "セットリストを作成"}
          </button>
        </div>
      </section>
    );
  }

  // セットリストがある場合
  return (
    <section className="rounded-xl border bg-white px-4 py-3 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Setlist</h2>
        <span className="text-xs text-gray-500">{items.length}曲</span>
      </div>

      {/* アイテム一覧 */}
      <SetlistItemList
        performanceId={performanceId}
        setlistId={setlist.id}
        items={items}
      />

      {/* 追加フォーム */}
      <AddSetlistItemForm
        performanceId={performanceId}
        setlistId={setlist.id}
        actSongs={actSongs}
      />
    </section>
  );
}
