// app/musician/songs/SongsPageClient.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ACTS_UPDATED_EVENT } from "@/lib/actEvents";

type ActRow = {
  id: string;
  name: string;
  act_type: string | null;
  owner_profile_id: string;
};

type SongRow = {
  id: string;
  act_id: string;
  title: string;
  memo: string | null;
  created_at: string;
};

type MemberRow = {
  act_id: string;
  is_admin: boolean;
  status: string | null;
};

function typeLabel(t: string | null) {
  if (!t) return "種別未設定";
  if (t === "solo") return "ソロ";
  if (t === "band") return "バンド";
  if (t === "duo") return "デュオ";
  if (t === "unit") return "ユニット";
  return t;
}

export default function SongsPageClient() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [acts, setActs] = useState<ActRow[]>([]);
  const [songs, setSongs] = useState<SongRow[]>([]);
  const [memberActIds, setMemberActIds] = useState<Set<string>>(new Set());

  const [q, setQ] = useState("");
  const [openActIds, setOpenActIds] = useState<Set<string>>(new Set()); // 折り畳み状態

  const songsByActId = useMemo(() => {
    const map: Record<string, SongRow[]> = {};
    for (const s of songs) (map[s.act_id] ??= []).push(s);
    // 各名義内は曲名昇順
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => a.title.localeCompare(b.title, "ja"));
    }
    return map;
  }, [songs]);

  const filteredSongsByActId = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return songsByActId;

    const out: Record<string, SongRow[]> = {};
    for (const [actId, list] of Object.entries(songsByActId)) {
      const f = list.filter((s) => s.title.toLowerCase().includes(t));
      if (f.length) out[actId] = f;
    }
    return out;
  }, [songsByActId, q]);

  const loadAll = async () => {
    setLoading(true);

    const { data: u } = await supabase.auth.getUser();
    const uid = u.user?.id ?? null;
    setUserId(uid);

    if (!uid) {
      setActs([]);
      setSongs([]);
      setMemberActIds(new Set());
      setOpenActIds(new Set());
      setLoading(false);
      return;
    }

    // member判定（編集可否用）
    {
      const { data: mem, error: memErr } = await supabase
        .from("act_members")
        .select("act_id, is_admin, status")
        .eq("profile_id", uid)
        .eq("status", "active");

      if (memErr) {
        console.error("load act_members error", memErr);
        setMemberActIds(new Set());
      } else {
        setMemberActIds(new Set(((mem ?? []) as unknown as MemberRow[]).map((m) => m.act_id)));
      }
    }

    // acts（RLSで owner+member が見える前提）
    const { data: actsData, error: aErr } = await supabase
      .from("acts")
      .select("id, name, act_type, owner_profile_id")
      .order("name", { ascending: true });

    if (aErr) {
      console.error("load acts error", aErr);
      setActs([]);
      setSongs([]);
      setLoading(false);
      return;
    }

    const actList = (actsData ?? []) as ActRow[];
    setActs(actList);

    if (actList.length === 0) {
      setSongs([]);
      setOpenActIds(new Set());
      setLoading(false);
      return;
    }

    const actIds = actList.map((a) => a.id);

    // act_songs（songsテーブルは無い前提）
    const { data: songsData, error: sErr } = await supabase
      .from("act_songs")
      .select("id, act_id, title, memo, created_at")
      .in("act_id", actIds)
      .order("created_at", { ascending: false });

    if (sErr) {
      console.error("load act_songs error", sErr);
      setSongs([]);
      setOpenActIds(new Set());
      setLoading(false);
      return;
    }

    const rows = (songsData ?? []) as SongRow[];
    setSongs(rows);

    // 折り畳み初期：曲がある名義は開く（名義が多くても“空名義”を畳める）
    const nextOpen = new Set<string>();
    for (const a of actList) {
      const has = rows.some((s) => s.act_id === a.id);
      if (has) nextOpen.add(a.id);
    }
    setOpenActIds(nextOpen);

    setLoading(false);
  };

  useEffect(() => {
    void loadAll();
  }, []);

  // acts の改名に追随
  useEffect(() => {
    const onUpdate = () => void loadAll();
    window.addEventListener(ACTS_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(ACTS_UPDATED_EVENT, onUpdate);
  }, []);

  const canEdit = (act: ActRow) => {
    if (!userId) return false;
    if (act.owner_profile_id === userId) return true;
    if (memberActIds.has(act.id)) return true;
    return false;
  };

  const toggleAct = (actId: string) => {
    setOpenActIds((prev) => {
      const next = new Set(prev);
      if (next.has(actId)) next.delete(actId);
      else next.add(actId);
      return next;
    });
  };

  const expandAll = () => setOpenActIds(new Set(acts.map((a) => a.id)));
  const collapseAll = () => setOpenActIds(new Set());

  const addSong = async (actId: string, title: string) => {
    const t = title.trim();
    if (!t) throw new Error("曲名を入力してください");

    const { data, error } = await supabase
      .from("act_songs")
      .insert({ act_id: actId, title: t, memo: null })
      .select("id, act_id, title, memo, created_at")
      .single();

    if (error) throw error;

    const added = data as SongRow;
    setSongs((prev) => [added, ...prev]);

    // 追加した名義は自動で開く
    setOpenActIds((prev) => new Set(prev).add(actId));
  };

  if (loading) {
    return <main className="text-sm text-gray-500">読み込み中…</main>;
  }

  if (!userId) {
    return (
      <main className="space-y-2">
        <h1 className="text-xl font-bold">曲目</h1>
        <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">
          ログインすると、名義ごとの曲リストを管理できます。
        </div>
        <Link href="/login" className="text-sm text-blue-700 hover:underline">
          ログインへ
        </Link>
      </main>
    );
  }

  if (acts.length === 0) {
    return (
      <main className="space-y-2">
        <h1 className="text-xl font-bold">曲目</h1>
        <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">
          まずは名義（アクト）を作成してください。
          <Link href="/musician/acts" className="ml-2 text-blue-700 hover:underline">
            名義を作る
          </Link>
        </div>
      </main>
    );
  }

  const hasAny = Object.keys(filteredSongsByActId).length > 0;

  return (
    <main className="space-y-4 max-w-4xl">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">曲目</h1>
          <p className="text-xs text-gray-600 mt-1">
            一覧は探す場所。メモは曲詳細で集中して書けます。
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void loadAll()}
            className="rounded border px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
          >
            再読み込み
          </button>
          <Link href="/musician" className="text-xs text-blue-600 underline underline-offset-2">
            ダッシュボードへ
          </Link>
        </div>
      </header>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="曲名で検索"
          className="w-full sm:flex-1 rounded border px-3 py-2 text-sm"
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={expandAll}
            className="rounded border px-3 py-2 text-xs hover:bg-gray-50"
          >
            全部ひらく
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="rounded border px-3 py-2 text-xs hover:bg-gray-50"
          >
            全部たたむ
          </button>
        </div>
      </div>

      {!hasAny ? (
        <div className="rounded border bg-white p-4 text-sm text-gray-600">
          該当する曲がありません。
        </div>
      ) : (
        <div className="space-y-3">
          {acts.map((act) => {
            const list = filteredSongsByActId[act.id] ?? [];
            const total = (songsByActId[act.id] ?? []).length;
            const editable = canEdit(act);
            const open = openActIds.has(act.id);

            // 検索時：ヒット0の名義は非表示（スクロール量削減）
            const searching = q.trim().length > 0;
            if (searching && list.length === 0) return null;

            return (
              <section key={act.id} className="rounded-xl border bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleAct(act.id)}
                  className="w-full px-4 py-3 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0 text-left">
                    <div className="text-sm font-semibold truncate">{act.name}</div>
                    <div className="text-[11px] text-gray-500">
                      {typeLabel(act.act_type)} / {searching ? `${list.length}件ヒット（全${total}曲）` : `${total}曲`}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{open ? "▲" : "▼"}</span>
                </button>

                {open && (
                  <div className="px-4 pb-4 space-y-3">
                    {total === 0 ? (
                      <div className="text-sm text-gray-600">まだ曲が登録されていません。</div>
                    ) : (
                      <ul className="space-y-1">
                        {list.map((s) => (
                          <li key={s.id}>
                            <Link
                              href={`/musician/songs/${s.id}`}
                              className="block rounded px-2 py-2 hover:bg-gray-50"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-sm font-medium truncate">{s.title}</div>
                                <span className="text-[11px] text-gray-400 shrink-0">詳細</span>
                              </div>
                              {s.memo && (
                                <div className="mt-1 text-[11px] text-gray-600 line-clamp-2 whitespace-pre-wrap">
                                  {s.memo}
                                </div>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="pt-3 border-t">
                      {editable ? (
                        <InlineAdd onAdd={(title) => addSong(act.id, title)} />
                      ) : (
                        <div className="text-[11px] text-gray-500">
                          この名義は閲覧のみです（編集権限なし）
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}

function InlineAdd({ onAdd }: { onAdd: (title: string) => Promise<void> }) {
  const [title, setTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    const t = title.trim();
    if (!t) {
      setErr("曲名を入力してください");
      return;
    }
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
          placeholder="曲名を追加"
          className="flex-1 rounded border px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => void submit()}
          disabled={adding}
          className={[
            "shrink-0 rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white",
            adding ? "opacity-60" : "hover:bg-emerald-700",
          ].join(" ")}
        >
          {adding ? "追加中…" : "追加"}
        </button>
      </div>
      {err && <div className="text-[11px] text-red-600">{err}</div>}
    </div>
  );
}
