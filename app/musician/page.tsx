// app/musician/page.tsx
import Link from "next/link";

export default function MusicianDashboardPage() {
  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold mb-2">ミュージシャンダッシュボード</h1>
        <p className="text-sm text-gray-600">
          ここから、プロフィール編集やイベント応募・企画など、
          あなたの音楽活動に関する機能へアクセスできます。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* 新しいイベントを企画する */}
        <div className="rounded-lg border bg-white px-4 py-4 shadow-sm">
          <h2 className="text-sm font-semibold mb-1">新しいイベントを企画する</h2>
          <p className="text-xs text-gray-600 mb-3">
            自分が企画者となるイベントを作成します。
          </p>
          <Link
            href="/events/new"
            className="inline-flex items-center rounded bg-purple-600 px-3 py-1.5 text-xs font-medium text-white"
          >
            イベントを企画する
          </Link>
        </div>

        {/* プロフィール */}
        <div className="rounded-lg border bg-white px-4 py-4 shadow-sm">
          <h2 className="text-sm font-semibold mb-1">プロフィール</h2>
          <p className="text-xs text-gray-600 mb-3">
            お店やイベンターがあなたを選ぶときに見る基本情報です。
          </p>
          <Link
            href="/musician/profile"
            className="inline-flex items-center rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white"
          >
            プロフィールを編集する
          </Link>
        </div>

        {/* 募集中のイベント */}
        <div className="rounded-lg border bg-white px-4 py-4 shadow-sm">
          <h2 className="text-sm font-semibold mb-1">募集中のイベント</h2>
          <p className="text-xs text-gray-600 mb-3">
            店舗やイベンターが立てた募集枠の一覧です。気になる枠に応募できます。
          </p>
          <Link
            href="/musician/events"
            className="inline-flex items-center rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white"
          >
            募集中のイベントを見る
          </Link>
        </div>

        {/* ブッキング一覧 */}
        <div className="rounded-lg border bg-white px-4 py-4 shadow-sm">
          <h2 className="text-sm font-semibold mb-1">ブッキング一覧</h2>
          <p className="text-xs text-gray-600 mb-3">
            承認された出演予定の一覧です。直近のライブスケジュールを確認できます。
          </p>
          <Link
            href="/musician/bookings"
            className="inline-flex items-center rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white"
          >
            ブッキング一覧を開く
          </Link>
        </div>

        {/* 自分が企画したイベント */}
        <div className="rounded-lg border bg-white px-4 py-4 shadow-sm">
          <h2 className="text-sm font-semibold mb-1">自分が企画したイベント</h2>
          <p className="text-xs text-gray-600 mb-3">
            あなた自身が企画者として立てたイベントの一覧です。
          </p>
          <Link
            href="/musician/organized-events"
            className="inline-flex items-center rounded bg-purple-600 px-3 py-1.5 text-xs font-medium text-white"
          >
            自分の企画イベントを見る
          </Link>
        </div>

        {/* ★ 自分が管理している会場 */}
        <div className="rounded-lg border bg-white px-4 py-4 shadow-sm">
          <h2 className="text-sm font-semibold mb-1">自分が管理している会場</h2>
          <p className="text-xs text-gray-600 mb-3">
            あなたが管理権限を持っている会場（バーやライブハウスなど）の一覧です。
            ここから会場情報やイベントを管理できます。
          </p>
          <Link
            href="/venue"
            className="inline-flex items-center rounded bg-orange-600 px-3 py-1.5 text-xs font-medium text-white"
          >
            会場ダッシュボードを開く
          </Link>
        </div>
      </div>

      <div className="text-[11px] text-gray-400">
        ※ まずは「プロフィール → 募集中のイベント」を整えてから、
        企画や会場管理に進むと運用しやすくなります。
      </div>
    </div>
  );
}
