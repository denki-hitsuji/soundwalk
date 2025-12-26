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
  title: string; // ←違うならここをname等に
};

type MemberRow = {
  act_id: string;
  is_admin: boolean;
  status: string | null;
};

function typeLabel(actType: string | null) {
  if (!actType) return "種別未設定";
  if (actType === "solo") return "ソロ";
  if (actType === "band") return "バンド";
  if (actType === "duo") return "デュオ";
  return actType;
}

function ActSongsCard({
  act,
  songs,
  canEdit,
  onAdd,
}: {
  act: ActRow;
  songs: SongRow[];
  canEdit: boolean;
  onAdd: (actId: string, title: string) => Promise<void>;
}) {
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
      await onAdd(act.id, t);
      setTitle("");
    } catch (e: any) {
      setErr(e?.message ?? "追加に失敗しました");
    } finally {
      setAdding(false);
    }
  };

  return (
    <section className="rounded-xl border bg-white p-4 space-y-3">
      {/* 名義ラベル + リンク */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">{act.name}</div>
          <div className="text-[11px] text-gray-500">
            {typeLabel(act.act_type)} / {songs.length}曲
          </div>
        </div>

        <Link
          href="/musician/acts"
          className="shrink-0 text-[11px] text-blue-700 hover:underline"
          title="名義の管理へ"
        >
          名義を開く
        </Link>
      </div>

      {/* 曲一覧 */}
      {songs.length === 0 ? (
        <div className="text-sm text-gray-600">まだ曲が登録されていません。</div>
      ) : (
        <ul className="space-y-1 text-sm">
            {songs.map((s) => (
              <li key={s.id} className="flex items-start gap-2">
                <a href="/musician/songs">
                  <span className="text-gray-400">♪</span>
                  <span className="truncate">{s.title}</span>
                </a>
              </li>
          ))}
        </ul>
      )}

      {/* 追加（カード下） */}
      <div className="pt-2 border-t">
        {canEdit ? (
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
                {adding ? "追加中…" : "曲を追加"}
              </button>
            </div>
            {err && <div className="text-[11px] text-red-600">{err}</div>}
          </div>
        ) : (
          <div className="text-[11px] text-gray-500">
            この名義は閲覧のみです（編集権限がありません）
          </div>
        )}
      </div>
    </section>
  );
}

export function SongSummaryCard() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [acts, setActs] = useState<ActRow[]>([]);
  const [songs, setSongs] = useState<SongRow[]>([]);
  const [memberActIds, setMemberActIds] = useState<Set<string>>(new Set());

  const songsByActId = useMemo(() => {
    const map: Record<string, SongRow[]> = {};
    for (const s of songs) {
      (map[s.act_id] ??= []).push(s);
    }
    return map;
  }, [songs]);

  const loadAll = async () => {
    setLoading(true);

    const { data: u } = await supabase.auth.getUser();
    const uid = u.user?.id ?? null;
    setUserId(uid);

    if (!uid) {
      setActs([]);
      setSongs([]);
      setMemberActIds(new Set());
      setLoading(false);
      return;
    }

    // 参加名義（権限判定用）
    const { data: mem } = await supabase
      .from("act_members")
      .select("act_id, is_admin, status")
      .eq("profile_id", uid)
      .eq("status", "active");

    setMemberActIds(new Set(((mem ?? []) as unknown as MemberRow[]).map((m) => m.act_id)));

    // 名義一覧（RLSで owner+member が見える前提）
    const { data: actsData, error: aErr } = await supabase
      .from("acts")
      .select("id, name, act_type, owner_profile_id")
      .order("created_at", { ascending: false });

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
      setLoading(false);
      return;
    }

    // 曲一覧（全名義分まとめて）
    const actIds = actList.map((a) => a.id);

    const { data: songsData, error: sErr } = await supabase
      .from("act_songs")
      .select("id, act_id, title") // ←曲名カラムが違うならここ
      .in("act_id", actIds)
      .order("title", { ascending: true });

    if (sErr) {
      console.error("load songs error", sErr);
      setSongs([]);
      setLoading(false);
      return;
    }

    setSongs((songsData ?? []) as SongRow[]);
    setLoading(false);
  };

  useEffect(() => {
    void loadAll();
  }, []);

  // acts名の改名（actsページ）に追随
  useEffect(() => {
    const onUpdate = () => void loadAll();
    window.addEventListener(ACTS_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(ACTS_UPDATED_EVENT, onUpdate);
  }, []);

  const canEdit = (act: ActRow) => {
    if (!userId) return false;
    if (act.owner_profile_id === userId) return true;
    if (memberActIds.has(act.id)) return true; // ←「メンバーでも追加・編集」の方針
    return false;
  };

  const addSong = async (actId: string, title: string) => {
    // insert → state反映（再取得でもいいが軽く即反映）
    const { data, error } = await supabase
      .from("act_songs")
      .insert({ act_id: actId, title }) // ←曲名カラムが違うならここ
      .select("id, act_id, title")
      .single();

    if (error) throw error;

    setSongs((prev) => [{ ...(data as SongRow) }, ...prev].sort((a, b) => a.title.localeCompare(b.title)));
  };

  if (loading) {
    return <main className="text-sm text-gray-500">読み込み中…</main>;
  }

  if (!userId) {
    return (
      <main className="py-4 space-y-2">
        <h1 className="text-xl font-bold">演奏できる曲</h1>
        <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">
          ログインすると、名義ごとの曲リストを管理できます。
        </div>
      </main>
    );
  }

  return (
    <main className="py-4 space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-bold">演奏できる曲</h1>
        <p className="text-xs text-gray-600">
          名義ごとに「演奏できる曲」をまとめて見られます。曲追加も名義カードの下から行えます。
        </p>
      </header>

      {acts.length === 0 ? (
        <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">
          まずは名義（アクト）を作成してください。
          <Link href="/musician/acts" className="ml-2 text-blue-700 hover:underline">
            名義を作る
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {acts.map((act) => (
            <ActSongsCard
              key={act.id}
              act={act}
              songs={songsByActId[act.id] ?? []}
              canEdit={canEdit(act)}
              onAdd={addSong}
            />
          ))}
        </div>
      )}
    </main>
  );
}
