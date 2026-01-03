"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/auth/session.client";

export default function PublicHomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const run = async () => {
      const user = await useCurrentUser();
      if (user) {
        router.replace("/musician"); // ログイン済はダッシュボードへ
        return;
      }
      setChecking(false);
    };
    void run();
  }, [router]);

  if (checking) return null;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h1 className="text-xl font-bold leading-tight">
          次のライブを、いちばん上に。
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          フライヤー・入り時間・段取りチェックを、タイムラインで一括管理。
        </p>

        <div className="mt-4 flex gap-2">
          <Link
            href="/signup"
            className="flex-1 rounded bg-gray-900 px-3 py-2 text-center text-sm font-medium text-white hover:bg-gray-800"
          >
            サインアップ
          </Link>
          <Link
            href="/login"
            className="flex-1 rounded border px-3 py-2 text-center text-sm font-medium text-gray-900 hover:bg-gray-50"
          >
            ログイン
          </Link>
        </div>

        <div className="mt-3 text-xs text-gray-500">
          ※ まずは「すでに決まっているライブ」を1件登録するだけでOK
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold">未ログインでも見られる</h2>
        <p className="mt-1 text-sm text-gray-600">
          街の会場マップは、公開で眺められます。
        </p>
        <Link
          href="/map"
          className="mt-3 inline-flex rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          マップを見る
        </Link>
      </div>
    </div>
  );
}
