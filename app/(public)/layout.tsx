import Link from "next/link";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900">
      <header className="mx-auto flex w-full max-w-md items-center justify-between px-4 py-4">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          soundwalk
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/login" className="text-gray-600 hover:text-gray-900">
            ログイン
          </Link>
          <Link
            href="/signup"
            className="rounded bg-gray-900 px-3 py-1.5 text-white hover:bg-gray-800"
          >
            サインアップ
          </Link>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-md px-4 pb-10">{children}</main>

      <footer className="mx-auto w-full max-w-md px-4 py-6 text-[11px] text-gray-500">
        音がある場所を、静かに増やす。
      </footer>
    </div>
  );
}
