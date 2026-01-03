"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";;

type Status = "loading" | "success" | "error";

function parseHashParams() {
  if (typeof window === "undefined") return new URLSearchParams();
  const hash = window.location.hash?.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash ?? "";
  return new URLSearchParams(hash);
}

export default function AuthConfirmClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState<string>("確認中…");
  const [debug, setDebug] = useState<string | null>(null);

  const nextPath = useMemo(() => {
    const next = sp.get("next");
    return next && next.startsWith("/") ? next : "/musician";
  }, [sp]);

  useEffect(() => {
    const boot = async () => {
      setStatus("loading");
      setMessage("確認中…");
      setDebug(null);

      try {
        // 1) token_hash + type
        const token_hash = sp.get("token_hash");
        const type = sp.get("type");

        if (token_hash && type) {
          const { error } = await supabase.auth.verifyOtp({
            type: type as any,
            token_hash,
          });
          if (error) throw error;

          // URLから機密を消す
          window.history.replaceState({}, document.title, "/auth/confirm");

          setStatus("success");
          setMessage("メールアドレスの確認が完了しました。ダッシュボードへ移動します。");
          router.replace(nextPath);
          return;
        }

        // 2) code
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

        // 3) hash fragment access_token
        const hp = parseHashParams();
        const access_token = hp.get("access_token");
        const refresh_token = hp.get("refresh_token");

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (error) throw error;

          window.history.replaceState({}, document.title, "/auth/confirm");

          setStatus("success");
          setMessage("確認が完了しました。ダッシュボードへ移動します。");
          router.replace(nextPath);
          return;
        }

        setStatus("error");
        setMessage("確認リンクの情報が不足しています。もう一度メールのリンクを開いてください。");
        setDebug("missing params: token_hash/type/code/access_token");
      } catch (e: any) {
        setStatus("error");
        setMessage("確認に失敗しました。リンクの期限切れの可能性があります。再送をお試しください。");
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
