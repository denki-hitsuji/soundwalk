// app/musician/performances/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type ActRow = {
  id: string;
  name: string;
  act_type: string | null;
};

type PerformanceRow = {
  id: string;
  event_date: string; // "YYYY-MM-DD"
  venue_name: string | null;
  memo: string | null;
  act_id: string | null;
};

export default function MusicianPerformancesPage() {
  const [loading, setLoading] = useState(true);
  const [performances, setPerformances] = useState<PerformanceRow[]>([]);
  const [acts, setActs] = useState<ActRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userMissing, setUserMissing] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("getUser error or no user", userError);
        setUserMissing(true);
        setLoading(false);
        return;
      }

      // 1) このプロフィールの出演名義一覧を取得
      const { data: actsData, error: actsError } = await supabase
        .from("acts")
        .select("id, name, act_type")
        .eq("owner_profile_id", user.id)
        .order("name", { ascending: true });

      if (actsError) {
        console.error("load acts error", actsError);
        setError("出演名義の取得に失敗しました。");
        setActs([]);
      } else {
        setActs((actsData ?? []) as ActRow[]);
      }

      // 2) このプロフィールのライブ記録を取得（act_id だけ持ってくる）
      const { data: perfData, error: perfError } = await supabase
        .from("musician_performances")
        .select("id, event_date, venue_name, memo, act_id")
        .eq("profile_id", user.id)
        .order("event_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (perfError) {
        console.error("load performances error", perfError);
        setError("ライブ履歴の取得に失敗しました。");
        setPerformances([]);
      } else {
        setPerformances((perfData ?? []) as PerformanceRow[]);
      }

      setLoading(false);
    };

    void load();
  }, []);

  if (userMissing) {
    return (
      <main className="p-4">
        <p className="text-sm text-red-500 mb-2">
          ログイン情報を取得できませんでした。
        </p>
        <Link
          href="/login"
          className="text-xs text-blue-600 underline"
        >
          ログインページへ
        </Link>
      </main>
    );
  }

  // act_id → ActRow のマップを作っておく
  const actMap = new Map<string, ActRow>();
  for (const a of acts) {
    actMap.set(a.id, a);
  }

  return (
    <main className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">ライブタイムライン</h1>
          <p className="text-sm text-gray-600">
            自分が出演した（これから出演する）ライブの記録です。
            ソロ・バンドなど複数の出演名義の活動をまとめて振り返ることができます。
          </p>
        </div>
        <Link
          href="/musician/performances/new"
          className="inline-flex items-center rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white"
        >
          新しいライブを記録する
        </Link>
      </div>

      {loading && (
        <p className="text-sm text-gray-500">読み込み中です…</p>
      )}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {!loading && !error && performances.length === 0 && (
        <div className="text-sm text-gray-600 space-y-2">
          <p>
            👋 はじめての方へ
            まずは、すでに決まっているライブを1件登録してみてください。
            あとから、出演名義や会場、企画にも広げられます。
          </p>
          <Link
            href="/musician/performances/new"
            className="inline-flex items-center rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white"
          >
            ライブを記録する
          </Link>
        </div>
      )}

      {performances.length > 0 && (
        <div className="space-y-3">
          {performances.map((p) => {
  const act = p.act_id ? actMap.get(p.act_id) ?? null : null;
  const actLabel = act
    ? act.act_type
      ? `${act.name}（${act.act_type}）`
      : act.name
    : "出演名義：なし";

  const date = p.event_date; // "YYYY-MM-DD"

  return (
    <div
      key={p.id}
      className="rounded-lg border bg-white px-4 py-3 shadow-sm"
    >
      {/* 見出し部分 */}
      <div className="mb-1">
        <div className="text-sm font-semibold">
          {date}
          {p.venue_name && (
            <span className="text-gray-700">
              {" "}
              @ {p.venue_name}
            </span>
          )}
        </div>
        <div className="text-base font-bold">
          {actLabel}
        </div>
      </div>

      {/* メモ */}
      {p.memo && (
        <p className="mt-1 text-xs text-gray-700 whitespace-pre-wrap">
          {p.memo}
        </p>
      )}
    </div>
  );
})}

        </div>
      )}
    </main>
  );
}
