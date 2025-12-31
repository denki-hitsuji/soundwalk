"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useCurrentAct } from "@/lib/useCurrentAct";
import { ActInviteBox } from "@/components/acts/ActInviteBox";
import { notifyActsUpdated } from "@/lib/actEvents";
import { ActProfileEditor } from "@/components/acts/ActProfileEditor";
import { icon } from "leaflet";
import { ActRow } from "@/lib/actQueries";

type MemberRow = {
  act_id: string;
  is_admin: boolean;
  status: string | null;
  acts: ActRow | ActRow[] | null;
};

function normalizeAct(a: ActRow | ActRow[] | null): ActRow | null {
  if (!a) return null;
  return Array.isArray(a) ? a[0] ?? null : a;
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700">{children}</span>;
}

function ActCard({
  act,
  subtitle,
  canInvite,
  canDelete,
  onDelete,
  canEditName,
  onRename,
  onProfileUpdated, // ★追加
}: {
  act: ActRow;
  subtitle: React.ReactNode;
  canInvite: boolean;
  canDelete: boolean;
  onDelete?: () => void;
  canEditName: boolean;
  onRename: (nextName: string) => Promise<void>;
  onProfileUpdated?: (patch: Partial<ActRow>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(act.name);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // 外から name が更新された場合の追随
  useEffect(() => {
    if (!editing) setName(act.name);
  }, [act.name, editing]);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setErr("名前を入力してください");
      return;
    }

    setErr(null);
    setSaving(true);
    try {
      await onRename(trimmed);
      setEditing(false);
    } catch (e: any) {
      setErr(e?.message ?? "更新に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded border bg-white px-3 py-3 text-sm space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {!editing ? (
            <>
              <div className="font-medium truncate">{act.name}</div>
              <div className="mt-0.5 text-[11px] text-gray-500 flex items-center gap-2">{subtitle}</div>
            </>
          ) : (
            <div className="space-y-1">
              <div className="text-[11px] text-gray-500">アクト名</div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded border px-2 py-1 text-sm"
                placeholder="例：さとレックス / The Holidays"
              />
              {err && <div className="text-[11px] text-red-600">{err}</div>}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void submit()}
                  disabled={saving}
                  className={[
                    "inline-flex items-center rounded bg-blue-600 px-3 py-1.5 text-[11px] font-medium text-white",
                    saving ? "opacity-60" : "hover:bg-blue-700",
                  ].join(" ")}
                >
                  {saving ? "保存中…" : "保存"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setName(act.name);
                    setErr(null);
                  }}
                  className="text-[11px] text-gray-600 hover:underline"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
        </div>
       <div className="shrink-0 flex items-center gap-3">
          {!editing && canEditName && (
            <button
              type="button"
              onClick={() => {
                setEditing(true);
                setErr(null);
              }}
              className="text-[11px] text-blue-700 hover:underline"
              title="名前を編集"
            >
              名前を編集
            </button>
          )}

          {canDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="text-[11px] text-red-600 hover:underline"
            >
              削除
            </button>
          )}
        </div>

      </div>
        <ActProfileEditor
          act={act}
          onUpdated={(patch) => onProfileUpdated?.(patch)}
        />
 
      {canInvite && <ActInviteBox actId={act.id} />}
    </div>
  );
}

export default function ActsPage() {
  const router = useRouter();
  const { currentAct, setCurrentAct } = useCurrentAct();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [ownedActs, setOwnedActs] = useState<ActRow[]>([]);
  const [memberActs, setMemberActs] = useState<ActRow[]>([]);
  const [memberMap, setMemberMap] = useState<Record<string, { is_admin: boolean }>>({});

  // 初回作成フォーム用
  const [soloName, setSoloName] = useState("");
  const [creatingSolo, setCreatingSolo] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const applyActPatch = (actId: string, patch: Partial<ActRow>) => {
    setOwnedActs((prev) => prev.map((a) => (a.id === actId ? { ...a, ...patch } : a)));
    setMemberActs((prev) => prev.map((a) => (a.id === actId ? { ...a, ...patch } : a)));

    setCurrentAct((prev) => {
      if (!prev || prev.id !== actId) return prev;
      return { ...prev, ...patch };
    });
    notifyActsUpdated();
  };
  const load = async () => {
    setLoading(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id ?? null;
      setUserId(uid);

      if (!uid) {
        setOwnedActs([]);
        setMemberActs([]);
        setMemberMap({});
        return;
      }

      const { data: owned, error: ownedErr } = await supabase
        .from("acts")
        .select("id, name, act_type, description, photo_url, profile_link_url, owner_profile_id, created_at")
        .eq("owner_profile_id", uid)
        .order("created_at", { ascending: false });

      if (ownedErr) console.error("load owned acts error", ownedErr);

      const { data: mem, error: memErr } = await supabase
        .from("act_members")
        .select("act_id, is_admin, status, acts:acts ( id, name, act_type, owner_profile_id )")
        .eq("profile_id", uid)
        .eq("status", "active");

      if (memErr) console.error("load member acts error", memErr);

      const mm: Record<string, { is_admin: boolean }> = {};
      const mActs: ActRow[] = [];

      for (const r of (mem ?? []) as unknown as MemberRow[]) {
        mm[r.act_id] = { is_admin: r.is_admin === true };
        const a = normalizeAct(r.acts);
        if (a) mActs.push(a);
      }

      const ownedSet = new Set((owned ?? []).map((a: any) => a.id as string));
      const filteredMember = mActs.filter((a) => !ownedSet.has(a.id));

      setOwnedActs((owned ?? []) as unknown as ActRow[]);
      setMemberActs(filteredMember);
      setMemberMap(mm);

      if ((owned ?? []).length === 0 && soloName.trim() === "") {
        const { data: prof } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", uid)
          .single();
        const dn = (prof?.display_name ?? "").trim();
        if (dn) setSoloName(dn);
      }
    } catch (e) {
      console.error("acts load fatal", e);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    void load();
  }, []);

  useEffect(() => {
    console.log("parent member acts", memberActs.map(a => ({ id: a.id, desc: a.description })));
  }, [memberActs]);
  useEffect(() => {
        console.log("parent owned acts", ownedActs.map(a => ({ id: a.id, desc: a.description })));
    }, [ownedActs]);
  const createSoloAct = async () => {
    
    setCreateError(null);

    const name = soloName.trim();
    if (!name) {
      setCreateError("ミュージシャン名（名義名）を入力してください");
      return;
    }

    setCreatingSolo(true);
    try {
      const uid = userId;
      if (!uid) {
        setCreateError("ログイン情報が見つかりません。再ログインしてください。");
        return;
      }

      const { data: inserted, error: insErr } = await supabase
        .from("acts")
        .insert({
          name,
          act_type: "solo",
          photo_url: null,
          profile_link_url: null,
          owner_profile_id: uid,
          description: "",
          avatar_url: null,
          is_temporary: false,
          icon_url: null,
        })
        .select("id, name, act_type, owner_profile_id, photo_url, profile_link_url, description, is_temporary, icon_url")
        .single();

      if (insErr) throw insErr;

      // currentAct に即セット
      setCurrentAct(inserted as ActRow);
      notifyActsUpdated();
      // 再ロードで画面反映
      await load();
      router.refresh();
    } catch (e: any) {
      console.error("create solo act error", e);
      setCreateError(e?.message ?? "作成に失敗しました");
    } finally {
      setCreatingSolo(false);
    }
  };

  const renameAct = async (actId: string, nextName: string) => {
    const { data, error } = await supabase
      .from("acts")
      .update({ name: nextName })
      .eq("id", actId)
      .select("id, name, act_type, owner_profile_id,photo_url, profile_link_url, description")
      .single();

    if (error) throw error;

    // state反映
    setOwnedActs((prev) => prev.map((a) => (a.id === actId ? (data as ActRow) : a)));
    setMemberActs((prev) => prev.map((a) => (a.id === actId ? (data as ActRow) : a)));

    // currentAct だったら追随
    if (currentAct?.id === actId) {
      setCurrentAct(data as ActRow);
    }

    // ★ これを追加：ActSwitcherへ「一覧が更新された」と通知
    notifyActsUpdated();
  };

  const canInvite = (act: ActRow) => {
    if (!userId) return false;
    if (act.owner_profile_id === userId) return true;
    return memberMap[act.id]?.is_admin === true;
  };

  const canEditName = (act: ActRow) => {
    // “編集できる” をどうするかは設計次第
    // 今回は「owner と admin member は編集可」にしておく（安全）
    if (!userId) return false;
    if (act.owner_profile_id === userId) return true;
    return memberMap[act.id]?.is_admin === true;
  };

  if (loading) return <main className="p-4 text-sm text-gray-500">読み込み中…</main>;

  return (
    <main className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-bold">出演名義（アクト）</h1>
        <p className="text-xs text-gray-600">
          ソロ / バンド / デュオ などの「名義」を管理します。招待で参加した名義もここに出ます。
        </p>
      </header>

      {/* あなたの名義（owner） */}
      <section className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-gray-800">あなたの名義</h2>
          <span className="text-[11px] text-gray-500">{ownedActs.length}件</span>
  <Link
    href="/musician/acts/new"
    className="text-xs text-blue-600 hover:underline"
  >
    + 名義を追加
  </Link>
        </div>

        {ownedActs.length === 0 ? (
          <div className="rounded-lg border bg-white p-4 space-y-3">
            <div className="text-sm font-medium">まずはソロ名義を作りましょう</div>
            <div className="text-sm text-gray-600">
              最初の名義があると、ライブ記録・曲・段取り共有がすぐ使えます。
            </div>

            <div className="space-y-1">
              <div className="text-[11px] text-gray-500">ミュージシャン名（名義名）</div>
              <input
                value={soloName}
                onChange={(e) => setSoloName(e.target.value)}
                className="w-full max-w-md rounded border px-3 py-2 text-sm"
                placeholder="例：さとレックス"
              />
              <div className="text-[11px] text-gray-500">
                ※ ここで入力した名前が、そのままソロ名義になります（後で変更できます）
              </div>
            </div>

            {createError && <div className="text-sm text-red-600">{createError}</div>}

            <button
              type="button"
              onClick={() => void createSoloAct()}
              disabled={creatingSolo}
              className={[
                "inline-flex items-center justify-center rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white max-w-md",
                creatingSolo ? "opacity-60" : "hover:bg-blue-700",
              ].join(" ")}
            >
              {creatingSolo ? "作成中…" : "この名前でソロ名義を作る"}
            </button>
          </div>
        ) : (
          <div className="space-y-2 max-w-md">
              {ownedActs.map((act) => (
              <ActCard
  key={act.id}
  act={act}
  subtitle={<Badge>owner</Badge>}
  canInvite={canInvite(act)}
  canDelete={true}
  canEditName={canEditName(act)}
  onRename={(next) => renameAct(act.id, next)}
  onProfileUpdated={(patch) => applyActPatch(act.id, patch)}
/>
            
            ))}
          </div>
        )}
      </section>

      {/* 参加中の名義（member） */}
      <section className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-gray-800">参加中の名義</h2>
          <span className="text-[11px] text-gray-500">{memberActs.length}件</span>
        </div>

        {memberActs.length === 0 ? (
          <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">
            まだ招待で参加した名義がありません。招待リンクを受け取ったらここに増えていきます。
          </div>
        ) : (
          <div className="space-y-2 max-w-md">
            {memberActs.map((act) => {
              const isAdmin = memberMap[act.id]?.is_admin === true;

              return (
                <ActCard
                  key={act.id}
                  act={act}
                  subtitle={
                    <div className="flex items-center gap-2">
                      <Badge>member</Badge>
                      {isAdmin && <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] text-emerald-800">admin</span>}
                    </div>
                  }
                  canInvite={isAdmin}
                  canDelete={false}
                  canEditName={isAdmin} // admin member は編集できる設計にしておく（安全）
                  onRename={(next) => renameAct(act.id, next)}
                  onProfileUpdated={(patch): void => applyActPatch(act.id, patch)}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* 補助：currentAct が未選択なら軽く促す */}
      {!currentAct && (ownedActs.length + memberActs.length) > 0 && (
        <div className="rounded-lg border bg-white p-3 text-sm text-gray-600">
          どの名義で操作するかは、画面上部の「名義」から切り替えできます。
        </div>
      )}
    </main>
  );
}
