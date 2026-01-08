// app/venue/events/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createEventDb } from '@/lib/db/events';

export default function NewEventPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');   // input type="date"
  const [startTime, setStartTime] = useState('');   // input type="time"
  const [endTime, setEndTime] = useState('');
  const [maxArtists, setMaxArtists] = useState<number>(3); // ★ デフォルト3組

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await createEventDb({
        title,
        event_date: eventDate,
        start_time: startTime,
        end_time: endTime,
        max_artists: maxArtists, // ★ ここで渡す
      });

      router.push('/venue/events');
    } catch (e: any) {
      console.error(e);
      setError('イベントの作成に失敗しました。入力内容を確認してください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-4">イベント作成</h1>

      {error && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* タイトル */}
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

        {/* 開始・終了時間 */}
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

        {/* ★ 最大出演組数 */}
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
            このイベントで同じ夜に出演してもらうミュージシャンの最大組数です。
            例：3 にすると、最大3組まで承認できます。
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? '作成中...' : 'イベントを作成'}
        </button>
      </form>
    </div>
  );
}
