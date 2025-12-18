// app/musician/acts/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ActInviteBox } from "@/components/acts/ActInviteBox";

type ActRow = {
  id: string;
  name: string;
  act_type: string | null;
};

const ACT_TYPE_OPTIONS = [
  { value: "solo", label: "ソロ" },
  { value: "band", label: "バンド" },
  { value: "duo", label: "デュオ" },
  { value: "unit", label: "ユニット" },
  { value: "other", label: "その他" },
];

export default function MusicianActsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  const [acts, setActs] = useState<ActRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 新規追加用
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<string>("band");

  const loadActs = async (uid: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("acts")
      .select("id, name, act_type")
      .eq("owner_profile_id", uid)
      .order("name", { ascending: true });

    if (error) {
      console.error("load acts error", error);
      setActs([]);
    } else {
      setActs((data ?? []) as ActRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        console.error("getUser error or no user", error);
        setUserId(null);
        setLoading(false);
        return;
      }

      setUserId(user.id);
      await loadActs(user.id);
    };

    void init();
  }, []);

  const handleCreate = async () => {
    if (!userId) {
      alert("ログイン情報を取得できませんでした。");
      return;
    }
    if (!newName.trim()) {
      alert("出演名義の名前を入力してください。");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("acts").insert({
      owner_profile_id: userId,
      name: newName.trim(),
      act_type: newType || null,
    });

    setSaving(false);

    if (error) {
      console.error("insert act error", error);
      alert("出演名義の追加に失敗しました。");
      return;
    }

    setNewName("");
    // 一覧を再読込
    await loadActs(userId);
  };

  const handleDelete = async (actId: string) => {
    if (!userId) return;
    const ok = window.confirm(
      "この出演名義を削除しますか？（関連する応募・ログなどに影響する可能性があります）",
    );
    if (!ok) return;

    const { error } = await supabase
      .from("acts")
      .delete()
      .eq("id", actId)
      .eq("owner_profile_id", userId);

    if (error) {
      console.error("delete act error", error);
      alert("削除に失敗しました。");
      return;
    }

    await loadActs(userId);
  };

  return (
    <main className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">出演名義の管理</h1>
          <p className="text-sm text-gray-600">
            ソロ、バンド、ユニットなど、あなたがライブで使う「名前」を複数登録できます。
            演奏ログやイベント応募時にここで登録した名義から選べます。
          </p>
        </div>
        <Link
          href="/musician/performances"
          className="inline-flex items-center rounded bg-gray-800 px-3 py-1.5 text-xs font-medium text-white"
        >
          ライブタイムラインへ戻る
        </Link>
      </div>

      {/* 新規追加フォーム */}
      <section className="rounded-lg border bg-white px-4 py-3 shadow-sm max-w-md">
        <h2 className="text-sm font-semibold mb-2">新しい出演名義を追加</h2>
        <div className="space-y-2">
          <label className="block">
            <span className="text-xs font-medium">名前</span>
            <input
              type="text"
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              placeholder="例: さとレックス / ザ・ホリデイズ"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium">種別</span>
            <select
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
            >
              {ACT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={handleCreate}
            disabled={saving}
            className="mt-2 inline-flex items-center rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            {saving ? "追加中…" : "この名義を追加する"}
          </button>
        </div>
      </section>

      {/* 一覧 */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">登録済みの出演名義</h2>

        {loading && (
          <p className="text-xs text-gray-500">読み込み中です…</p>
        )}

        {!loading && acts.length === 0 && (
          <p className="text-xs text-gray-600">
            まだ出演名義が登録されていません。
            上のフォームから、まずはソロ名義とバンド名義を登録してみてください。
          </p>
        )}

<div className="space-y-2 max-w-md">
  {acts.map((act) => {
    const typeLabel =
      ACT_TYPE_OPTIONS.find((o) => o.value === act.act_type)?.label ??
      "種別未設定";

    return (
      <div
        key={act.id}
        className="rounded border bg-white px-3 py-2 text-sm space-y-2"
      >
        {/* 1行目：名前/種別 + 削除 */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-medium truncate">{act.name}</div>
            <div className="text-[11px] text-gray-500">{typeLabel}</div>
          </div>

          <button
            type="button"
            onClick={() => handleDelete(act.id)}
            className="shrink-0 text-[11px] text-red-600 hover:underline"
          >
            削除
          </button>
        </div>

        {/* 2行目：招待（下に展開） */}
        <div className="pt-1">
          <ActInviteBox actId={act.id} />
        </div>
      </div>
    );
  })}
</div>

      </section>
    </main>
  );
}
