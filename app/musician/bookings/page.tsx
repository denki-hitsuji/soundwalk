// app/musician/bookings/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getMyBookingsWithDetails, type BookingWithDetails } from '@/lib/api/bookings';

export default function MusicianBookingsPage() {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getMyBookingsWithDetails();
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
        <h1 className="text-2xl font-bold mb-2">ブッキング一覧</h1>
        <p className="text-sm text-gray-600">
          承認された出演予定（ブッキング）の一覧です。
          日付・時間・会場・ステータスを確認できます。
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
          店舗側から応募が承認されると、ここに表示されます。
        </p>
      )}

      <ul className="space-y-3">
        {bookings.map((b) => {
          const ev = b.events?.[0] ?? null;
          const venue = b.venues?.[0] ?? null;

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
                会場:{' '}
                {venue ? (
                  <span>{venue.name}</span>
                ) : (
                  <span className="italic text-gray-400">不明な会場</span>
                )}
              </div>

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
