"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

// 既存で使ってるなら import して流用してください
import { ActProfileEditor } from "@/components/acts/ActProfileEditor";
import { ActInviteBox } from "@/components/acts/ActInviteBox";
import ActPublicPageEditor from "@/components/acts/ActPublicPageEditor";
import { deleteActById, serverRedirectTo } from "@/lib/api/actsAction";
import { PerformanceRow, PerformanceWithActs } from "@/lib/api/performances";
import { notifyActsUpdated } from "@/lib/db/actEvents";
import { useCurrentAct } from "@/lib/hooks/useCurrentAct";
import { SongRow } from "@/lib/api/songs";
import { addSong } from "@/lib/api/songsAction";
import { User } from "@supabase/auth-js";
import { ActRow, MemberRow } from "@/lib/utils/acts";
import { ActMemberRow } from "@/lib/db/acts";
import { ActMembersList } from "@/components/acts/ActMembersList";
import { InlineAddSong } from "@/components/acts/InlineAddSong";

const statusBadge: Record<string, { label: string; cls: string }> = {
  offered: { label: "🟡 オファー", cls: "bg-blue-100 text-blue-800" },
  pending_reconfirm: { label: "🟣 要再確認", cls: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "✅ 確定", cls: "bg-green-100 text-green-800" },
};

function ymdToText(ymd: string) {
  // 2026-01-02 -> 2026/01/02
  return ymd?.replaceAll("-", "/");
}

type Props = {
  user: User | null,
  act: ActRow,
  performances: PerformanceWithActs[],
  nextPerformance: PerformanceRow | null,
  songs: SongRow[],
  member: MemberRow,
  bandMembers: ActMemberRow[]
}

export default function ActDetailClient({user, act, performances, nextPerformance, songs: initialSongs, member,bandMembers }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [songList, setSongList] = useState<SongRow[]>(initialSongs);
  const { currentAct, setCurrentAct } = useCurrentAct();
  const mode = sp.get("mode");
  const isEdit = mode === "edit";

  const userId = user?.id;
  // 表示モード用：直近ライブ + 曲20件

  // 権限（owner/adminが編集モードに入れる）
  const isOwner = !!(act && userId && act.owner_profile_id === userId);
  const isAdminMember = (member?.is_admin === true);
  const canEdit = isOwner || isAdminMember;
  const canInvite = isOwner || isAdminMember;
  const canDelete = isOwner;
  const canManageMembers = isOwner; // メンバー権限変更・削除はOwnerのみ
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

    // // currentAct がこの act なら追随
    // setCurrentAct((prev) => {
    //   if (!prev || prev.id !== act.id) return prev;
    //   return { ...prev, ...patch };
    // });

    // notifyActsUpdated();
  };

 const deleteAct = async () => {
    if (!act) return;
    if (!canDelete) return;

    const ok = window.confirm(
      "この名義を削除します。\n関連データ（招待やメンバー情報など）が残る設計の場合、後から参照不能になります。\n本当に削除しますか？"
    );
    if (!ok) return;

    try {
      await deleteActById(act.id);

      // currentAct なら解除
      if (currentAct?.id === act.id) setCurrentAct(null);

      notifyActsUpdated();
      serverRedirectTo("/musician/acts");
    } catch (e: any) {
      // redirect() は内部的に例外を投げるので、ここに来ることがある
      if (typeof e?.digest === "string" && e.digest.startsWith("NEXT_REDIRECT")) {
        alert("削除しました。");
        return; // 何もしない
      }
      console.error("delete act error", e);
      alert(e?.message ?? "削除に失敗しました");
    }
  };

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

          <div className="flex items-center gap-3">
            {canEdit && (
              <Link
                href={`/musician/performances/new?actId=${act.id}&returnTo=/musician/acts/${act.id}`}
                className="text-xs text-emerald-700 font-medium hover:underline"
              >
                ＋ライブを追加
              </Link>
            )}
            <Link href={`/musician/performances?actId=${act.id}`} className="text-xs text-blue-600 hover:underline">
              一覧へ
            </Link>
          </div>
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
              ※ 未決定イベントも表示します
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

        {songList.length === 0 ? (
          <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">曲がまだありません。</div>
        ) : (
          <div className="rounded-lg border bg-white p-2">
            <ul className="divide-y">
              {songList.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/musician/songs/${s.id}`}
                    className="block px-2 py-2 text-sm hover:bg-gray-50"
                    title={s.title}
                  >
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="px-2 pt-2 text-[11px] text-gray-500">※ 表示は最大20件です</div>
          </div>
        )}

        {canEdit && (
          <InlineAddSong
            onAdd={async (title) => {
              const data = await addSong(act.id, title);
              setSongList((prev) => [data, ...prev]);
            }}
          />
        )}
      </section>

      {/* SNSシェア */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-800">共有</h2>

        <div className="rounded-lg border bg-white p-3 space-y-2">
          <div className="text-xs text-gray-600">
            告知文をコピーして共有できます。
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
        <ActPublicPageEditor actId={act.id} actName={act.name} />
      </section>

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

      <ActMembersList
        actId={act.id}
        members={bandMembers}
        isOwner={isOwner}
        canEdit={isEdit && canManageMembers}
        currentUserId={userId}
      />

      {/* 招待（編集モード時のみ） */}
      {canInvite && isEdit && (
          <ActInviteBox actId={act.id} />
      )}
      {/* 編集モードに直リンクしたとき権限なしの場合の注意 */}
      {isEdit && !canEdit ? (
        <div className="rounded-lg border bg-white p-3 text-sm text-gray-600">
          編集権限がありません（閲覧モードで表示しています）。
        </div>
      ) : null}
    </main>
  );
}
