"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type InvitePublic = {
  act_id: string;
  act_name: string;
  expires_at: string | null;
  is_revoked: boolean;
  used_count: number;
  max_uses: number;
};

// --- LINE内ブラウザ検知（軽量・依存なし） ---
function isLineInAppBrowser(ua: string) {
  return /Line\/|LINE\//i.test(ua);
}
function isIOS(ua: string) {
  return /iPhone|iPad|iPod/i.test(ua);
}
function isAndroid(ua: string) {
  return /Android/i.test(ua);
}

function LineBrowserGate({ canonicalUrl }: { canonicalUrl: string }) {
  const [ua, setUa] = useState("");
  useEffect(() => setUa(navigator.userAgent ?? ""), []);

  const inLine = isLineInAppBrowser(ua);
  if (!inLine) return null;

  const ios = isIOS(ua);
  const android = isAndroid(ua);

  const openExternal = () => {
    // AndroidはChrome intentが効く端末が多い（効かなければ通常openにフォールバック）
    if (android) {
      try {
        const u = new URL(canonicalUrl);
        const intentUrl =
          `intent://${u.host}${u.pathname}${u.search}${u.hash}` +
          `#Intent;scheme=${u.protocol.replace(":", "")};package=com.android.chrome;end`;
        window.location.href = intentUrl;
        return;
      } catch {
        // ignore
      }
    }
    window.open(canonicalUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-2">
      <div className="text-sm font-semibold">LINEからアクセスしています</div>
      <div className="text-xs text-gray-600 leading-relaxed">
        LINE内ブラウザだとログイン状態が維持されず、毎回やり直しになることがあります。
        <br />
        ブラウザで開くとスムーズです。
        {ios && (
          <>
            <br />
            <span className="text-gray-500">
              iPhone: 右上メニュー →「ブラウザで開く」
            </span>
          </>
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={openExternal}
          className="rounded bg-gray-900 px-3 py-2 text-xs font-medium text-white hover:bg-gray-800"
        >
          Safari / Chromeで開く
        </button>
        <a
          href={canonicalUrl}
          className="rounded border px-3 py-2 text-xs font-medium hover:bg-gray-50"
        >
          このまま続ける
        </a>
      </div>
    </div>
  );
}

export default function InviteClient({ token }: { token: string }) {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);

  // 招待プレビューは「未ログインでも」表示したい
  const [inv, setInv] = useState<InvitePublic | null>(null);

  const [err, setErr] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [loading, setLoading] = useState(true);

  const nextPath = useMemo(() => `/invites/${token}`, [token]);
  const canonicalUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    // LINE誘導用に「いま見てる招待URL」をそのまま使う
    return window.location.href;
  }, []);

  // 1) 招待は先に読む（未ログインでもOKにする）
  // 2) その後に auth を確認して、参加ボタン or ログイン導線を出す
  useEffect(() => {
    if (!token) return;

    const boot = async () => {
      setLoading(true);
      setErr(null);

      try {
        // --- 招待情報取得（先） ---
        // ※このRPCが未ログインでも実行できる必要があります
        //   もし今はできていないなら、RPCをSECURITY DEFINERにするのが筋（後述）
        const { data, error } = await supabase.rpc("get_act_invite_public", {
          p_token: token,
        });
        if (error) throw error;
        setInv((data?.[0] ?? null) as InvitePublic | null);
      } catch (e: any) {
        setErr(e?.message ?? "招待リンクが無効です");
        setInv(null);
      }

      // --- auth確認（後） ---
      try {
        const { data: auth } = await supabase.auth.getUser();
        const user = auth.user ?? null;
        setUserId(user?.id ?? null);
      } catch {
        setUserId(null);
      } finally {
        setLoading(false);
      }
    };

    void boot();
  }, [token]);

  const accept = useCallback(async () => {
    if (!inv) return;
    if (inv.is_revoked) return;
    if (inv.used_count >= inv.max_uses) return;
    if (!userId) return;

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
  }, [inv, token, userId, router]);

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
    <div className="space-y-3">
      {/* LINE内ブラウザ誘導（未ログインでこそ意味がある） */}
      {canonicalUrl && <LineBrowserGate canonicalUrl={canonicalUrl} />}

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
            {inv.is_revoked && (
              <div className="text-xs text-red-600 mt-1">この招待は無効化されています。</div>
            )}
            {exhausted && (
              <div className="text-xs text-red-600 mt-1">この招待は使用回数の上限に達しました。</div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-600">招待が見つかりません。</p>
        )}

        {/* 未ログインでも招待の“文脈”は見せる。操作だけをゲートする */}
        {!userId ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              参加するにはログインが必要です（ログイン後、この招待に戻って続けられます）。
            </p>
            <div className="flex gap-2">
              <Link
                href={`/login?next=${encodeURIComponent(nextPath)}`}
                className="flex-1 rounded bg-gray-900 px-3 py-2 text-center text-sm font-medium text-white hover:bg-gray-800"
              >
                ログインして参加
              </Link>
              <Link
                href={`/signup?next=${encodeURIComponent(nextPath)}`}
                className="flex-1 rounded border px-3 py-2 text-center text-sm font-medium hover:bg-gray-50"
              >
                新しく登録して参加
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
    </div>
  );
}
