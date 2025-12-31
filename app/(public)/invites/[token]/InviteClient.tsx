"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

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

  const nextPath = useMemo(() => `/invites/${token}`, [token]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!token) return;

    const run = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) {
        // ★ 招待URLを next に入れてログイン/登録へ
        const next = `/invites/${token}`;
        router.replace(`/signup?next=${encodeURIComponent(next)}`);
        return;
      }

      setReady(true);
      // ここで招待内容をロードして表示…
    };

    void run();
  }, [token, router]);

  if (!ready) return <main className="text-sm text-gray-500">読み込み中…</main>;
  useEffect(() => {
    const boot = async () => {
      // 招待情報（未ログインでも取得できるRPC）
      try {
        const { data, error } = await supabase.rpc("get_act_invite_public", { p_token: token });
        if (error) throw error;
        setInv((data?.[0] ?? null) as InvitePublic | null);
      } catch (e: any) {
        setErr(e?.message ?? "招待リンクが無効です");
      }

      const { data: u } = await supabase.auth.getUser();
      setUserId(u.user?.id ?? null);
    };

    void boot();
  }, [token]);

  const accept = async () => {
    setJoining(true);
    setErr(null);
    try {
      const { data, error } = await supabase.rpc("accept_act_invite", { p_token: token });
      console.log("accept_act_invite result", { data, error });
      if (error) throw error;

      // 参加後はダッシュボードへ（必要なら act ページへ）
      router.replace("/musician");
    } catch (e: any) {
      setErr(e?.message ?? "参加に失敗しました");
    } finally {
      setJoining(false);
    }
  };

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
        <p className="text-sm text-gray-600">招待を読み込み中…</p>
      )}

      {!userId ? (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            参加するにはログインが必要です。
          </p>
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
