// app/musician/page.tsx
'use client';

import Link from "next/link";
import QuickPerformanceBar from "@/app/musician/QuickPerformanceBar";
import { useCurrentAct } from "@/lib/useCurrentAct";
import { SongSummaryCard } from "@/components/songs/SongSummaryCard";

export default function MusicianDashboardPage() {
    const { currentAct, currentActId, loading } = useCurrentAct();

  if (loading) return null;

  if (!currentActId) {
    return (
      <div className="rounded border bg-white p-4 text-sm">
        まだ出演名義がありません。
        まずはソロ名義を作ってみてください。
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">ミュージシャンダッシュボード</h1>
        <QuickPerformanceBar />
        <p className="text-sm text-gray-600">
          👋 はじめての方へ
          まずは、すでに決まっているライブを1件登録してみてください。
          フライヤーや入り時間をまとめておくと、当日が楽になります。
        </p>
      </div>
        
      <div className="grid gap-4 md:grid-cols-2">
        {/* ライブタイムラインカード */}
        <div className="rounded-lg border bg-white px-4 py-4 shadow-sm">
          <h2 className="text-sm font-semibold mb-1">ライブを記録する</h2>
          <p className="text-xs text-gray-600 mb-3">
            すでに決まっている・終わったライブを登録して、
            自分の活動タイムラインを作りましょう。
          </p>
          <div className="flex gap-2">
            <Link
              href="/musician/performances/new"
              className="inline-flex items-center rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white"
            >
              ライブを記録する
            </Link>
            <Link
              href="/musician/performances"
              className="inline-flex items-center rounded bg-gray-800 px-3 py-1.5 text-xs font-medium text-white"
            >
              タイムラインを見る
            </Link>
          </div>
        </div>

        {/* プロフィールカード */}
        <div className="rounded-lg border bg-white px-4 py-4 shadow-sm">
          <h2 className="text-sm font-semibold mb-1">プロフィール</h2>
          <p className="text-xs text-gray-600 mb-3">
            お店側があなたを選ぶときに見る基本情報です。
            ジャンル・エリア・自己紹介・SNSリンクなどを設定できます。
          </p>
          <Link
            href="/musician/profile"
            className="inline-flex items-center rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white"
          >
            プロフィールを編集する
          </Link>
        </div>

        {/* 出演名義カード */}
        <div className="rounded-lg border bg-white px-4 py-4 shadow-sm">
          <h2 className="text-sm font-semibold mb-1">出演名義の管理</h2>
          <p className="text-xs text-gray-600 mb-3">
            ソロ・バンド・ユニットなど、ライブで使う「名前」を複数登録できます。
            演奏ログやイベント応募時に、ここで作った名義から選択できるようになります。
          </p>
          <Link
            href="/musician/acts"
            className="inline-flex items-center rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white"
          >
            出演名義を管理する
          </Link>
        </div>

        {/* 募集中のイベントカード */}
        <div className="rounded-lg border bg-white px-4 py-4 shadow-sm">
          <h2 className="text-sm font-semibold mb-1">募集中のイベント</h2>
          <p className="text-xs text-gray-600 mb-3">
            店舗やオーガナイザーが作成した
            「この日・この時間に演奏してほしい」という枠の一覧です。
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
        {/* actId は「現在選択中のアクト」 */}
        <SongSummaryCard actId={currentActId} />
      </div>

      <div className="text-[11px] text-gray-400">
        ※ まずは「出演名義 → ライブ記録 → 募集中のイベント」の順に整えておくと、
        店舗側やオーガナイザーから見てもあなたの活動が伝わりやすくなります。
      </div>
    </div>
  );
}
