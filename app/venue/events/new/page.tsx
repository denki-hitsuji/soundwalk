// app/venue/events/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createEvent } from '@/lib/api/events';

export default function NewEventPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');   // input type="date"
  const [startTime, setStartTime] = useState('');   // input type="time"
  const [endTime, setEndTime] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('イベント名を入力してください。');
      return;
    }
    if (!eventDate) {
      setError('日付を選択してください。');
      return;
    }
    if (!startTime || !endTime) {
      setError('開始時間と終了時間を入力してください。');
      return;
    }

    setSaving(true);
    try {
      await createEvent({
        title: title.trim(),
        eventDate,
        startTime,
        endTime,
      });
      // 作成に成功したらイベント一覧へ
      router.push('/venue/events');
    } catch (e: any) {
      console.error(e);
      setError('イベントの作成に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">イベント枠を作成</h1>

      <p className="text-sm text-gray-600 mb-6">
        「この日・この時間に、こういう雰囲気のライブをしてほしい」という枠を作ります。
        ミュージシャンは、この枠に対して応募してきます。
      </p>

      {error && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        {/* タイトル */}
        <div>
          <label className="block text-sm font-medium mb-1">
            イベント名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="w-full rounded border px-3 py-2 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例：土曜アコースティックナイト"
          />
        </div>

        {/* 日付 */}
        <div>
          <label className="block text-sm font-medium mb-1">
            日付 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            className="rounded border px-3 py-2 text-sm"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />
        </div>

        {/* 時間帯 */}
        <div>
          <label className="block text-sm font-medium mb-1">
            時間帯 <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="time"
              className="rounded border px-3 py-2 text-sm"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <span className="text-sm text-gray-600">〜</span>
            <input
              type="time"
              className="rounded border px-3 py-2 text-sm"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>

        {/* ボタン */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? '作成中...' : 'イベント枠を作成する'}
          </button>
        </div>
      </form>
    </div>
  );
}