// SongSummaryClientBits.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { addSongAction } from "@/lib/api/songsAction";

export function ActsUpdateRefresher({ eventName }: { eventName: string }) {
  const router = useRouter();

  useEffect(() => {
    const onUpdate = () => router.refresh();
    window.addEventListener(eventName, onUpdate);
    return () => window.removeEventListener(eventName, onUpdate);
  }, [eventName, router]);

  return null;
}

export function AddSongForm({ actId }: { actId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    const t = title.trim();
    if (!t) {
      setErr("曲名を入力してください");
      return;
    }
    setErr(null);

    startTransition(async () => {
      try {
        await addSongAction(actId, t);
        setTitle("");
        router.refresh(); // ✅ 追加後はサーバーの真実を再描画
      } catch (e: any) {
        setErr(e?.message ?? "追加に失敗しました");
      }
    });
  };

  return (
    <div className="space-y-1">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center min-w-0">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="曲名を追加"
          className="w-full sm:flex-1 min-w-0 rounded border px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className={[
            "w-full sm:w-auto sm:shrink-0 rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white",
            pending ? "opacity-60" : "hover:bg-emerald-700",
          ].join(" ")}
        >
          {pending ? "追加中…" : "曲を追加"}
        </button>
      </div>
      {err && <div className="text-[11px] text-red-600">{err}</div>}
    </div>
  );
}

