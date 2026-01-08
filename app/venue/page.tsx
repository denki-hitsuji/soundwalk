// app/venue/page.tsx
import { getMyOwnerVenues } from "@/lib/api/venues";
import { getCurrentUser } from "@/lib/auth/session.server";
import { VenueRow } from "@/lib/utils/venues";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic"; // ★ビルド時の静的評価を避ける
export default async function VenueDashboardPage() {

  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const venues = await getMyOwnerVenues();
  // const venues = Array<VenueRow>();

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">会場管理ダッシュボード</h1>
        <p className="text-sm text-gray-600">
          あなたが管理している会場のライブスケジュールやプロフィールを整えます。
        </p>
      </div>

      {venues.length === 0 && (
        <p className="text-sm text-gray-500">
          まだ管理している会場が登録されていません。
          開発側で venue_admins にレコードを追加すると、ここに表示されます。
        </p>
      )}

      <div className="space-y-4">
        {venues.map((v) => (
          <section
            key={v.id}
            className="rounded-lg border bg-white px-4 py-4 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">
                  {v.name}
                  {v.short_name && (
                    <span className="text-xs text-gray-500 ml-1">
                      （{v.short_name}）
                    </span>
                  )}
                </div>
                {(v.prefecture || v.city) && (
                  <div className="text-[11px] text-gray-500">
                    {[v.prefecture, v.city].filter(Boolean).join(" ")}
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {/* カレンダー形式（今後実装） */}
              <div className="rounded border px-3 py-3">
                <h2 className="text-xs font-semibold mb-1">
                  カレンダーで見る（準備中）
                </h2>
                <p className="text-[11px] text-gray-600">
                  この会場のイベントをカレンダー形式で一覧表示します。
                </p>
              </div>

              {/* 直近イベント一覧（今後実装） */}
              <div className="rounded border px-3 py-3">
                <h2 className="text-xs font-semibold mb-1">
                  直近のイベント（準備中）
                </h2>
                <p className="text-[11px] text-gray-600">
                  直近の日程のイベントを一覧で確認できるようにします。
                </p>
              </div>

              {/* 店舗プロフィール */}
              <div className="rounded border px-3 py-3">
                <h2 className="text-xs font-semibold mb-1">店舗プロフィール</h2>
                <p className="text-[11px] text-gray-600 mb-2">
                  店舗の基本情報や写真・URL などを編集します。
                </p>
                <button
                  className="inline-flex items-center rounded bg-blue-600 px-3 py-1.5 text-[11px] font-medium text-white"
                  disabled
                >
                  編集画面（準備中）
                </button>
              </div>

              {/* イベント枠の作成 */}
              <div className="rounded border px-3 py-3">
                <h2 className="text-xs font-semibold mb-1">イベント枠の作成</h2>
                <p className="text-[11px] text-gray-600 mb-2">
                  日程だけを先に押さえる「枠」を作成し、あとから企画を入れたり、
                  ミュージシャンを募集したりできるようにします。
                </p>
                <Link
                  href="/venue/events"
                  className="inline-flex items-center rounded bg-emerald-600 px-3 py-1.5 text-[11px] font-medium text-white"
                >
                  既存のイベント枠を管理する
                </Link>
              </div>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
