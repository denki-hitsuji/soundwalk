// app/venue/events/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMyEvents, type Event } from '@/lib/api/events';
import Link from 'next/link';
import { deleteEvent } from '@/lib/api/events';

export default function VenueEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getMyEvents();
        setEvents(data);
      } catch (e: any) {
        console.error(e);
        setError('イベント一覧の読み込みに失敗しました。');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

    const handleDelete = async (id: string) => {
    if (!window.confirm('このイベントを削除しますか？\n応募や予約も同時に削除されます。')) {
      return;
    }

    setError(null);
    setDeletingId(id);
    try {
      await deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (e: any) {
      console.error(e);
      setError('イベントの削除に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setDeletingId(null);
    }
  };

 return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">イベント一覧</h1>
        <Link
          href="/venue/events/new"
          className="inline-flex items-center rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white"
        >
          新しいイベント枠を作成
        </Link>
      </div>

      {/* 省略：エラー／空表示などはそのまま */}

      <ul className="space-y-3">
        {events.map((ev) => (
          <li key={ev.id} className="rounded border px-4 py-3 text-sm">
            <div className="flex items-center justify-between">
              <div>
                {/* タイトルを応募一覧ページへのリンクにする */}
                <Link
                  href={`/venue/events/${ev.id}`}
                  className="font-medium text-blue-700 underline"
                >
                  {ev.title}
                </Link>
                <div className="text-gray-600">
                  {ev.event_date} {ev.start_time.slice(0, 5)}〜{ev.end_time.slice(0, 5)}
                </div>
                <div className="text-[11px] text-gray-500 mt-1">
                  最大 {ev.max_artists} 組
                </div>
              </div>
              <div className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                {ev.status === 'open'
                  ? '募集中'
                  : ev.status === 'matched'
                  ? 'マッチ済み'
                  : 'キャンセル'}
              </div>
               <div className="flex flex-col items-end gap-1">
                  <button
                    onClick={() => router.push(`/venue/events/${ev.id}/edit`)}
                    className="inline-flex items-center rounded bg-green-200 px-3 py-1 text-[11px] text-gray-800"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(ev.id)}
                    disabled={deletingId === ev.id}
                    className="inline-flex items-center rounded bg-red-500 px-3 py-1 text-[11px] font-medium text-white disabled:opacity-60"
                  >
                    {deletingId === ev.id ? '削除中...' : '削除'}
                  </button>
                </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}