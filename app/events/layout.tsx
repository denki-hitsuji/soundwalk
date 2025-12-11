// app/events/layout.tsx
import Link from "next/link";

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
          <Link href="/musician" className="text-sm font-semibold">
            ミュージシャンダッシュボードへ戻る
          </Link>
          <nav className="flex gap-3 text-xs text-gray-600">
            <Link href="/musician/events">募集中のイベント</Link>
            <Link href="/musician/bookings">自分の応募一覧</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}
