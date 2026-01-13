"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function UpdatePasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const next = useMemo(() => {
    const raw = searchParams.get("next");
    if (raw && raw.startsWith("/")) return raw;
    return "/musician";
  }, [searchParams]);

  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // recoveryリンクから来ているか（セッションがあるか）確認
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setHasSession(!!data.session);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (password.length < 8) {
        setError("パスワードは8文字以上にしてください");
        return;
      }
      if (password !== password2) {
        setError("パスワードが一致しません");
        return;
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setDone(true);

      // すぐ遷移させたいならここで push してもOK
      // router.push(next);
    } catch (e: any) {
      setError(e?.message ?? "更新に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  const loginHref = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set("next", next);
    return `/login?${qs.toString()}`;
  }, [next]);

  if (hasSession === false) {
    return (
      <main className="space-y-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h1 className="text-xl font-bold leading-tight">リンクが無効か期限切れです</h1>
          <p className="mt-2 text-sm text-gray-600">
            再設定メールのリンクをもう一度開くか、再度メールを送信してください。
          </p>
        </div>

        <div className="text-sm">
          <Link className="underline" href={`/reset-password?next=${encodeURIComponent(next)}`}>
            再設定メールを送り直す
          </Link>
          <span className="mx-2">/</span>
          <Link className="underline" href={loginHref}>
            ログインへ
          </Link>
        </div>
      </main>
    );
  }

  if (done) {
    return (
      <main className="space-y-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h1 className="text-xl font-bold leading-tight">パスワードを更新しました</h1>
          <p className="mt-2 text-sm text-gray-600">
            これでログインできます。
          </p>
        </div>
        <p className="text-sm">
          <Link className="underline" href={loginHref}>
            ログインへ進む
          </Link>
          <span className="mx-2">/</span>
          <Link className="underline" href={next}>
            {next} へ戻る
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="space-y-4">
      <h1 className="text-xl font-bold">新しいパスワードを設定</h1>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <form onSubmit={submit} className="space-y-3">
        <label className="block text-sm">
          新しいパスワード
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </label>

        <label className="block text-sm">
          新しいパスワード（確認）
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            type="password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            required
            autoComplete="new-password"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? "更新中…" : "更新する"}
        </button>
      </form>

      <p className="text-sm">
        <Link className="underline" href={loginHref}>
          ログインへ戻る
        </Link>
      </p>
    </main>
  );
}
