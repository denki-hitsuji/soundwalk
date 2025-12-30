import Link from "next/link";

export default function OrganizerDashboardPage() {
  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">企画管理ダッシュボード</h1>
        <p className="text-sm text-gray-600">
          あなたが企画者として立ち上げたイベントの管理を行います。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* 進行中の企画一覧 */}
        <div className="rounded-lg border bg-white px-4 py-4 shadow-sm">
          <h2 className="text-sm font-semibold mb-1">進行中の企画</h2>
          <p className="text-xs text-gray-600 mb-3">
            自分が企画したイベントを一覧で確認し、
            出演者招待や応募の承認・拒否などを行えます。
          </p>
          <Link
            href="/organizer/events"
            className="inline-flex items-center rounded bg-purple-600 px-3 py-1.5 text-xs font-medium text-white"
          >
            企画一覧を見る
          </Link>
        </div>

        {/* 新規企画を立てる */}
        <div className="rounded-lg border bg-white px-4 py-4 shadow-sm">
          <h2 className="text-sm font-semibold mb-1">新規企画を立てる</h2>
          <p className="text-xs text-gray-600 mb-3">
            日程・会場・料金・条件などを設定して、新しいイベント企画を立ち上げます。
          </p>
          <Link
            href="/organizer/events/new"
            className="inline-flex items-center rounded bg-purple-700 px-3 py-1.5 text-xs font-medium text-white"
          >
            新しい企画を作成する
          </Link>
        </div>
      </div>
    </main>
  );
}
