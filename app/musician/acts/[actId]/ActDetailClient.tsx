"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { ActRow } from "@/lib/actQueries";
import { ActProfileEditor } from "@/components/acts/ActProfileEditor";
import { ActInviteBox } from "@/components/acts/ActInviteBox";
import { notifyActsUpdated } from "@/lib/actEvents";
import { useCurrentAct } from "@/lib/useCurrentAct";

type MemberRow = {
  act_id: string;
  profile_id: string;
  is_admin: boolean;
  status: string | null;
};

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700">{children}</span>;
}

export default function ActDetailClient({ actId }: { actId: string }) {
  const router = useRouter();
  const { currentAct, setCurrentAct } = useCurrentAct();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [act, setAct] = useState<ActRow | null>(null);
  const [member, setMember] = useState<MemberRow | null>(null);
  const [fatal, setFatal] = useState<string | null>(null);

  // name edit
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameErr, setNameErr] = useState<string | null>(null);

  // type edit
  const [savingType, setSavingType] = useState(false);

  const isOwner = useMemo(() => !!(act && userId && act.owner_profile_id === userId), [act, userId]);
  const isAdminMember = useMemo(() => member?.is_admin === true, [member]);
  const canInvite = useMemo(() => isOwner || isAdminMember, [isOwner, isAdminMember]);
  const canEditName = useMemo(() => isOwner || isAdminMember, [isOwner, isAdminMember]);
  const canDelete = useMemo(() => isOwner, [isOwner]);

  const roleLabel = useMemo(() => {
    if (isOwner) return <Badge>owner</Badge>;
    if (member?.status === "active") {
      return (
        <div className="flex items-center gap-2">
          <Badge>member</Badge>
          {isAdminMember && <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] text-emerald-800">admin</span>}
        </div>
      );
    }
    return <Badge>閲覧</Badge>;
  }, [isOwner, isAdminMember, member?.status]);

  const load = async () => {
    setLoading(true);
    setFatal(null);

    try {
      // auth
      const { data: u, error: uErr } = await supabase.auth.getUser();
      if (uErr) throw uErr;
      const uid = u.user?.id ?? null;
      setUserId(uid);

      if (!uid) {
        setAct(null);
        setMember(null);
        setFatal("ログインが必要です。");
        return;
      }

      // act
      const { data: a, error: aErr } = await supabase
        .from("acts")
        .select("id, name, act_type, description, photo_url, profile_link_url, owner_profile_id, is_temporary, icon_url, created_at")
        .eq("id", actId)
        .maybeSingle();

      if (aErr) throw aErr;
      if (!a) {
        setAct(null);
        setMember(null);
        setFatal("名義が見つかりませんでした。URLが正しいか確認してください。");
        return;
      }

      setAct(a as unknown as ActRow);
      setName((a as any).name ?? "");
      setEditingName(false);
      setNameErr(null);

      // membership (owner でも取れるが、owner の場合は判定に使わないのでOK)
      const { data: m, error: mErr } = await supabase
        .from("act_members")
        .select("act_id, profile_id, is_admin, status")
        .eq("act_id", actId)
        .eq("profile_id", uid)
        .maybeSingle();

      if (mErr) {
        // member が無いケースもあるので fatal にはしない
        console.warn("load act_members error", mErr);
        setMember(null);
      } else {
        setMember((m as any) ?? null);
      }
    } catch (e: any) {
      console.error("act detail load fatal", e);
      setFatal(e?.message ?? "読み込みに失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actId]);

  const applyActPatch = (patch: Partial<ActRow>) => {
    setAct((prev) => (prev ? { ...prev, ...patch } : prev));

    // currentAct がこの act なら追随
    setCurrentAct((prev) => {
      if (!prev || prev.id !== actId) return prev;
      return { ...prev, ...patch };
    });

    notifyActsUpdated();
  };

  const saveName = async () => {
    if (!act) return;
    if (!canEditName) return;

    const trimmed = name.trim();
    if (!trimmed) {
      setNameErr("名義名を入力してください");
      return;
    }

    setNameErr(null);
    setSavingName(true);
    try {
      const { data, error } = await supabase
        .from("acts")
        .update({ name: trimmed })
        .eq("id", act.id)
        .select("id, name")
        .single();

      if (error) throw error;

      applyActPatch({ name: (data as any).name });
      setEditingName(false);
    } catch (e: any) {
      setNameErr(e?.message ?? "更新に失敗しました");
    } finally {
      setSavingName(false);
    }
  };

  const saveType = async (nextType: string) => {
    if (!act) return;
    if (!canEditName) return; // 今回は「編集できる人は type も編集できる」に寄せる

    setSavingType(true);
    try {
      const { data, error } = await supabase
        .from("acts")
        .update({ act_type: nextType })
        .eq("id", act.id)
        .select("id, act_type")
        .single();

      if (error) throw error;

      applyActPatch({ act_type: (data as any).act_type });
    } catch (e: any) {
      alert(e?.message ?? "種別の更新に失敗しました");
    } finally {
      setSavingType(false);
    }
  };

  const deleteAct = async () => {
    if (!act) return;
    if (!canDelete) return;

    const ok = window.confirm(
      "この名義を削除します。\n関連データ（招待やメンバー情報など）が残る設計の場合、後から参照不能になります。\n本当に削除しますか？"
    );
    if (!ok) return;

    try {
      const { error } = await supabase.from("acts").delete().eq("id", act.id);
      if (error) throw error;

      // currentAct なら解除
      if (currentAct?.id === act.id) setCurrentAct(null);

      notifyActsUpdated();
      router.push("/musician/acts");
      router.refresh();
    } catch (e: any) {
      console.error("delete act error", e);
      alert(e?.message ?? "削除に失敗しました");
    }
  };

  if (loading) {
    return <main className="p-4 text-sm text-gray-500">読み込み中…</main>;
  }

  if (fatal) {
    return (
      <main className="space-y-4">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">名義の詳細</h1>
            <p className="text-xs text-gray-600 mt-1">名義の編集・招待・削除ができます。</p>
          </div>
          <Link href="/musician/acts" className="text-xs text-blue-600 hover:underline">
            一覧へ戻る
          </Link>
        </header>

        <div className="rounded border bg-white p-4 text-sm text-red-600">{fatal}</div>
      </main>
    );
  }

  if (!act) {
    return (
      <main className="space-y-4">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">名義の詳細</h1>
          </div>
          <Link href="/musician/acts" className="text-xs text-blue-600 hover:underline">
            一覧へ戻る
          </Link>
        </header>

        <div className="rounded border bg-white p-4 text-sm text-gray-600">名義が見つかりませんでした。</div>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold truncate">名義の詳細</h1>
          <div className="mt-1 text-xs text-gray-600 flex items-center gap-2">
            {roleLabel}
            <span className="text-gray-400">/</span>
            <span className="truncate">{act.id}</span>
          </div>
        </div>

        <Link href="/musician/acts" className="shrink-0 text-xs text-blue-600 hover:underline">
          一覧へ戻る
        </Link>
      </header>

      {/* 基本情報 */}
      <section className="rounded border bg-white p-4 space-y-4 max-w-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {!editingName ? (
              <>
                <div className="text-sm text-gray-500">名義名</div>
                <div className="text-lg font-bold truncate">{act.name}</div>
              </>
            ) : (
              <div className="space-y-1">
                <div className="text-sm text-gray-500">名義名</div>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded border px-3 py-2 text-sm"
                />
                {nameErr && <div className="text-xs text-red-600">{nameErr}</div>}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void saveName()}
                    disabled={savingName}
                    className="inline-flex items-center rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                  >
                    {savingName ? "保存中…" : "保存"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingName(false);
                      setName(act.name);
                      setNameErr(null);
                    }}
                    className="text-xs text-gray-600 hover:underline"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            )}
          </div>

          {!editingName && canEditName && (
            <button
              type="button"
              onClick={() => {
                setEditingName(true);
                setNameErr(null);
              }}
              className="shrink-0 text-xs text-blue-700 hover:underline"
            >
              名前を編集
            </button>
          )}
        </div>

        <div className="space-y-1">
          <div className="text-sm text-gray-500">種別</div>
          <div className="flex items-center gap-3">
            <select
              className="w-full max-w-[220px] rounded border px-3 py-2 text-sm disabled:bg-gray-50"
              value={act.act_type ?? "solo"}
              disabled={!canEditName || savingType}
              onChange={(e) => void saveType(e.target.value)}
            >
              <option value="solo">ソロ</option>
              <option value="band">バンド</option>
              <option value="duo">デュオ</option>
              <option value="unit">ユニット</option>
              <option value="support">サポート</option>
            </select>

            {savingType && <span className="text-xs text-gray-500">更新中…</span>}
          </div>
          {!canEditName && <div className="text-xs text-gray-500">※ この名義の編集権限がありません</div>}
        </div>
      </section>

      {/* プロフィール */}
      <section className="rounded border bg-white p-4 space-y-2 max-w-xl">
        <h2 className="text-sm font-semibold text-gray-800">プロフィール</h2>
        <ActProfileEditor act={act} onUpdated={(patch) => applyActPatch(patch)} />
      </section>

      {/* 招待 */}
      {canInvite && (
        <section className="rounded border bg-white p-4 space-y-2 max-w-xl">
          <h2 className="text-sm font-semibold text-gray-800">メンバー招待</h2>
          <p className="text-xs text-gray-600">
            招待リンクを作って共有できます（owner / admin のみ）。
          </p>
          <ActInviteBox actId={act.id} />
        </section>
      )}

      {/* 削除 */}
      <section className="rounded border bg-white p-4 space-y-2 max-w-xl">
        <h2 className="text-sm font-semibold text-gray-800">危険な操作</h2>
        {!canDelete ? (
          <div className="text-sm text-gray-600">削除できるのは owner のみです。</div>
        ) : (
          <>
            <div className="text-xs text-gray-600">
              削除は取り消せません。先に、必要なメモやリンクを控えてください。
            </div>
            <button type="button" onClick={() => void deleteAct()} className="text-sm text-red-600 hover:underline">
              この名義を削除
            </button>
          </>
        )}
      </section>
    </main>
  );
}
