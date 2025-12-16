// app/dashboard/page.tsx
import Link from "next/link";

export default function TopDashboardPage() {
  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">ダッシュボード</h1>
      </div>
<div className="rounded-lg border bg-white p-4 space-y-3">
  <p className="text-sm">
    👋 soundwalk は、
    ライブや演奏の予定をまとめておけるツールです。
  </p>

  <p className="text-sm text-gray-600">
    まずはログインして、すでに決まっているライブを
    1件だけ登録してみてください。
  </p>

  <Link
    href="/login"
    className="inline-flex items-center rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white"
  >
    ログイン / 新規登録
  </Link>
</div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* 演奏活動 */}
        <Link
          href="/musician"
          className="rounded-lg border bg-white px-4 py-4 shadow-sm hover:bg-gray-50 transition"
        >
          <h2 className="text-sm font-semibold mb-1">演奏活動</h2>
          <p className="text-xs text-gray-600">
            出演予定の確認・オファーの確認・募集への応募・プロフィール編集など。
          </p>
        </Link>

        {/* 企画管理 */}
        <Link
          href="/organizer"
          className="rounded-lg border bg-white px-4 py-4 shadow-sm hover:bg-gray-50 transition"
        >
          <h2 className="text-sm font-semibold mb-1">企画管理</h2>
          <p className="text-xs text-gray-600">
            自分が組んでいる企画の一覧や、新規企画の立ち上げはこちらから。
          </p>
        </Link>

        {/* 会場管理 */}
        <Link
          href="/venue"
          className="rounded-lg border bg-white px-4 py-4 shadow-sm hover:bg-gray-50 transition"
        >
          <h2 className="text-sm font-semibold mb-1">会場管理</h2>
          <p className="text-xs text-gray-600">
            店舗や会場の情報編集・イベント枠の管理にアクセスします。
          </p>
        </Link>
      </div>
    </main>
  );
}
