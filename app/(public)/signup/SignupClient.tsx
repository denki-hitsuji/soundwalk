"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client.legacy";;

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
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h1 className="text-xl font-bold leading-tight">
          メールが送信されました
        </h1>
        <p className="mt-2 text-sm text-gray-600">
            メールボックスをご確認の上、「メールを確認する」リンクからお進み下さい。
        </p>
      </div>
     <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold leading-tight">
          注意事項
        </h2>
        <ul className="mt-2 text-sm text-gray-600 list-disc list-inside space-y-1">
          <li>メールが届くまでに、たいてい数分かかります。</li>
          <li>10分経ってもメールが届かない場合は、迷惑メールフォルダもご確認ください。</li>
        </ul>
        <p className="mt-2 text-sm text-gray-600 font-semibold">
          このページは閉じて構いません。
        </p>
     </div>
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
