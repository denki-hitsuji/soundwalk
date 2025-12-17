"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      router.replace("/musician");
    } catch (e: any) {
      setErr(e?.message ?? "サインアップに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <h1 className="text-lg font-bold">サインアップ</h1>
      <p className="mt-1 text-sm text-gray-600">
        まずは1件、次のライブを登録するところから。
      </p>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          placeholder="パスワード"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {err && <div className="text-sm text-red-600">{err}</div>}

        <button
          disabled={loading}
          className="w-full rounded bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          アカウント作成
        </button>
      </form>

      <div className="mt-4 text-sm text-gray-600">
        すでにアカウントがある？{" "}
        <Link href="/login" className="text-gray-900 underline">
          ログイン
        </Link>
      </div>
    </div>
  );
}
