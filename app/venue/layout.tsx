// app/venue/layout.tsx
import type { ReactNode } from 'react';
import Link from 'next/link';
import { BackLink } from '@/app/components/layout/BackLink';

export default function VenueLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-gray-50">
            <header className="border-b bg-white">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
                    <div className="text-sm font-semibold">
                        MusicMatch <span className="text-gray-400 text-xs">/ 店舗</span>
                    </div>
          // app/venue/layout.tsx の nav 部分
                    <nav className="flex gap-4 text-sm">
                        <Link href="/venue" className="hover:underline">
                            ダッシュボード
                        </Link>
                        <Link href="/venue/profile" className="hover:underline">
                            店舗プロフィール
                        </Link>
                        <Link href="/venue/events" className="hover:underline">
                            イベント一覧
                        </Link>
                        <Link href="/venue/bookings" className="hover:underline">
                            ブッキング
                        </Link>
                    </nav>

                </div>
            </header>
            <div className="border-b bg-white">
                <div className="mx-auto max-w-5xl px-6 py-2 text-xs">
                    <a href="/" className="text-blue-600 hover:underline">トップへ戻る</a>
                </div>
                <BackLink/>
            </div>

            <main className="mx-auto max-w-5xl px-6 py-6">{children}</main>
        </div>
    );
}
