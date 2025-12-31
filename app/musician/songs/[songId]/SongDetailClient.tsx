// app/musician/songs/[songId]/SongDetailClient.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import TemplateAssist from "@/components/forms/TemplateAssist";
import { makeSongMemoTemplate } from "@/lib/templates";

type SongRow = {
  id: string;
  act_id: string;
  title: string;
  memo: string | null;
};

type ActRow = { id: string; name: string; act_type: string | null };

export default function SongDetailClient({ songId }: { songId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [song, setSong] = useState<SongRow | null>(null);
  const [act, setAct] = useState<ActRow | null>(null);

  const [memo, setMemo] = useState("");
  const didInit = useRef(false);

  const templateText = useMemo(() => makeSongMemoTemplate(), []);

  const load = async () => {
    setLoading(true);

    const { data: s, error: sErr } = await supabase
      .from("act_songs")
      .select("id, act_id, title, memo")
      .eq("id", songId)
      .single();

    if (sErr) {
      console.error("load song error", sErr);
      setSong(null);
      setAct(null);
      setMemo("");
      setLoading(false);
      return;
    }

    const row = s as SongRow;
    setSong(row);
    setMemo(row.memo ?? "");

    const { data: a, error: aErr } = await supabase
      .from("acts")
      .select("id, name, act_type")
      .eq("id", row.act_id)
      .single();

    if (aErr) {
      console.warn("load act error", aErr);
      setAct(null);
    } else {
      setAct(a as ActRow);
    }

    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songId]);

  // 空なら自動挿入（初回だけ）
  useEffect(() => {
    if (loading) return;
    if (didInit.current) return;
    didInit.current = true;

    if (!memo.trim()) {
      setMemo(templateText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, templateText]);

  const save = async () => {
    if (!song) return;
    setSaving(true);
    try {
      const trimmed = memo.trim();
      const { error } = await supabase
        .from("act_songs")
        .update({ memo: trimmed ? trimmed : null })
        .eq("id", song.id);

      if (error) throw error;

      alert("保存しました。");
      await load();
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <main className="text-sm text-gray-500">読み込み中…</main>;

  if (!song) {
    return (
      <main className="space-y-2">
        <p className="text-sm text-red-600">曲が見つかりませんでした。</p>
        <Link href="/musician/songs" className="text-sm text-blue-700 underline">
          一覧へ戻る
        </Link>
      </main>
    );
  }

  const changed = (song.memo ?? "") !== memo;

  return (
    <main className="space-y-4 max-w-3xl">
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-gray-500">{act ? `${act.name}${act.act_type ? `（${act.act_type}）` : ""}` : "名義"}</div>
          <h1 className="text-xl font-bold">{song.title}</h1>
        </div>

        <Link href="/musician/songs" className="text-xs text-blue-700 underline underline-offset-2">
          一覧へ
        </Link>
      </header>

      <section className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">メモ</h2>
          <TemplateAssist templateText={templateText} getValue={() => memo} setValue={setMemo} />
        </div>

        <textarea
          className="w-full rounded border px-3 py-2 text-sm min-h-[260px]"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="ここにメモを書きます"
        />

        <div className="flex items-center justify-end gap-2">
          {changed && <span className="text-[11px] text-gray-500">未保存の変更があります</span>}
          <button
            type="button"
            onClick={save}
            disabled={!changed || saving}
            className="rounded bg-gray-800 px-3 py-2 text-xs font-medium text-white disabled:opacity-40"
          >
            {saving ? "保存中…" : "保存"}
          </button>
        </div>
      </section>
    </main>
  );
}
