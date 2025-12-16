"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getRecentSongs,
  getSongCount,
  getMyActsForSelect,
  type ActOption,
} from "@/lib/songQueries";
import { QuickAddSong } from "./QuickAddSong";

type Song = {
  id: string;
  title: string;
};

export function SongSummaryCard({
  initialActId,
}: {
  initialActId?: string | null;
}) {
  const [acts, setActs] = useState<ActOption[]>([]);
  const [actId, setActId] = useState<string | null>(initialActId ?? null);

  const [songs, setSongs] = useState<Song[]>([]);
  const [count, setCount] = useState<number>(0);

  const selectedAct = useMemo(
    () => acts.find((a) => a.id === actId) ?? null,
    [acts, actId]
  );

  const reload = async (targetActId: string) => {
    const [recent, total] = await Promise.all([
      getRecentSongs(targetActId, 2),
      getSongCount(targetActId),
    ]);
    setSongs(recent);
    setCount(total);
  };

  useEffect(() => {
    const boot = async () => {
      const list = await getMyActsForSelect();
      setActs(list);

      // 初期actIdが無い/不正なら先頭を採用
      const nextActId =
        (actId && list.some((a) => a.id === actId) && actId) ||
        list[0]?.id ||
        null;

      setActId(nextActId);

      if (nextActId) {
        await reload(nextActId);
      } else {
        setSongs([]);
        setCount(0);
      }
    };

    void boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!actId) return;
    void reload(actId);
  }, [actId]);

  return (
    <div className="rounded-lg border bg-white p-4 space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">演奏できる曲</h2>
        <a href="/musician/songs/"><span className="text-xs text-gray-500 underline">
          {actId ? `現在：${count} 曲` : ""}
        </span></a>
      </div>

      {/* ★ 名義（アクト）セレクタ */}
      <div className="space-y-1">
        <div className="text-xs text-gray-500">出演名義</div>
        <select
          value={actId ?? ""}
          onChange={(e) => setActId(e.target.value || null)}
          className="w-full rounded border px-3 py-2 text-sm bg-white"
          disabled={acts.length === 0}
        >
          {acts.length === 0 && <option value="">（名義がありません）</option>}
          {acts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
              {a.act_type ? `（${a.act_type}）` : ""}
            </option>
          ))}
        </select>

        {selectedAct && (
          <div className="text-[11px] text-gray-500">
            この名義に曲を追加します
          </div>
        )}
      </div>

      {songs.length > 0 && (
        <ul className="text-sm text-gray-700 list-disc pl-4">
          {songs.map((s) => (
            <li key={s.id}>{s.title}</li>
          ))}
        </ul>
      )}

      {/* 追加フォーム */}
      {actId ? (
        <QuickAddSong actId={actId} onAdded={() => reload(actId)} />
      ) : (
        <div className="text-sm text-gray-600">
          曲を追加するには、先に出演名義を作成してください。
        </div>
      )}
    </div>
  );
}
