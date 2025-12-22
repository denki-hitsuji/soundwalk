// app/musician/performances/new/NewPerformanceClient.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { toYmdLocal, parseYmdLocal, addDaysLocal, diffDaysLocal } from "@/lib/dateUtils";

type ActOption = {
  id: string;
  name: string;
  act_type: string | null;
};

export default function NewPerformanceClient() {
  const router = useRouter();
  const sp = useSearchParams();

  // クエリから初期値（クイックバーから渡される）
  const [eventDate, setEventDate] = useState(
    sp.get("date") ?? toYmdLocal(),
  );
  const [actId, setActId] = useState(sp.get("actId") ?? "");
  const [venueName, setVenueName] = useState(sp.get("venue") ?? "");
  const [memo, setMemo] = useState("");

  const [userId, setUserId] = useState<string | null>(null);
  const [acts, setActs] = useState<ActOption[]>([]);
  const [actsLoading, setActsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setActsLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("getUser error or no user", userError);
        setUserId(null);
        setActs([]);
        setActsLoading(false);
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from("acts")
        .select("id, name, act_type")
        .eq("owner_profile_id", user.id)
        .order("name", { ascending: true });

      if (error) {
        console.error("load acts error", error);
        setActs([]);
      } else {
        const list = (data ?? []) as ActOption[];
        setActs(list);

        // actId が空なら先頭を自動選択（クイックバー未使用時の体験UP）
        if (!actId && list.length > 0) setActId(list[0].id);
      }

      setActsLoading(false);
    };

    void load();
    // actId は依存に入れない（初回自動選択のため）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const noActs = !actsLoading && acts.length === 0;

  const handleSave = async () => {
    if (!userId) {
      alert("ログイン情報を取得できませんでした。いったんログインし直してください。");
      return;
    }
    if (!eventDate) {
      alert("日付は必須です。");
      return;
    }
    if (!actId) {
      alert("出演名義を選択してください。");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("musician_performances").insert({
      profile_id: userId,
      act_id: actId,
      event_date: eventDate,
      venue_name: venueName || null,
      memo: memo || null,
    });

    setSaving(false);

    if (error) {
      console.error("insert performance error", error);
      alert("保存に失敗しました。コンソールを確認してください。");
      return;
    }

    router.push("/musician/performances");
  };

  return (
    <main className="p-4 space-y-4">
      <h1 className="text-xl font-bold">新しいライブの記録</h1>

      <div className="space-y-3 max-w-md">
        {/* 日付 */}
        <label className="block">
          <span className="text-sm font-medium">日付（必須）</span>
          <input
            type="date"
            className="mt-1 border rounded px-2 py-1 w-full"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />
        </label>

        {/* 出演名義 */}
        <div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">出演名義（必須）</span>
            <Link
              href="/musician/acts"
              className="text-[11px] text-blue-600 hover:underline"
            >
              出演名義を編集する
            </Link>
          </div>

          {actsLoading ? (
            <p className="text-xs text-gray-500 mt-1">読み込み中です…</p>
          ) : noActs ? (
            <div className="mt-1 text-xs text-red-500 space-y-1">
              <p>まだ出演名義が登録されていません。</p>
              <p>
                まずは{" "}
                <Link href="/musician/acts" className="text-blue-600 underline">
                  出演名義
                </Link>{" "}
                を1つ作成してください。
              </p>
            </div>
          ) : (
            <select
              className="mt-1 border rounded px-2 py-1 w-full"
              value={actId}
              onChange={(e) => setActId(e.target.value)}
            >
              <option value="">選択してください</option>
              {acts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                  {a.act_type ? `（${a.act_type}）` : ""}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* 会場 */}
        <label className="block">
          <span className="text-sm font-medium">会場</span>
          <input
            type="text"
            className="mt-1 border rounded px-2 py-1 w-full"
            value={venueName}
            onChange={(e) => setVenueName(e.target.value)}
            placeholder="例: NINETY EAST / 水戸駅前ストリート"
          />
        </label>

        {/* メモ */}
        <label className="block">
          <span className="text-sm font-medium">メモ</span>
          <textarea
            className="mt-1 border rounded px-2 py-1 w-full h-24"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="出演時間、共演者、イベント名、セットリストのメモなど"
          />
        </label>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || actsLoading || noActs}
          className="mt-2 bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
        >
          {saving ? "保存中…" : "このライブを記録する"}
        </button>
      </div>
    </main>
  );
}
