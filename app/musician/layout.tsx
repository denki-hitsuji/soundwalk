// app/musician/layout.tsx
import type { ReactNode } from 'react';
import Link from 'next/link';
import { BackLink } from '@/components/layout/BackLink';

export default function MusicianLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-gray-50">
            <header className="border-b bg-white">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
                    <div className="text-sm font-semibold">
                        <a href="/">       
                        MusicMatch <span className="text-gray-400 text-xs">/ ミュージシャン</span>
                        </a>
                    </div>
                    <nav className="flex gap-4 text-sm">
                        <Link href="/musician" className="hover:underline">
                            ダッシュボード
                        </Link>
                        <Link href="/musician/profile" className="hover:underline">
                            プロフィール
                        </Link>
                        <Link href="/musician/events" className="hover:underline">
                            募集中のイベント
                        </Link>
                        <Link href="/musician/bookings" className="hover:underline">
                            ブッキング
                        </Link>
                    </nav>

                </div>
            </header>
            <div className="border-b bg-white">
                <div className="mx-auto max-w-5xl px-6 py-2 text-xs">
                    <BackLink />
                </div>
            </div>

            <main className="mx-auto max-w-5xl px-6 py-6">{children}</main>
        </div>
    );
}
