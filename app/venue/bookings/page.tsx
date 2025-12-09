// app/venue/bookings/page.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  getVenueBookingsWithDetails,
  type VenueBookingWithDetails,
} from '@/lib/api/bookings';

export default function VenueBookingsPage() {
  const [bookings, setBookings] = useState<VenueBookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getVenueBookingsWithDetails();
        setBookings(data);
      } catch (e: any) {
        console.error(e);
        setError('ブッキング一覧の読み込みに失敗しました。ログイン状態やネットワークを確認してください。');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const formatTime = (t: string | undefined) => (t ? t.slice(0, 5) : '');

  const statusLabel = (s: string) =>
    s === 'upcoming'
      ? '予定'
      : s === 'completed'
      ? '終了'
      : 'キャンセル';

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold mb-2">ブッキング一覧（店舗）</h1>
        <p className="text-sm text-gray-600">
          あなたの店舗で決まっている出演予定（ブッキング）の一覧です。
          日付・時間・ミュージシャン・ステータスを確認できます。
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && <p className="text-sm">読み込み中です...</p>}

      {!loading && !error && bookings.length === 0 && (
        <p className="text-sm text-gray-600">
          現在ブッキングはありません。
          イベント枠に応募が来て承認すると、ここに表示されます。
        </p>
      )}

      <ul className="space-y-3">
        {bookings.map((b) => {
          const ev = b.events?.[0] ?? null;
          const musician = b.musicians?.[0] ?? null;
          const profile = musician?.profiles?.[0] ?? null;

          const musicianName =
            profile?.display_name ||
            `(ID: ${musician?.id?.slice(0, 8) ?? 'unknown'})`;

          return (
            <li key={b.id} className="rounded border bg-white px-4 py-3 text-sm shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <div className="font-medium">
                  {ev?.title ?? 'タイトル未設定のイベント'}
                </div>
                <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                  {statusLabel(b.status)}
                </span>
              </div>

              <div className="text-gray-700">
                {ev ? (
                  <>
                    <span>{ev.event_date}</span>{' '}
                    <span>
                      {formatTime(ev.start_time)}〜{formatTime(ev.end_time)}
                    </span>
                  </>
                ) : (
                  <span>日付・時間情報なし</span>
                )}
              </div>

              <div className="text-xs text-gray-600 mt-1">
                ミュージシャン: {musicianName}
              </div>

              {musician?.sample_video_url && (
                <div className="mt-1">
                  <a
                    href={musician.sample_video_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-600 underline"
                  >
                    サンプル動画を見る
                  </a>
                </div>
              )}

              <div className="text-[11px] text-gray-400 mt-1">
                予約ID: {b.id.slice(0, 8)}… / 作成日時: {b.created_at}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
