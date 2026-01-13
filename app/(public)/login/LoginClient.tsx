"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const next = useMemo(() => {
    const raw = searchParams.get("next");
    if (raw && raw.startsWith("/")) return raw; // open redirect対策
    return "/musician";
  }, [searchParams]);

  const presetEmail = useMemo(() => searchParams.get("email") ?? "", [searchParams]);
  const reason = useMemo(() => searchParams.get("reason") ?? "", [searchParams]);

  const [email, setEmail] = useState(presetEmail);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const forgotHref = useMemo(() => {
    const qs = new URLSearchParams();
    if (email) qs.set("email", email);
    if (next) qs.set("next", next);
    return `/reset-password?${qs.toString()}`;
  }, [email, next]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;

      router.push(next);
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "ログインに失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="space-y-4">
      <h1 className="text-xl font-bold">ログイン</h1>

      {reason === "existing" && (
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-700">
            このメールアドレスは<strong>登録済み</strong>です。ログインしてください。
          </p>
          <p className="mt-2 text-sm text-gray-700">
            パスワードを忘れた場合は{" "}
            <Link className="underline" href={forgotHref}>
              パスワードを再設定
            </Link>
            へ進んでください。
          </p>
        </div>
      )}

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
            autoComplete="current-password"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? "ログイン中…" : "ログイン"}
        </button>

        <div className="flex justify-between text-sm">
          <Link className="underline" href={forgotHref}>
            パスワードを忘れましたか？
          </Link>
          <Link className="underline" href={`/signup?next=${encodeURIComponent(next)}`}>
            新規登録へ
          </Link>
        </div>
      </form>
    </main>
  );
}
