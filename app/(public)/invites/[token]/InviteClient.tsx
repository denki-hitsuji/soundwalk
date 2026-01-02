"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client.legacy";;

type InvitePublic = {
  act_id: string;
  act_name: string;
  expires_at: string | null;
  is_revoked: boolean;
  used_count: number;
  max_uses: number;
};

export default function InviteClient({ token }: { token: string }) {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [inv, setInv] = useState<InvitePublic | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [loading, setLoading] = useState(true);

  const nextPath = useMemo(() => `/invites/${token}`, [token]);

  useEffect(() => {
    if (!token) return;

    const boot = async () => {
      setLoading(true);
      setErr(null);

      // 1) auth 確認
      const { data: auth, error: authErr } = await supabase.auth.getUser();
      if (authErr) {
        // authErr は基本握りつぶしてもOK（セッション無し等）
        console.warn("getUser error", authErr);
      }

      const user = auth.user;
      if (!user) {
        // 未ログインなら signup に next 付きで誘導
        router.replace(`/signup?next=${encodeURIComponent(nextPath)}`);
        return;
      }

      setUserId(user.id);

      // 2) 招待情報取得（ログイン後に読む）
      try {
        const { data, error } = await supabase.rpc("get_act_invite_public", { p_token: token });
        if (error) throw error;
        setInv((data?.[0] ?? null) as InvitePublic | null);
      } catch (e: any) {
        setErr(e?.message ?? "招待リンクが無効です");
        setInv(null);
      } finally {
        setLoading(false);
      }
    };

    void boot();
  }, [token, nextPath, router]);

  const accept = async () => {
    if (!inv) return;
    if (inv.is_revoked) return;
    if (inv.used_count >= inv.max_uses) return;

    setJoining(true);
    setErr(null);

    try {
      const { error } = await supabase.rpc("accept_act_invite", { p_token: token });
      if (error) throw error;

      router.replace("/musician");
      router.refresh();
    } catch (e: any) {
      setErr(e?.message ?? "参加に失敗しました");
    } finally {
      setJoining(false);
    }
  };

  if (loading) return <main className="text-sm text-gray-500">読み込み中…</main>;

  if (err) {
    return (
      <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-3">
        <h1 className="text-lg font-bold">招待</h1>
        <p className="text-sm text-red-600">{err}</p>
        <Link className="text-sm underline" href="/">
          トップへ戻る
        </Link>
      </div>
    );
  }

  const exhausted = inv ? inv.used_count >= inv.max_uses : false;

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-3">
      <h1 className="text-lg font-bold">バンド招待</h1>

      {inv ? (
        <div className="text-sm text-gray-700">
          <div>
            <span className="text-gray-500">参加先：</span>
            <span className="font-semibold">{inv.act_name}</span>
          </div>
          {inv.expires_at && (
            <div className="text-xs text-gray-500 mt-1">
              期限：{new Date(inv.expires_at).toLocaleString()}
            </div>
          )}
          {inv.is_revoked && <div className="text-xs text-red-600 mt-1">この招待は無効化されています。</div>}
          {exhausted && <div className="text-xs text-red-600 mt-1">この招待は使用回数の上限に達しました。</div>}
        </div>
      ) : (
        <p className="text-sm text-gray-600">招待が見つかりません。</p>
      )}

      {!userId ? (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">参加するにはログインが必要です。</p>
          <div className="flex gap-2">
            <Link
              href={`/login?next=${encodeURIComponent(nextPath)}`}
              className="flex-1 rounded bg-gray-900 px-3 py-2 text-center text-sm font-medium text-white hover:bg-gray-800"
            >
              ログイン
            </Link>
            <Link
              href={`/signup?next=${encodeURIComponent(nextPath)}`}
              className="flex-1 rounded border px-3 py-2 text-center text-sm font-medium hover:bg-gray-50"
            >
              サインアップ
            </Link>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={accept}
          disabled={!inv || inv.is_revoked || exhausted || joining}
          className="w-full rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {joining ? "参加処理中…" : "このバンドに参加する"}
        </button>
      )}
    </div>
  );
}
