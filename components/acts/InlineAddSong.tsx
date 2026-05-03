"use client";

import { useState } from "react";

type Props = {
  onAdd: (title: string) => Promise<void>;
};

export function InlineAddSong({ onAdd }: Props) {
  const [title, setTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    const t = title.trim();
    if (!t) { setErr("曲名を入力してください"); return; }
    setErr(null);
    setAdding(true);
    try {
      await onAdd(t);
      setTitle("");
    } catch (e: any) {
      setErr(e?.message ?? "追加に失敗しました");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") void submit(); }}
          placeholder="曲名を追加"
          className="flex-1 rounded border px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => void submit()}
          disabled={adding}
          className={["shrink-0 rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white", adding ? "opacity-60" : "hover:bg-emerald-700"].join(" ")}
        >
          {adding ? "追加中…" : "曲を追加"}
        </button>
      </div>
      {err && <div className="text-[11px] text-red-600">{err}</div>}
    </div>
  );
}
