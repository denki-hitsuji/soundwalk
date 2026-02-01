"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateActMemberAdminAction,
  removeActMemberAction,
} from "@/lib/api/actsAction";

type Member = {
  profile_id: string;
  display_name: string | null;
  role: string;
  is_owner: boolean;
  is_admin: boolean;
};

type Props = {
  actId: string;
  members: Member[];
  isOwner: boolean;
  canEdit: boolean;
  currentUserId?: string;
};

export function ActMembersList({
  actId,
  members,
  isOwner,
  canEdit,
  currentUserId,
}: Props) {
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  if (!members || members.length === 0) {
    return <div className="text-xs text-gray-500">メンバーがまだいません</div>;
  }

  const handleToggleAdmin = async (m: Member) => {
    if (!canEdit) return;
    setUpdatingId(m.profile_id);
    try {
      await updateActMemberAdminAction({
        actId,
        profileId: m.profile_id,
        isAdmin: !m.is_admin,
      });
      router.refresh();
    } catch (e: any) {
      alert(e?.message ?? "権限の更新に失敗しました");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (m: Member) => {
    if (!canEdit) return;
    const name = (m.display_name ?? "").trim() || "このメンバー";
    const ok = window.confirm(`${name} をメンバーから外しますか？`);
    if (!ok) return;

    setRemovingId(m.profile_id);
    try {
      await removeActMemberAction({
        actId,
        profileId: m.profile_id,
      });
      router.refresh();
    } catch (e: any) {
      alert(e?.message ?? "メンバーの削除に失敗しました");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm space-y-2">
      <div className="text-sm font-semibold">メンバー</div>

      <ul className="divide-y">
        {members.map((m) => {
          const name = (m.display_name ?? "").trim() || "（名前未設定）";
          const isSelf = currentUserId === m.profile_id;
          const canOperate = canEdit && !m.is_owner && !isSelf;

          return (
            <li
              key={m.profile_id}
              className="py-2 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{name}</div>
                <div className="text-[11px] text-gray-500">
                  {m.is_owner ? "owner" : m.role || "member"}
                  {m.is_admin && !m.is_owner ? " / admin" : ""}
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                {/* バッジ */}
                {m.is_owner && (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                    OWNER
                  </span>
                )}
                {!m.is_owner && m.is_admin && (
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                    ADMIN
                  </span>
                )}

                {/* 操作ボタン（編集モード && Owner のみ） */}
                {canOperate && (
                  <>
                    <button
                      type="button"
                      onClick={() => void handleToggleAdmin(m)}
                      disabled={updatingId === m.profile_id}
                      className="text-[11px] text-blue-600 hover:underline disabled:opacity-50"
                    >
                      {updatingId === m.profile_id
                        ? "..."
                        : m.is_admin
                        ? "Admin解除"
                        : "Admin付与"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleRemove(m)}
                      disabled={removingId === m.profile_id}
                      className="text-[11px] text-red-600 hover:underline disabled:opacity-50"
                    >
                      {removingId === m.profile_id ? "..." : "外す"}
                    </button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
