// app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUserRole } from '@/lib/authRole';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // すでにログインしている場合はロールに応じて自動リダイレクト
    (async () => {
      const role = await getCurrentUserRole();

      if (role === 'musician') {
        router.replace('/musician');
      } else if (role === 'venue') {
        router.replace('/venue');
      }
      // role が null の場合はそのままトップを表示（ロール選択画面として機能）
    })();
  }, [router]);

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">MusicMatch（仮）</h1>

      <p className="text-sm text-gray-700">
        ミュージシャンと店舗が、街のあちこちでライブを生み出すためのマッチングツールです。
        まずはロールを選んでダッシュボードに進んでください。
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-white px-4 py-4 shadow-sm">
          <h2 className="text-sm font-semibold mb-1">ミュージシャンとして使う</h2>
          <p className="text-xs text-gray-600 mb-3">
            プロフィールを登録して、募集中のイベントに応募できます。
          </p>
          <Link
            href="/musician"
            className="inline-flex items-center rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white"
          >
            ミュージシャンダッシュボードへ
          </Link>
        </div>

        <div className="rounded-lg border bg-white px-4 py-4 shadow-sm">
          <h2 className="text-sm font-semibold mb-1">店舗として使う</h2>
          <p className="text-xs text-gray-600 mb-3">
            店舗プロフィールを登録し、イベント枠を作成してミュージシャンを募集できます。
          </p>
          <Link
            href="/venue"
            className="inline-flex items-center rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white"
          >
            店舗ダッシュボードへ
          </Link>
        </div>
      </div>

      <div className="text-[11px] text-gray-400">
        ログイン済みの場合は、自動的にあなたのロールに応じたダッシュボードへ移動します。
      </div>
    </main>
  );
}
