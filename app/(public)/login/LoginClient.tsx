"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signInWithGoogle } from "@/lib/auth/oauth.client";
import { sanitizeNextPath } from "@/lib/auth/redirect";

export default function LoginClient() {
  const searchParams = useSearchParams();
  const next = useMemo(
    () => sanitizeNextPath(searchParams.get("next")),
    [searchParams]
  );
  const oauthFailed = searchParams.get("error") === "oauth";
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const { error } = await signInWithGoogle(next);
      if (error) throw error;
    } catch (e: any) {
      setError(e?.message ?? "ログインに失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="space-y-4">
      <h1 className="text-xl font-bold">ログイン・新規登録</h1>
      <p className="text-sm text-gray-600">GoogleアカウントでSoundWalkを始められます。</p>
      {(oauthFailed || error) && (
        <p className="text-sm text-red-600">
          {error ?? "Googleログインに失敗しました。もう一度お試しください"}
        </p>
      )}
      <div className="space-y-3">
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="w-full rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? "Googleに接続中…" : "Googleでログイン"}
        </button>
      </div>
    </main>
  );
}
