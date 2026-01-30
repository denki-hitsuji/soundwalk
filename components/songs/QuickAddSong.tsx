"use client";

import { useState } from "react";
import { addSongDb } from "@/lib/db/songs";
import { Spinner } from "@/components/ui/Spinner";

export function QuickAddSong({
  actId,
  onAdded,
}: {
  actId: string;
  onAdded?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      await addSongDb(actId, title.trim());
      setTitle("");
      onAdded?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="曲名を入力"
        className="flex-1 rounded border px-3 py-1.5 text-sm"
      />
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 rounded bg-gray-800 px-3 py-1.5 text-sm text-white disabled:opacity-60"
      >
        {loading && <Spinner size="sm" />}
        <span>{loading ? "追加中…" : "追加"}</span>
      </button>
    </form>
  );
}
