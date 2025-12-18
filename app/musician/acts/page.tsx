"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ActInviteBox } from "@/components/acts/ActInviteBox";

type ActRow = {
  id: string;
  name: string;
  act_type: string | null;
  owner_profile_id: string;
};

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

function ActCard({
  act,
  badge,
  canInvite,
  canDelete,
  onDelete,
}: {
  act: ActRow;
  badge: React.ReactNode;
  canInvite: boolean;
  canDelete: boolean;
  onDelete?: () => void;
}) {
  return (
    <div className="rounded border bg-white px-3 py-2 text-sm space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium truncate">{act.name}</div>
          <div className="text-[11px] text-gray-500 flex items-center gap-2">
            {badge}
          </div>
        </div>

        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="shrink-0 text-[11px] text-red-600 hover:underline"
          >
            削除
          </button>
        )}
      </div>

      {canInvite && <ActInviteBox actId={act.id} />}
    </div>
  );
}

export default function ActsPage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [ownedActs, setOwnedActs] = useState<ActRow[]>([]);
  const [memberActs, setMemberActs] = useState<ActRow[]>([]);
  const [memberMap, setMemberMap] = useState<Record<string, { is_admin: boolean }>>({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id ?? null;
      setUserId(uid);

      if (!uid) {
        setOwnedActs([]);
        setMemberActs([]);
        setMemberMap({});
        setLoading(false);
        return;
      }

      // owner：自分が作った名義
      const { data: owned, error: ownedErr } = await supabase
        .from("acts")
        .select("id, name, act_type, owner_profile_id")
        .eq("owner_profile_id", uid)
        .order("created_at", { ascending: false });

      if (ownedErr) console.error("load owned acts error", ownedErr);

      // member：参加中の名義（act_members -> acts）
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

      // 念のため：owner と member が同じ act を二重に表示しない（owner優先）
      const ownedSet = new Set((owned ?? []).map((a: any) => a.id as string));
      const filteredMember = mActs.filter((a) => !ownedSet.has(a.id));

      setOwnedActs((owned ?? []) as unknown as ActRow[]);
      setMemberActs(filteredMember);
      setMemberMap(mm);

      setLoading(false);
    };

    void load();
  }, []);

  if (loading) return <main className="p-4 text-sm text-gray-500">読み込み中…</main>;

  return (
    <main className="p-4 space-y-6">
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
        </div>

        {ownedActs.length === 0 ? (
          <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">
            まだ作成した名義がありません。まずはソロ名義を作るのがおすすめです。
          </div>
        ) : (
          <div className="space-y-2 max-w-md">
            {ownedActs.map((act) => (
              <ActCard
                key={act.id}
                act={act}
                badge={<span className="rounded bg-gray-100 px-2 py-0.5">owner</span>}
                canInvite={true}
                canDelete={true}
                onDelete={() => {
                  // 既存のhandleDeleteに差し替えてOK
                  // handleDelete(act.id)
                }}
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
                  badge={
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-gray-100 px-2 py-0.5">member</span>
                      {isAdmin && (
                        <span className="rounded bg-emerald-100 px-2 py-0.5 text-emerald-800">
                          admin
                        </span>
                      )}
                    </div>
                  }
                  canInvite={isAdmin}
                  canDelete={false}
                />
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
