"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentAct } from "@/lib/hooks/useCurrentAct";
import { notifyActsUpdated } from "@/lib/db/actEvents";
import { getCurrentUserClient, useCurrentUser } from "@/lib/auth/session.client";
import { getMyProfile } from "@/lib/api/profiles";
import { ActRow } from "@/lib/api/acts";
import { updateAct } from "./page";

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700">{children}</span>;
}
type Props = {
    myActs: ActRow[],
    myOwnerActs: ActRow[],
    myMemberActs: ActRow[]
}; 

function RoleBadges({
  kind,
  isAdmin,
}: {
  kind: "owner" | "member";
  isAdmin?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {kind === "owner" ? <Badge>owner</Badge> : <Badge>member</Badge>}
      {kind === "member" && isAdmin && (
        <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] text-emerald-800">admin</span>
      )}
    </div>
  );
}

function ActListCard({
  act,
  kind,
  isAdmin,
}: {
  act: ActRow;
  kind: "owner" | "member";
  isAdmin?: boolean;
}) {
  const desc = (act.description ?? "").trim();

  return (
    <Link
      href={`/musician/acts/${act.id}`}
      className="block rounded border bg-white px-3 py-3 text-sm hover:bg-gray-50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-medium truncate">{act.name}</div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-500">
            <RoleBadges kind={kind} isAdmin={isAdmin} />
          </div>

          {desc && (
            <div className="mt-2 text-xs text-gray-600 whitespace-pre-wrap break-words line-clamp-3">
              {desc}
            </div>
          )}
        </div>

        <span className="shrink-0 text-[11px] text-gray-400">詳細</span>
      </div>
    </Link>
  );
}

export default function ActsPage({ myActs, myOwnerActs, myMemberActs }: Props) {
  const router = useRouter();
  const { currentAct, setCurrentAct } = useCurrentAct();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
    const acts = myActs;
  const ownedActs = myOwnerActs;
  const memberActs = myMemberActs;
  const [memberMap, setMemberMap] = useState<Record<string, { is_admin: boolean }>>({});

  // 初回作成フォーム（＝最初の1名義だけ）
  const [soloName, setSoloName] = useState("");
  const [creatingSolo, setCreatingSolo] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const mm: Record<string, { is_admin: boolean }> = acts.reduce((acc, act) => {
        return acc;
      }, {} as Record<string, { is_admin: boolean }>);

      setMemberMap(mm);

      // 初回フォームのデフォルト値
      if (ownedActs.length === 0 && soloName.trim() === "") {
        const prof = await getMyProfile();
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
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      const inserted = await updateAct({
        id: userId,
        name,
        act_type: "solo",
        owner_profile_id: uid,
        description: "",
        is_temporary: false,
        photo_url: null,
        profile_link_url: null,
        icon_url: null,
      }); 

      setCurrentAct(inserted as ActRow);
      notifyActsUpdated();

      await load();
      router.refresh();

      // すぐ詳細へ（＝編集・招待は詳細に集約）
      router.push(`/musician/acts/${inserted.id}`);
    } catch (e: any) {
      console.error("create solo act error", e);
      setCreateError(e?.message ?? "作成に失敗しました");
    } finally {
      setCreatingSolo(false);
    }
  };

  if (loading) return <main className="p-4 text-sm text-gray-500">読み込み中…</main>;

  const totalActs = ownedActs.length + memberActs.length;

  return (
    <main className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-bold">出演名義（アクト）</h1>
        <p className="text-xs text-gray-600">
          一覧では「見る・探す」に集中し、編集や招待は各名義の詳細ページで行います。
        </p>
      </header>

      {/* あなたの名義（owner） */}
      <section className="space-y-2">
        <div className="flex items-baseline justify-between">
                   <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-gray-800">あなたの名義</h2>
          <Link
            href="/musician/acts/new"
            className="text-xs text-blue-600 hover:underline flex items-center gap-3"
          >
            + 名義を追加
          </Link>
          </div>  
          <span className="text-[11px] text-gray-500">{ownedActs.length}件</span>
        </div>

        {ownedActs.length === 0 ? (
          <div className="rounded border bg-white p-4 space-y-3">
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
          <div className="space-y-2">
            {ownedActs.map((act) => (
              <ActListCard key={act.id} act={act} kind="owner" />
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
          <div className="rounded border bg-white p-4 text-sm text-gray-600">
            まだ招待で参加した名義がありません。招待リンクを受け取ったらここに増えていきます。
          </div>
        ) : (
          <div className="space-y-2">
            {memberActs.map((act) => {
              const isAdmin = memberMap[act.id]?.is_admin === true;
              return <ActListCard key={act.id} act={act} kind="member" isAdmin={isAdmin} />;
            })}
          </div>
        )}
      </section>

      {!currentAct && totalActs > 0 && (
        <div className="rounded border bg-white p-3 text-sm text-gray-600">
          どの名義で操作するかは、画面上部の「名義」から切り替えできます。
        </div>
      )}
    </main>
  );
}
