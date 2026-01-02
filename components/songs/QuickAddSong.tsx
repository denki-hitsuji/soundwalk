"use client";

import { useState } from "react";
import { addSong } from "@/lib/db/songs";

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
      await addSong(actId, title.trim());
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
        className="rounded bg-gray-800 px-3 py-1.5 text-sm text-white"
      >
        追加
      </button>
    </form>
  );
}
