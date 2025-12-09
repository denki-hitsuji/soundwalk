// app/venue/events/[eventId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getMyEventById, type Event } from '@/lib/api/events';
import {
  getOffersForEvent,
  acceptOffer,
  type OfferWithMusician,
} from '@/lib/api/offers';

type PageParams = {
  eventId: string;
};

export default function EventOffersPage() {
  const params = useParams<PageParams>();
  const router = useRouter();
  const eventId = params.eventId;

  const [event, setEvent] = useState<Event | null>(null);
  const [offers, setOffers] = useState<OfferWithMusician[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!eventId) return;
      setLoading(true);
      setError(null);
      setInfo(null);

      try {
        const [ev, ofs] = await Promise.all([
          getMyEventById(eventId),
          getOffersForEvent(eventId),
        ]);
        setEvent(ev);
        setOffers(ofs);
      } catch (e: any) {
        console.error(e);
        setError('イベントまたは応募の読み込みに失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [eventId]);

  const handleAccept = async (offerId: string) => {
    setError(null);
    setInfo(null);
    setActionId(offerId);

    try {
      await acceptOffer(offerId);
      setInfo('この応募を承認しました。ブッキングが作成されました。');

      // 承認後の状態を反映（1件accepted、他はdeclined）
      setOffers((prev) =>
        prev.map((o) =>
          o.id === offerId ? { ...o, status: 'accepted' } : { ...o, status: 'declined' }
        )
      );

      // イベントの状態も matched に更新
      if (event) {
        setEvent({ ...event, status: 'matched' });
      }
    } catch (e: any) {
      console.error(e);
      setError('承認処理に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setActionId(null);
    }
  };

  const formatTime = (t: string | undefined) =>
    t ? t.slice(0, 5) : '';

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-4">応募一覧</h1>
        <p>読み込み中です...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-4">応募一覧</h1>
        <p className="text-sm text-gray-600">イベントが見つかりませんでした。</p>
        <button
          onClick={() => router.push('/venue/events')}
          className="mt-4 inline-flex items-center rounded bg-gray-200 px-3 py-1.5 text-xs"
        >
          イベント一覧に戻る
        </button>
      </div>
    );
  }

  const statusLabel =
    event.status === 'open'
      ? '募集中'
      : event.status === 'matched'
      ? 'マッチ済み'
      : 'キャンセル';

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">応募一覧</h1>
        <button
          onClick={() => router.push('/venue/events')}
          className="inline-flex items-center rounded bg-gray-200 px-3 py-1.5 text-xs"
        >
          イベント一覧に戻る
        </button>
      </div>

      {/* イベント概要 */}
      <div className="mb-6 rounded border px-4 py-3 text-sm">
        <div className="flex items-center justify-between mb-1">
          <div className="font-medium">{event.title}</div>
          <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
            {statusLabel}
          </span>
        </div>
        <div className="text-gray-600">
          {event.event_date} {formatTime(event.start_time)}〜{formatTime(event.end_time)}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {info && (
        <div className="mb-4 rounded border border-green-300 bg-green-50 px-4 py-2 text-sm text-green-700">
          {info}
        </div>
      )}

      {/* 応募一覧 */}
      {offers.length === 0 ? (
        <p className="text-sm text-gray-600">
          まだこのイベントには応募が来ていません。
        </p>
      ) : (
        <ul className="space-y-3">
    {offers.map((offer) => {
  const musician = offer.musicians?.[0] ?? null;
  const profile = musician?.profiles?.[0] ?? null;

  const name =
    profile?.display_name ||
    // 将来ここに「musicians側にもnameを持たせた」場合などをフォールバック候補にできる
    `(ID: ${musician?.id?.slice(0, 8) ?? 'unknown'})`;

  let statusText = '応募中';
  if (offer.status === 'accepted') statusText = '承認済み';
  if (offer.status === 'declined') statusText = '不採用';

  const disabled =
    offer.status === 'accepted' ||
    offer.status === 'declined' ||
    actionId === offer.id ||
    event.status === 'matched';

  return (
    <li key={offer.id} className="rounded border px-4 py-3 text-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-gray-600 text-xs">
            {musician?.genre && <span>ジャンル: {musician.genre} / </span>}
            {musician?.area && <span>エリア: {musician.area}</span>}
          </div>
          {offer.message && (
            <div className="mt-1 text-xs text-gray-700">
              メッセージ: {offer.message}
            </div>
          )}
          {musician?.sample_video_url && (
            <div className="mt-1">
              <a
                href={musician.sample_video_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 underline"
              >
                サンプル動画を見る
              </a>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-1">
          <button
            onClick={() => handleAccept(offer.id)}
            disabled={disabled}
            className="inline-flex items-center rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
          >
            {actionId === offer.id
              ? '処理中...'
              : offer.status === 'accepted'
              ? '承認済み'
              : 'この応募を承認'}
          </button>
          <span className="text-[10px] text-gray-500">状態: {statusText}</span>
        </div>
      </div>
    </li>
  );
})}

        </ul>
      )}
    </div>
  );
}