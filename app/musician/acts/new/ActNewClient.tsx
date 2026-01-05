"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notifyActsUpdated } from "@/lib/db/actEvents";
import { ensureMyDefaultAct } from "@/lib/api/acts";

export default function ActNewClient() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [actType, setActType] = useState<"solo" | "band" | "duo">("solo");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const create = async () => {
    setErr(null);
    const trimmed = name.trim();
    if (!trimmed) return setErr("名義名を入力してください");

    setSaving(true);
    try {
      const act = await ensureMyDefaultAct();
      if (act && trimmed === act.name) {
        // 既定名義と同じならそちらに遷移
        router.push(`/musician/acts/${act.id}`);
        return;
      }

      notifyActsUpdated();
      router.push(`/musician/acts/${act.id}`);
      router.refresh();
    } catch (e: any) {
      setErr(e?.message ?? "作成に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="space-y-4">
      <header>
        <h1 className="text-xl font-bold">名義を追加</h1>
        <p className="text-xs text-gray-600 mt-1">あとからプロフィールや写真も編集できます。</p>
      </header>

      <div className="rounded border bg-white p-4 space-y-3 max-w-md">
        <label className="block text-sm">
          名義名
          <input
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <label className="block text-sm">
          種別
          <select
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            value={actType}
            onChange={(e) => setActType(e.target.value as any)}
          >
            <option value="solo">ソロ</option>
            <option value="band">バンド</option>
            <option value="duo">デュオ</option>
          </select>
        </label>

        {err && <div className="text-sm text-red-600">{err}</div>}

        <button
          type="button"
          onClick={() => void create()}
          disabled={saving}
          className="inline-flex items-center justify-center rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {saving ? "作成中…" : "作成"}
        </button>
      </div>
    </main>
  );
}
