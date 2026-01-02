"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

// 既存で使ってるなら import して流用してください
import { ActProfileEditor } from "@/components/acts/ActProfileEditor";
import { ActInviteBox } from "@/components/acts/ActInviteBox";
import ActPublicPageEditor from "@/components/acts/ActPublicPageEditor";
import { ActRow } from "@/lib/db/acts";
import { PerformanceRow } from "@/lib/performanceUtils";
import { notifyActsUpdated } from "@/lib/db/actEvents";
import { useCurrentAct } from "@/lib/hooks/useCurrentAct";
import { supabase } from "@/lib/supabase/client.legacy";

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

const rank = (s: string | null) => (s === "offered" ? 0 : s === "pending_reconfirm" ? 1 : 2);

const statusBadge: Record<string, { label: string; cls: string }> = {
  offered: { label: "🟡 オファー", cls: "bg-blue-100 text-blue-800" },
  pending_reconfirm: { label: "🟣 要再確認", cls: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "✅ 確定", cls: "bg-green-100 text-green-800" },
};

function ymdToText(ymd: string) {
  // 2026-01-02 -> 2026/01/02
  return ymd?.replaceAll("-", "/");
}

export default function ActDetailClient({ actId }: { actId: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const { currentAct, setCurrentAct } = useCurrentAct();
  const mode = sp.get("mode");
  const isEdit = mode === "edit";

  const [userId, setUserId] = useState<string | null>(null);
  const [member, setMember] = useState<MemberRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [act, setAct] = useState<ActRow | null>(null);

  // 表示モード用：直近ライブ + 曲20件
  const [nextPerformance, setNextPerformance] = useState<PerformanceRow | null>(null);
  const [songs, setSongs] = useState<SongRow[]>([]);

  // 権限（最低限：owner/adminだけ編集を見せたいならここで制御）
  const [canEdit, setCanEdit] = useState(false);

  const isOwner = useMemo(() => !!(act && userId && act.owner_profile_id === userId), [act, userId]);
  const isAdminMember = useMemo(() => member?.is_admin === true, [member]);
  const canInvite = useMemo(() => isOwner || isAdminMember, [isOwner, isAdminMember]);
  const canDelete = useMemo(() => isOwner, [isOwner]);
function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700">{children}</span>;
}
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
  const goEdit = () => {
    const params = new URLSearchParams(sp.toString());
    params.set("mode", "edit");
    router.replace(`?${params.toString()}`);
  };

  const goView = () => {
    const params = new URLSearchParams(sp.toString());
    params.delete("mode");
    const q = params.toString();
    router.replace(q ? `?${q}` : "?");
  };
   const applyActPatch = (patch: Partial<ActRow>) => {
    setAct((prev) => (prev ? { ...prev, ...patch } : prev));

    // currentAct がこの act なら追随
    setCurrentAct((prev) => {
      if (!prev || prev.id !== actId) return prev;
      return { ...prev, ...patch };
    });

    notifyActsUpdated();
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

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // user
        const { data: u, error: uErr } = await supabase.auth.getUser();
        if (uErr) throw uErr;
        const uid = u.user?.id ?? null;
        setUserId(uid);
        // act
        {
          const { data, error } = await supabase
            .from("acts")
            .select("id, name, act_type, owner_profile_id, description, photo_url, profile_link_url")
            .eq("id", actId)
            .maybeSingle();

          if (error) throw error;
          setAct((data as ActRow) ?? null);

          // 編集権限：とりあえず owner のみ（あなたの is_act_admin があるならそれも足せる）
          if (uid && data?.owner_profile_id === uid) setCanEdit(true);
          else setCanEdit(false);
        }

        // next performance: offeredも含める（仕様）
        {
          // musician_performances に event_title が無いなら events join して取る必要あり
          // ここでは最小で「event_titleはnullでも可」にしておく
          const today = new Date();
          const todayYmd = today.toISOString().slice(0, 10);

          const { data, error } = await supabase
            .from("musician_performances")
            .select("id, event_date, venue_name, status, event_id, open_time, start_time")
            .eq("act_id", actId)
            .gte("event_date", todayYmd)
            .in("status", ["offered", "pending_reconfirm", "confirmed"])
            // まず日付昇順で候補を取る
            .order("event_date", { ascending: true })
            .limit(10);

          if (error) throw error;

          const list = (data ?? []) as any[];
          // ランク優先（offeredを一番上に出す）
          list.sort((a, b) => {
            const r = rank(a.status) - rank(b.status);
            if (r !== 0) return r;
            return (a.event_date ?? "").localeCompare(b.event_date ?? "");
          });

          const top = list[0] ?? null;

          // event_title を表示したいなら events から引く（1件だけなので追加クエリでOK）
          let eventTitle: string | null = null;
          if (top?.event_id) {
            const { data: e } = await supabase
              .from("events")
              .select("title")
              .eq("id", top.event_id)
              .maybeSingle();
            eventTitle = (e?.title as string | null) ?? null;
          }

          setNextPerformance(
            top
              ? ({
                id: top.id,
                profile_id: act?.owner_profile_id || "",
                act_id: actId,
                act_name: "",
                event_id: top.event_id,
                venue_id: null,
                memo: null,
                details: null,
                flyer_url: null,
                status: top.status,
                status_changed_at: null,
                status_reason: null,    
                  event_date: top.event_date,
                  venue_name: top.venue_name,
                  event_title: eventTitle,
                } satisfies PerformanceRow)
              : null
          );
        }

        // songs (max 20) : act_songs の構造に合わせて調整
        {
          // 例：act_songs に title がある前提
          const { data, error } = await supabase
            .from("act_songs")
            .select("id, title")
            .eq("act_id", actId)
            .order("title", { ascending: true })
            .limit(20);

          if (error) throw error;
          setSongs((data ?? []) as SongRow[]);
        }

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
      } catch (e) {
        console.error("act detail load error", e);
        setAct(null);
        setNextPerformance(null);
        setSongs([]);
        setCanEdit(false);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [actId]);

  if (loading) return <main className="p-4 text-sm text-gray-500">読み込み中…</main>;
  if (!act) return <main className="p-4 text-sm text-gray-500">名義が見つかりません。</main>;

  // ==============
  // 表示モード UI
  // ==============
  const ViewPanel = (
    <div className="space-y-6">
      {/* 次のライブ */}
      <section className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold text-gray-800">次のライブ</h2>

          <Link href={`/musician/performances?actId=${act.id}`} className="text-xs text-blue-600 hover:underline">
            一覧へ
          </Link>
        </div>

        {!nextPerformance ? (
          <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">予定はまだありません。</div>
        ) : (
          <div className="rounded-lg border bg-white p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold">
                {ymdToText(nextPerformance.event_date)}
                {nextPerformance.venue_name ? <span className="text-gray-600 font-normal"> @ {nextPerformance.venue_name}</span> : null}
              </div>

              {nextPerformance.status && statusBadge[nextPerformance.status] ? (
                <span className={`rounded px-2 py-0.5 text-[11px] ${statusBadge[nextPerformance.status].cls}`}>
                  {statusBadge[nextPerformance.status].label}
                </span>
              ) : null}
            </div>

            {nextPerformance.event_title ? (
              <div className="text-base font-bold">{nextPerformance.event_title}</div>
            ) : null}

            <div className="text-xs text-gray-500">
              ※ 未決定イベントも表示します（早く決める必要があるため）
            </div>
          </div>
        )}
      </section>

      {/* 曲目一覧（20件） */}
      <section className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold text-gray-800">曲目</h2>
          <Link href={`/musician/songs?actId=${act.id}`} className="text-xs text-blue-600 hover:underline">
            曲ページへ
          </Link>
        </div>

        {songs.length === 0 ? (
          <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">曲がまだありません。</div>
        ) : (
          <div className="rounded-lg border bg-white p-2">
            <ul className="divide-y">
              {songs.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/musician/songs?actId=${act.id}`}
                    className="block px-2 py-2 text-sm hover:bg-gray-50"
                    title="曲ページへ（この名義で絞り込み）"
                  >
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="px-2 pt-2 text-[11px] text-gray-500">※ 表示は最大20件です</div>
          </div>
        )}
      </section>

      {/* SNSシェア（とりあえずコピー） */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-800">共有</h2>

        <div className="rounded-lg border bg-white p-3 space-y-2">
          <div className="text-xs text-gray-600">
            告知文をコピーして共有できます（SNSボタンは後で強化できます）。
          </div>

          <button
            type="button"
            className="inline-flex items-center rounded bg-gray-900 px-3 py-2 text-xs font-medium text-white hover:opacity-90"
            onClick={async () => {
              const text = `${act.name} のページ\n${typeof window !== "undefined" ? window.location.href : ""}`;
              try {
                await navigator.clipboard.writeText(text);
                alert("コピーしました");
              } catch {
                alert("コピーに失敗しました（ブラウザ制限の可能性）");
              }
            }}
          >
            告知文をコピー
          </button>
        </div>
      </section>
    </div>
  );

  // ==============
  // 編集モード UI
  // ==============
  const EditPanel = (
    <div className="space-y-4">
      {/* ↓ 例：既存部品をここに移す（あなたの現行実装に合わせて差し替え） */}

      {/* プロフィール */}
      <section className="rounded border bg-white p-4 space-y-2">
        <h2 className="text-sm font-semibold text-gray-800">プロフィール</h2>
        <ActProfileEditor act={act} onUpdated={(patch) => applyActPatch(patch)} />
      </section>

      {/* 公開ページ */}
      <section className="rounded border bg-white p-4 space-y-2">
        <h2 className="text-sm font-semibold text-gray-800">公開ページ</h2>
        <ActPublicPageEditor actId={actId} actName={act.name} />
      </section>

      {/* 招待 */}
      {canInvite && (
        <section className="rounded border bg-white p-4 space-y-2">
          <h2 className="text-sm font-semibold text-gray-800">メンバー招待</h2>
          <p className="text-xs text-gray-600">
            招待リンクを作って共有できます（owner / admin のみ）。
          </p>
          <ActInviteBox actId={act.id} />
        </section>
      )}

      {/* 削除 */}
      <section className="rounded border bg-white p-4 space-y-2">
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
    </div>
  );

  return (
    <main className="space-y-6">
      {/* ヘッダー：ページタイトルはバンド名 */}
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex gap-3 items-center">
          <h1 className="text-xl font-bold truncate">{act.name}</h1>
          {roleLabel}</div>
          {/* プロフィールは畳む方針：リンク等だけ軽く */}
          <div className="mt-1 text-xs text-gray-600 flex flex-wrap items-center gap-2">
            {act.profile_link_url ? (
              <a className="text-blue-700 hover:underline" href={act.profile_link_url} target="_blank" rel="noreferrer">
                プロフィールリンク
              </a>
            ) : null}
            {act.photo_url ? <span className="text-gray-400">photoあり</span> : null}
          </div>
        </div>

        {/* 右上：閲覧/編集切替 */}
        {canEdit ? (
          !isEdit ? (
            <button
              type="button"
              onClick={goEdit}
              className="shrink-0 inline-flex items-center rounded bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
            >
              編集
            </button>
          ) : (
            <button
              type="button"
              onClick={goView}
              className="shrink-0 inline-flex items-center rounded bg-gray-900 px-3 py-2 text-xs font-medium text-white hover:opacity-90"
            >
              閲覧に戻る
            </button>
          )
        ) : null}
      </header>

      {/* 本体 */}
      {isEdit ? EditPanel : ViewPanel}

      {/* 編集モードに直リンクしたとき権限なしの場合の注意 */}
      {isEdit && !canEdit ? (
        <div className="rounded-lg border bg-white p-3 text-sm text-gray-600">
          編集権限がありません（閲覧モードで表示しています）。{/* 実際はEditPanel出さずにViewPanelに落としてもOK */}
        </div>
      ) : null}
    </main>
  );
}
