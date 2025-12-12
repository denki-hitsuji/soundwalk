// components/AppShell.tsx
import Link from "next/link";
import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー共通ナビ */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/musician" className="text-sm font-bold">
              街に音楽が溢れるアプリ
            </Link>
            <nav className="hidden md:flex items-center gap-3 text-xs text-gray-600">
              <Link href="/musician" className="hover:text-black">
                演奏活動
              </Link>
              <Link href="/venue" className="hover:text-black">
                会場管理
              </Link>
              <Link href="/musician/organized-events" className="hover:text-black">
                自分の企画
              </Link>
              <Link href="/musician/events" className="hover:text-black">
                募集中のイベント
              </Link>
            </nav>
          </div>

          {/* 将来: ユーザー名 / ログアウトなど置く */}
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="mx-auto max-w-5xl py-4">
        {children}
      </div>
    </div>
  );
}
