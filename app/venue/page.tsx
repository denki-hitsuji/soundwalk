// app/venue/page.tsx
import Link from 'next/link';

export default function VenueDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">店舗ダッシュボード</h1>
        <p className="text-sm text-gray-600">
          ここから、店舗プロフィールの編集やイベント枠の作成、
          応募の確認などにアクセスできます。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* 店舗プロフィール */}
        <div className="rounded-lg border bg-white px-4 py-4 shadow-sm">
          <h2 className="text-sm font-semibold mb-1">店舗プロフィール</h2>
          <p className="text-xs text-gray-600 mb-3">
            お店の雰囲気や音量の許容範囲、席数などの情報です。
            ミュージシャンが応募する際の判断材料になります。
          </p>
          <Link
            href="/venue/profile"
            className="inline-flex items-center rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white"
          >
            店舗プロフィールを編集する
          </Link>
        </div>

        {/* イベント枠作成 */}
        <div className="rounded-lg border bg-white px-4 py-4 shadow-sm">
          <h2 className="text-sm font-semibold mb-1">イベント枠の作成</h2>
          <p className="text-xs text-gray-600 mb-3">
            「この日・この時間に演奏してほしい」という枠を作成して、
            ミュージシャンからの応募を募ります。
          </p>
          <div className="flex gap-2">
            <Link
              href="/venue/events/new"
              className="inline-flex items-center rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white"
            >
              新しいイベント枠を作成
            </Link>
            <Link
              href="/venue/events"
              className="inline-flex items-center rounded bg-gray-200 px-3 py-1.5 text-xs font-medium text-gray-800"
            >
              既存のイベント一覧を見る
            </Link>
          </div>
        </div>

        {/* 応募管理（実質 /venue/events/[id] への入口イメージ） */}
        <div className="rounded-lg border bg-white px-4 py-4 shadow-sm">
          <h2 className="text-sm font-semibold mb-1">応募管理</h2>
          <p className="text-xs text-gray-600 mb-3">
            各イベント枠への応募は、イベント一覧から該当イベントを選ぶと確認できます。
            応募一覧画面で「この応募を承認」するとブッキングが確定します。
          </p>
          <Link
            href="/venue/events"
            className="inline-flex items-center rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white"
          >
            応募の来ているイベントを確認
          </Link>
        </div>

        {/* 将来のブッキング一覧 */}
        <div className="rounded-lg border bg-white px-4 py-4 shadow-sm opacity-60">
          <h2 className="text-sm font-semibold mb-1">ブッキング一覧（今後実装）</h2>
          <p className="text-xs text-gray-600 mb-1">
            決定した出演予定や、過去のブッキング履歴を一覧できるページをここに追加予定です。
          </p>
          <span className="inline-flex items-center rounded bg-gray-200 px-3 py-1.5 text-[11px] text-gray-600">
            準備中
          </span>
        </div>
      </div>

      <div className="text-[11px] text-gray-400">
        まずは「店舗プロフィール → イベント枠作成 → 応募確認」の流れが回れば、
        最小限の運用はスタートできます。
      </div>
    </div>
  );
}
