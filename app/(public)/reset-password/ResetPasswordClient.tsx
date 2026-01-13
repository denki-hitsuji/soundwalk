"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function ResetPasswordClient() {
  const searchParams = useSearchParams();

  const next = useMemo(() => {
    const raw = searchParams.get("next");
    if (raw && raw.startsWith("/")) return raw;
    return "/musician";
  }, [searchParams]);

  const presetEmail = useMemo(() => searchParams.get("email") ?? "", [searchParams]);

  const [email, setEmail] = useState(presetEmail);
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loginHref = useMemo(() => {
    const qs = new URLSearchParams();
    if (email) qs.set("email", email);
    qs.set("next", next);
    return `/login?${qs.toString()}`;
  }, [email, next]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // パスワード再設定メール送信
      // リンク踏んだ後に /update-password に誘導する（クライアントでPW更新画面）
      const redirectTo = `${location.origin}/update-password?next=${encodeURIComponent(next)}`;

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });
      if (error) throw error;

      setSentTo(email.trim());
    } catch (e: any) {
      setError(e?.message ?? "送信に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  if (sentTo) {
    return (
      <main className="space-y-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h1 className="text-xl font-bold leading-tight">メールを送信しました</h1>
          <p className="mt-2 text-sm text-gray-600">
            <strong>{sentTo}</strong> にパスワード再設定の案内を送りました。メール内リンクからお進みください。
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold leading-tight">届かない場合</h2>
          <ul className="mt-2 text-sm text-gray-600 list-disc list-inside space-y-1">
            <li>数分待ってください。</li>
            <li>迷惑メールフォルダも確認してください。</li>
          </ul>
          <p className="mt-3 text-sm">
            <Link className="underline" href={loginHref}>
              ログイン画面へ戻る
            </Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-4">
      <h1 className="text-xl font-bold">パスワード再設定</h1>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <form onSubmit={submit} className="space-y-3">
        <label className="block text-sm">
          メールアドレス
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? "送信中…" : "再設定メールを送る"}
        </button>

        <p className="text-sm">
          <Link className="underline" href={loginHref}>
            ログインへ戻る
          </Link>
        </p>
      </form>
    </main>
  );
}
