// app/venue/events/[eventId]/edit/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  getMyEventById,
  updateEvent,
  type Event,
} from '@/lib/api/events';

export default function EditEventPage() {
  const params = useParams<{ eventId: string }>();
  const router = useRouter();
  const eventId = params.eventId;

  const [event, setEvent] = useState<Event | null>(null);

  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [maxArtists, setMaxArtists] = useState<number>(1);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 初期ロード：イベント情報取得＆フォームに反映
  useEffect(() => {
    const load = async () => {
      if (!eventId) return;
      setLoading(true);
      setError(null);
      try {
        const ev = await getMyEventById(eventId);
        if (!ev) {
          setError('イベントが見つかりませんでした。');
          return;
        }
        setEvent(ev);
        setTitle(ev.title);
        setEventDate(ev.event_date);
        setStartTime(ev.start_time.slice(0, 5));
        setEndTime(ev.end_time.slice(0, 5));
        setMaxArtists(ev.max_artists ?? 1);
      } catch (e: any) {
        console.error(e);
        setError('イベント情報の読み込みに失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;

    setError(null);
    setSaving(true);
    try {
      await updateEvent(eventId, {
        title,
        event_date: eventDate,
        start_time: startTime,
        end_time: endTime,
        max_artists: maxArtists,
      });

      router.push('/venue/events');
    } catch (e: any) {
      console.error(e);
      setError('イベントの更新に失敗しました。入力内容を確認してください。');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-4">イベント編集</h1>
        <p>読み込み中です...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-4">イベント編集</h1>
        {error ? (
          <p className="text-sm text-gray-600">{error}</p>
        ) : (
          <p className="text-sm text-gray-600">イベントが見つかりませんでした。</p>
        )}
        <button
          onClick={() => router.push('/venue/events')}
          className="mt-4 inline-flex items-center rounded bg-gray-200 px-3 py-1.5 text-xs"
        >
          イベント一覧に戻る
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-4">イベント編集</h1>

      {error && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* イベント名 */}
        <div>
          <label className="block text-sm font-medium mb-1">イベント名</label>
          <input
            type="text"
            className="w-full rounded border px-3 py-2 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* 日付 */}
        <div>
          <label className="block text-sm font-medium mb-1">開催日</label>
          <input
            type="date"
            className="w-full rounded border px-3 py-2 text-sm"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            required
          />
        </div>

        {/* 時間 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">開演時間</label>
            <input
              type="time"
              className="w-full rounded border px-3 py-2 text-sm"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">終演時間</label>
            <input
              type="time"
              className="w-full rounded border px-3 py-2 text-sm"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
        </div>

        {/* 最大出演組数 */}
        <div>
          <label className="block text-sm font-medium mb-1">
            最大出演組数（対バン枠）
          </label>
          <input
            type="number"
            min={1}
            max={10}
            className="w-full rounded border px-3 py-2 text-sm"
            value={maxArtists}
            onChange={(e) => {
              const v = Number(e.target.value);
              setMaxArtists(Number.isFinite(v) && v > 0 ? v : 1);
            }}
            required
          />
          <p className="mt-1 text-[11px] text-gray-600">
            このイベントに出演してもらうミュージシャンの最大組数です。
          </p>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? '更新中...' : '更新する'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/venue/events')}
            className="inline-flex items-center rounded bg-gray-200 px-3 py-2 text-xs"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}
