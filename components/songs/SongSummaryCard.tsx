"use client";

import { useEffect, useState } from "react";
import { getRecentSongs, getSongCount } from "@/lib/songQueries";
import { QuickAddSong } from "./QuickAddSong";
import Link from "next/link";

type Song = {
  id: string;
  title: string;
};

export function SongSummaryCard({ actId }: { actId: string }) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [count, setCount] = useState<number>(0);

  const reload = async () => {
    const [recent, total] = await Promise.all([
      getRecentSongs(actId, 2),
      getSongCount(actId),
    ]);
    setSongs(recent);
    setCount(total);
  };

  useEffect(() => {
    reload();
  }, [actId]);

  return (
    <div className="rounded-lg border bg-white p-4 space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">演奏できる曲</h2>
        <span className="text-xs text-gray-500">
          現在：{count} 曲
        </span>
      </div>

      {songs.length > 0 && (
        <ul className="text-sm text-gray-700 list-disc pl-4">
          {songs.map((s) => (
            <li key={s.id}>{s.title}</li>
          ))}
        </ul>
      )}

        <QuickAddSong actId={actId} onAdded={reload} />

        <Link
            href="/musician/songs"
            className="text-xs text-blue-600 underline underline-offset-2"
        >
            一覧で整える
        </Link>
    </div>
  );
}
