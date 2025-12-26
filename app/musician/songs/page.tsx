"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type ActRow = {
  id: string;
  name: string;
  act_type: string | null;
};

type SongRow = {
  id: string;
  act_id: string;
  title: string;
  memo: string | null;
  created_at: string;
};

type Draft = {
  act_id: string;
  memo: string;
};

function normalizeAct(value: unknown): ActRow | null {
  if (!value) return null;
  if (Array.isArray(value)) return (value[0] as ActRow) ?? null;
  return value as ActRow;
}

export default function SongsPage() {
  const [loading, setLoading] = useState(true);

  const [acts, setActs] = useState<ActRow[]>([]);
  const [songs, setSongs] = useState<SongRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const [q, setQ] = useState("");

  const filteredSongs = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return songs;
    return songs.filter((s) => s.title.toLowerCase().includes(t));
  }, [songs, q]);

  const actNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of acts) m.set(a.id, a.name);
    return m;
  }, [acts]);

  const loadActsAndSongs = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setActs([]);
      setSongs([]);
      setDrafts({});
      setLoading(false);
      return;
    }

    // (A) owner の acts
    const { data: ownedActs, error: ownedErr } = await supabase
      .from("acts")
      .select("id, name, act_type")
      .eq("owner_profile_id", user.id)
      .order("created_at", { ascending: false });

    if (ownedErr) console.error("load owned acts error", ownedErr);

    // (B) member の acts（共有名義）
    const { data: actMembers, error: amErr } = await supabase
      .from("act_members")
      .select(
        `
        act:acts (
          id,
          name,
          act_type
        )
      `
      )
      .eq("profile_id", user.id)
      .eq("status", "active");

    if (amErr) console.error("load act_members error", amErr);

    const memberActs = (actMembers ?? [])
      .map((r: any) => normalizeAct(r.act))
      .filter(Boolean) as ActRow[];

    // merge + dedupe（idで）
    const mergedMap = new Map<string, ActRow>();
    for (const a of (ownedActs ?? []) as any[]) {
      if (a?.id) mergedMap.set(a.id, a as ActRow);
    }
    for (const a of memberActs) mergedMap.set(a.id, a);

    const mergedActs = Array.from(mergedMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "ja")
    );

    setActs(mergedActs);

    // songs（RLSにより、自分が触れる分だけ返る）
    const { data: s, error: sErr } = await supabase
      .from("act_songs")
      .select("id, act_id, title, memo, created_at")
      .order("created_at", { ascending: false });

    if (sErr) {
      console.error("load act_songs error", sErr);
      setSongs([]);
    } else {
      const rows = (s ?? []) as SongRow[];
      setSongs(rows);

      // drafts 初期化（現在値を下書きに入れておくと編集が安定）
      const nextDrafts: Record<string, Draft> = {};
      for (const row of rows) {
        nextDrafts[row.id] = {
          act_id: row.act_id,
          memo: row.memo ?? "",
        };
      }
      setDrafts(nextDrafts);
    }

    setSavingId(null);
    setLoading(false);
  };

  useEffect(() => {
    void loadActsAndSongs();
  }, []);

  const setDraft = (songId: string, patch: Partial<Draft>) => {
    setDrafts((prev) => ({
      ...prev,
      [songId]: {
        act_id: prev[songId]?.act_id ?? "",
        memo: prev[songId]?.memo ?? "",
        ...patch,
      },
    }));
  };

  const saveSong = async (songId: string) => {
    const d = drafts[songId];
    if (!d) return;

    setSavingId(songId);
    try {
      const patch: Partial<Pick<SongRow, "act_id" | "memo">> = {
        act_id: d.act_id,
        memo: d.memo.trim() ? d.memo.trim() : null,
      };

      const { error } = await supabase.from("act_songs").update(patch).eq("id", songId);
      if (error) {
        console.error("update song error", error);
        // 失敗したら再読み込みで整合性を戻す
        await loadActsAndSongs();
        return;
      }

      // 成功したら一覧も更新（見た目が即反映される）
      setSongs((prev) =>
        prev.map((s) => (s.id === songId ? { ...s, ...patch } as SongRow : s))
      );
    } finally {
      setSavingId(null);
    }
  };

  const deleteSong = async (id: string) => {
    const ok = confirm("この曲を削除しますか？");
    if (!ok) return;

    setSongs((prev) => prev.filter((s) => s.id !== id));
    setDrafts((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });

    const { error } = await supabase.from("act_songs").delete().eq("id", id);
    if (error) {
      console.error("delete song error", error);
      await loadActsAndSongs();
    }
  };

  if (loading) {
    return <main className="p-4 text-sm text-gray-500">読み込み中…</main>;
  }

  return (
    <main className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">演奏できる曲</h1>
          <p className="text-xs text-gray-600 mt-1">
            名義（出演名義）やメモを、あとから落ち着いて整えられます。
          </p>
        </div>
        <Link href="/musician" className="text-xs text-blue-600 underline underline-offset-2">
          ダッシュボードへ
        </Link>
      </header>

      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="曲名で検索"
          className="flex-1 rounded border px-3 py-2 text-sm"
        />
        <button
          onClick={() => void loadActsAndSongs()}
          className="rounded border px-3 py-2 text-sm hover:bg-gray-50"
        >
          再読み込み
        </button>
      </div>

      {filteredSongs.length === 0 ? (
        <div className="rounded border bg-white p-4 text-sm text-gray-600">
          まだ曲がありません。ダッシュボードから1曲だけ追加してみてください。
        </div>
      ) : (
        <div className="space-y-2">
          {filteredSongs.map((s) => {
            const d = drafts[s.id] ?? { act_id: s.act_id, memo: s.memo ?? "" };
            const changed = d.act_id !== s.act_id || (d.memo ?? "") !== (s.memo ?? "");

            return (
              <div key={s.id} className="rounded-lg border bg-white p-3 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{s.title}</div>
                    <div className="text-[11px] text-gray-500">
                      現在の名義：{actNameById.get(s.act_id) ?? "（不明）"}
                    </div>
                  </div>

                  <button
                    onClick={() => void deleteSong(s.id)}
                    className="shrink-0 text-[11px] text-red-600 hover:underline"
                  >
                    削除
                  </button>
                </div>

                <div className="grid gap-2 md:grid-cols-[220px_1fr]">
                  <label className="text-xs text-gray-600">
                    名義
                    <select
                      value={d.act_id}
                      onChange={(e) => setDraft(s.id, { act_id: e.target.value })}
                      className="mt-1 w-full rounded border px-2 py-2 text-sm bg-white"
                    >
                      {acts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="text-xs text-gray-600">
                    メモ（任意）
                    <input
                      value={d.memo}
                      onChange={(e) => setDraft(s.id, { memo: e.target.value })}
                      placeholder="例：4人時代の曲 / アンコール用 / 最近やってない"
                      className="mt-1 w-full rounded border px-3 py-2 text-sm"
                    />
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2">
                  {changed && (
                    <span className="text-[11px] text-gray-500">未保存の変更があります</span>
                  )}
                  <button
                    disabled={!changed || savingId === s.id}
                    onClick={() => void saveSong(s.id)}
                    className="rounded bg-gray-800 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
                  >
                    {savingId === s.id ? "更新中…" : "更新"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
