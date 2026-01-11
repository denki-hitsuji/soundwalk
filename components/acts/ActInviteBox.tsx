"use client";

import { useCallback, useMemo, useState } from "react";
import { useCurrentUser } from "@/lib/auth/session.client";
import { createActInvite } from "@/lib/api/actsAction";

export function ActInviteBox({ actId }: { actId: string }) {
  const [loading, setLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  // ✅ Hookはコンポーネント直下で呼ぶ
  const { user, loading: userLoading } = useCurrentUser();

  const baseUrl = useMemo(
    () =>
      process.env.NEXT_PUBLIC_SITE_URL ??
      (typeof window !== "undefined" ? window.location.origin : ""),
    []
  );

  const createInvite = useCallback(async () => {
    // userの取得途中なら待たせる or 何もしない
    if (userLoading) return;

    // 取得エラー or 未ログイン
    if (!user) {
      alert("ログインが必要です。");
      return;
    }

    setLoading(true);
    try {
      const args = {
        p_act_id: actId,
        p_grant_admin: false,
        p_expires_in_days: 7,
        p_max_uses: 1,
      };

      const data = await createActInvite(args);

      const token = data?.[0]?.token as string | undefined;
      const exp = (data?.[0]?.expires_at as string | null | undefined) ?? null;
      if (!token) throw new Error("招待トークンの生成に失敗しました");

      setInviteUrl(`${baseUrl}/invites/${token}`);
      setExpiresAt(exp);
    } catch (e: any) {
      console.error("create_act_invite error detail:", e);
      alert(e?.message ?? "招待リンクの作成に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [actId, baseUrl, user, userLoading]);

  const copy = useCallback(async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    alert("招待リンクをコピーしました");
  }, [inviteUrl]);

  const disabled = loading || userLoading;

  return (
    <div className="bg-white p-2 space-y-3">
      <div>
        <div className="text-sm font-semibold">メンバー招待</div>
        <div className="text-xs text-gray-600 mt-1">
          リンクを知っている人だけが参加できます（1回使用 / 7日で期限切れ）。
        </div>
      </div>

      <button
        type="button"
        onClick={createInvite}
        disabled={disabled}
        className="inline-flex items-center rounded bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        招待リンクを作る
      </button>

      {inviteUrl && (
        <div className="rounded border bg-gray-50 p-3 space-y-2">
          <div className="text-xs text-gray-600">招待リンク</div>
          <div className="text-sm break-all">{inviteUrl}</div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={copy} className="rounded border px-3 py-1.5 text-xs hover:bg-white">
              コピー
            </button>
            {expiresAt && (
              <span className="text-[11px] text-gray-500">
                期限: {new Date(expiresAt).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
