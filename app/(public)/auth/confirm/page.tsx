"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Status = "loading" | "success" | "error";

function parseHashParams() {
  if (typeof window === "undefined") return new URLSearchParams();
  const hash = window.location.hash?.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash ?? "";
  return new URLSearchParams(hash);
}

export default function AuthConfirmPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState<string>("確認中…");
  const [debug, setDebug] = useState<string | null>(null);

  const nextPath = useMemo(() => {
    const next = sp.get("next");
    // soundwalk ではまずダッシュボードでOK（必要ならここを変更）
    return next && next.startsWith("/") ? next : "/musician";
  }, [sp]);

  useEffect(() => {
    const boot = async () => {
      setStatus("loading");
      setMessage("確認中…");

      try {
        // 1) token_hash + type（Supabase公式で推奨される確認メールフロー）:contentReference[oaicite:1]{index=1}
        const token_hash = sp.get("token_hash");
        const type = sp.get("type"); // "email" 等

        if (token_hash && type) {
          const { error } = await supabase.auth.verifyOtp({
            // supabase-js の型は厳しいので実運用では any で受ける（email / signup 等に対応）
            type: type as any,
            token_hash,
          });

          if (error) throw error;

          // URLから機密値を消す（token_hash を残さない）
          window.history.replaceState({}, document.title, "/auth/confirm");

          setStatus("success");
          setMessage("メールアドレスの確認が完了しました。ダッシュボードへ移動します。");

          // verifyOtp がセッションを作れる場合はこのまま遷移できる
          router.replace(nextPath);
          return;
        }

        // 2) code（PKCE/OAuth等で使われる）
        const code = sp.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;

          window.history.replaceState({}, document.title, "/auth/confirm");

          setStatus("success");
          setMessage("確認が完了しました。ダッシュボードへ移動します。");
          router.replace(nextPath);
          return;
        }

        // 3) hash fragment に access_token が来るケース（古い/別フロー対策）
        const hp = parseHashParams();
        const access_token = hp.get("access_token");
        const refresh_token = hp.get("refresh_token");

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (error) throw error;

          // hash を消す
          window.history.replaceState({}, document.title, "/auth/confirm");

          setStatus("success");
          setMessage("確認が完了しました。ダッシュボードへ移動します。");
          router.replace(nextPath);
          return;
        }

        // ここまで来たら必要な情報がない
        setStatus("error");
        setMessage("確認リンクの情報が不足しています。もう一度メールのリンクを開いてください。");
        setDebug(`missing params: token_hash/type/code/access_token`);
      } catch (e: any) {
        setStatus("error");
        setMessage(
          "確認に失敗しました。リンクの期限切れの可能性があります。もう一度サインアップ/再送をお試しください。"
        );
        setDebug(e?.message ?? String(e));
      }
    };

    void boot();
  }, [router, sp, nextPath]);

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-3">
      <h1 className="text-lg font-bold">メール確認</h1>

      <p className="text-sm text-gray-700">{message}</p>

      {status === "error" && (
        <div className="flex flex-wrap gap-2 pt-1">
          <Link
            href="/login"
            className="inline-flex rounded bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            ログインへ
          </Link>
          <Link
            href="/signup"
            className="inline-flex rounded border px-3 py-2 text-sm font-medium hover:bg-gray-50"
          >
            サインアップへ
          </Link>
        </div>
      )}

      {debug && (
        <details className="text-xs text-gray-500">
          <summary className="cursor-pointer">詳細</summary>
          <pre className="mt-2 whitespace-pre-wrap break-words">{debug}</pre>
        </details>
      )}
    </div>
  );
}
