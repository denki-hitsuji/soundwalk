"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function SignupClient() {
  const searchParams = useSearchParams();
  const next = useMemo(() => {
    const raw = searchParams.get("next");
    // open redirect対策：内部パスだけ許可
    if (raw && raw.startsWith("/")) return raw;
    return "/musician";
  }, [searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // ★ ここが肝：確認メールを踏んだら next に戻る
          emailRedirectTo: `${location.origin}${next}`,
        },
      });
      if (error) throw error;

      // ★ ここで「移動」しない（メール確認あり運用だから）
      setSentTo(email);
    } catch (e: any) {
      setError(e?.message ?? "登録に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  if (sentTo) {
    return (
      <main className="space-y-3">
        <h1 className="text-xl font-bold">確認メールを送信しました</h1>
        <p className="text-sm text-gray-700">
          <span className="font-semibold">{sentTo}</span> に確認メールを送りました。
          メール内のリンクを開くと、登録が完了し、このまま招待ページに戻ります。
        </p>
        <p className="text-xs text-gray-500">
          数分待っても届かない場合は迷惑メールも確認してください。
        </p>
      </main>
    );
  }

  return (
    <main className="space-y-4">
      <h1 className="text-xl font-bold">サインアップ</h1>

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

        <label className="block text-sm">
          パスワード
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? "送信中…" : "確認メールを送る"}
        </button>
      </form>
    </main>
  );
}
