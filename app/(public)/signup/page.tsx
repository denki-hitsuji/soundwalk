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
  function validate(email: string, password: string) {
    if (!email.includes("@")) return "メールアドレスの形式が正しくありません。";
    if (password.length < 6) return "パスワードは6文字以上にしてください。";
    return null;
  }

  function humanizeAuthError(e: any): string {
    const msg = String(e?.message ?? "");

    // よくあるパターンを日本語化
    if (/password/i.test(msg) && /(short|length|least|min)/i.test(msg)) {
      return "パスワードが短すぎます。6文字以上にしてください。";
    }
    if (/invalid.*email/i.test(msg) || /email.*invalid/i.test(msg)) {
      return "メールアドレスの形式が正しくありません。";
    }
    if (/already registered|already.*exists|User already registered/i.test(msg)) {
      return "このメールアドレスは既に登録されています。ログインをお試しください。";
    }
    if (/redirect/i.test(msg)) {
      return "認証URLの設定に問題があります。しばらくしてから再度お試しください。";
    }

    // それ以外はそのまま（ただし露骨に英語なら一般文に落とすのもアリ）
    return msg || "サインアップに失敗しました。入力内容をご確認ください。";
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    // 1) 先にフロントで検証
    const v = validate(email, password);
    if (v) {
      setErr(v);
      return;
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
      const redirectTo = `${baseUrl}/auth/confirm`;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectTo },
      });

      if (error) throw error;

      router.replace(`/signup/check-email?email=${encodeURIComponent(email)}`);
    } catch (e: any) {
      setErr(humanizeAuthError(e));
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
