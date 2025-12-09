// app/musician/events/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getOpenEventsForMusician, type EventWithVenue } from '@/lib/api/events';
import { applyToEvent, getMyOffers, type Offer } from '@/lib/api/offers';

type AppliedMap = Record<string, OfferStatus>;
type OfferStatus = 'pending' | 'accepted' | 'declined';

export default function MusicianEventsPage() {
  const [events, setEvents] = useState<EventWithVenue[]>([]);
  const [appliedMap, setAppliedMap] = useState<AppliedMap>({});
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      setInfo(null);

      try {
        const [evs, offers] = await Promise.all([
          getOpenEventsForMusician(),
          getMyOffers(),
        ]);

        setEvents(evs);

        // event_id ごとの応募状態マップを作成
        const map: AppliedMap = {};
        for (const o of offers) {
          map[o.event_id] = o.status;
        }
        setAppliedMap(map);
      } catch (e: any) {
        console.error(e);
        setError('イベント一覧の読み込みに失敗しました。ログイン状態やネットワークを確認してください。');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const handleApply = async (eventId: string) => {
    setError(null);
    setInfo(null);
    setApplyingId(eventId);

    try {
      const offer = await applyToEvent(eventId);
      setInfo('応募を送信しました。店舗側の返事をお待ちください。');

      setAppliedMap((prev) => ({
        ...prev,
        [eventId]: offer.status,
      }));
    } catch (e: any) {
      console.error(e);

      // もう応募済み場合（unique制約エラーが来る）
      if (e?.code === '23505') {
        setError('このイベントにはすでに応募済みです。');
      } else {
        setError('応募の送信に失敗しました。時間をおいて再度お試しください。');
      }
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">募集中のイベント</h1>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        店舗側が「この日・この時間に演奏してほしい」と作成したイベント枠の一覧です。
        気になる枠があれば応募してみてください。
      </p>

      {error && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {info && (
        <div className="mb-4 rounded border border-blue-300 bg-blue-50 px-4 py-2 text-sm text-blue-700">
          {info}
        </div>
      )}

      {loading && <p>読み込み中です...</p>}

      {!loading && events.length === 0 && (
        <p className="text-sm text-gray-600">
          現在募集中のイベント枠はありません。しばらくしてからもう一度確認してみてください。
        </p>
      )}

      <ul className="space-y-3">
        {events.map((ev) => {
          const venue = ev.venues?.[0] ?? null;
          const appliedStatus = appliedMap[ev.id]; // undefinedなら未応募

          let buttonLabel = '応募する';
          let disabled = false;

          if (appliedStatus === 'pending') {
            buttonLabel = '応募済み（返信待ち）';
            disabled = true;
          } else if (appliedStatus === 'accepted') {
            buttonLabel = '承認済み';
            disabled = true;
          } else if (appliedStatus === 'declined') {
            buttonLabel = '不採用（再応募不可）';
            disabled = true;
          }

          if (applyingId === ev.id) {
            buttonLabel = '送信中...';
            disabled = true;
          }

          return (
            <li key={ev.id} className="rounded border px-4 py-3 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{ev.title}</div>
                  <div className="text-gray-600">
                    {ev.event_date}{' '}
                    {ev.start_time.slice(0, 5)}〜{ev.end_time.slice(0, 5)}
                  </div>
                  {venue && (
                    <div className="text-gray-500 text-xs mt-1">
                      会場：{venue.name}
                      {venue.address ? ` / ${venue.address}` : ''}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1">
                  <button
                    onClick={() => handleApply(ev.id)}
                    disabled={disabled}
                    className="inline-flex items-center rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                  >
                    {buttonLabel}
                  </button>

                  {appliedStatus && (
                    <span className="text-[10px] text-gray-500">
                      状態: {appliedStatus === 'pending'
                        ? '応募送信済み'
                        : appliedStatus === 'accepted'
                        ? '承認済み（ブッキング）'
                        : '不採用'}
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}