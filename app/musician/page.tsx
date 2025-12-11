// app/musician/page.tsx
import Link from "next/link";

export default function MusicianDashboardPage() {
  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold mb-2">ミュージシャンダッシュボード</h1>
        <p className="text-sm text-gray-600">
          ここから、プロフィール編集やイベント応募など、
          ミュージシャンとしての機能にまとめてアクセスできます。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* プロフィールカード */}
        <div className="rounded-lg border bg-white px-4 py-4 shadow-sm">
          <h2 className="text-sm font-semibold mb-1">プロフィール</h2>
          <p className="text-xs text-gray-600 mb-3">
            お店側があなたを選ぶときに見る基本情報です。
            ジャンル・エリア・動画リンクなどを設定できます。
          </p>
          <Link
            href="/musician/profile"
            className="inline-flex items-center rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white"
          >
            プロフィールを編集する
          </Link>
        </div>

        {/* イベント一覧カード */}
        <div className="rounded-lg border bg-white px-4 py-4 shadow-sm">
          <h2 className="text-sm font-semibold mb-1">募集中のイベント</h2>
          <p className="text-xs text-gray-600 mb-3">
            店舗が作成した「この日・この時間に演奏してほしい」という枠の一覧です。
            気になる枠に応募できます。
          </p>
          <Link
            href="/musician/events"
            className="inline-flex items-center rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white"
          >
            募集中のイベントを見る
          </Link>
        </div>

        {/* ブッキング一覧カード */}
        <div className="rounded-lg border bg-white px-4 py-4 shadow-sm">
          <h2 className="text-sm font-semibold mb-1">ブッキング一覧</h2>
          <p className="text-xs text-gray-600 mb-3">
            承認された出演予定（ブッキング）の一覧です。
            直近のライブスケジュールをここから確認できます。
          </p>
          <Link
            href="/musician/bookings"
            className="inline-flex items-center rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white"
          >
            ブッキング一覧を開く
          </Link>
        </div>
      </div>

      <div className="text-[11px] text-gray-400">
        ※ まずは「プロフィール → 募集中のイベント」の順に整えておくと、
        店舗側から見ても選びやすくなります。
      </div>
    </div>
  );
}
