// app/musician/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/auth/session";
import { ensureMyDefaultAct, getMyActs, updateAct } from "@/lib/db/acts";

type MyAct = {
  id: string;
  name: string;
  act_type: string;
  owner_profile_id: string;
  description: string | null;
  icon_url: string | null;
};

export default function MusicianProfilePage() {
  const [loading, setLoading] = useState(true);
  const [userMissing, setUserMissing] = useState(false);
  const [act, setAct] = useState<MyAct | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // マウント時に「自分のActを取得（なければ作成）」する
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);
      try {
        const user = await getCurrentUser();
        if (!user) {
          setUserMissing(true);
          return;
        }

        // 自分のactsを取得
        const myAct = await ensureMyDefaultAct();
        setAct(myAct as MyAct);
      } catch (e: any) {
        console.error(e);
        setError(e.message ?? "エラーが発生しました");
      } finally {
        setLoading(false);
      }
    };

    void init();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!act) return;

    const formData = new FormData(e.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const act_type = String(formData.get("act_type") ?? "solo");
    const descriptionRaw = formData.get("description");
    const description =
      descriptionRaw != null ? String(descriptionRaw).trim() : null;

    if (!name) {
      setError("名義は必須です");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const patch: Partial<MyAct> = {
        name,
        act_type,
        description,
      };
      await updateAct({ ...patch, id: act.id });

      setAct((prev) =>
        prev
          ? {
              ...prev,
              name,
              act_type,
              description,
            }
          : prev,
      );
      setMessage("保存しました");
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "更新に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  // ===== UI =====

  if (loading) {
    return (
      <main className="p-4">
        <p className="text-sm text-gray-500">読み込み中...</p>
      </main>
    );
  }

  if (userMissing) {
    return (
      <main className="p-4">
        <p className="text-sm text-red-500">ログインが必要です。</p>
      </main>
    );
  }

  if (!act) {
    return (
      <main className="p-4">
        <p className="text-sm text-red-500">
          活動名義(Act)の取得に失敗しました。
        </p>
      </main>
    );
  }

  return (
    <main className="p-4 space-y-4">
      <h1 className="text-xl font-bold mb-2">プロフィール（活動名義）</h1>
      <p className="text-sm text-gray-600">
        店舗側から見えるあなたの名義や紹介文をここで編集できます。
      </p>

      <section className="border rounded p-4 space-y-3 bg-white shadow-sm">
        <h2 className="font-semibold">活動名義</h2>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {message && <p className="text-sm text-green-600">{message}</p>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block text-sm">
            名義（Act名）
            <input
              type="text"
              name="name"
              defaultValue={act.name}
              className="mt-1 w-full border rounded px-2 py-1 text-sm"
            />
          </label>

          <label className="block text-sm">
            種別
            <select
              name="act_type"
              defaultValue={act.act_type}
              className="mt-1 w-full border rounded px-2 py-1 text-sm"
            >
              <option value="solo">ソロ</option>
              <option value="band">バンド</option>
              <option value="duo">デュオ</option>
              <option value="unit">ユニット</option>
            </select>
          </label>

          <label className="block text-sm">
            紹介文
            <textarea
              name="description"
              defaultValue={act.description ?? ""}
              className="mt-1 w-full border rounded px-2 py-1 text-sm"
              rows={3}
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 border rounded text-sm font-semibold disabled:opacity-50"
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </form>
      </section>
    </main>
  );
}
