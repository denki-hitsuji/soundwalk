// lib/api/offers.ts
import { supabase } from '@/lib/supabaseClient';

export type Offer = {
  id: string;
  event_id: string;
  musician_id: string;
  status: 'pending' | 'accepted' | 'declined';
  message: string | null;
  created_at: string;
};

export type OfferWithMusician = Offer & {
  musicians: {
    id: string;
    genre: string | null;
    volume: string | null;
    area: string | null;
    sample_video_url: string | null;
    bio: string | null;
    profiles: {
      display_name: string;
    } | null;
  } | null;
};

async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error('Not logged in');
  return user;
}

// イベントごとの応募一覧（店舗側で使用）
export async function getOffersForEvent(
  eventId: string
): Promise<OfferWithMusician[]> {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from('offers')
    .select(
      `
      id,
      event_id,
      musician_id,
      status,
      message,
      created_at,
      musicians (
        id,
        genre,
        volume,
        area,
        sample_video_url,
        bio,
        profiles (
          display_name
        )
      )
    `
    )
    .eq('event_id', eventId)

  if (error) throw error;

  const raw = (data ?? []) as any[];

  const normalized: OfferWithMusician[] = raw.map((row) => {
    const musicianRaw = Array.isArray(row.musicians)
      ? row.musicians[0] ?? null
      : row.musicians ?? null;

    const profileRaw =
      musicianRaw && Array.isArray(musicianRaw.profiles)
        ? musicianRaw.profiles[0] ?? null
        : musicianRaw?.profiles ?? null;

    return {
      id: row.id,
      event_id: row.event_id,
      musician_id: row.musician_id,
      status: row.status,
      message: row.message,
      created_at: row.created_at,
      musicians: musicianRaw
        ? {
            id: musicianRaw.id,
            genre: musicianRaw.genre ?? null,
            volume: musicianRaw.volume ?? null,
            area: musicianRaw.area ?? null,
            sample_video_url: musicianRaw.sample_video_url ?? null,
            bio: musicianRaw.bio ?? null,
            profiles: profileRaw
              ? {
                  display_name: profileRaw.display_name,
                }
              : null,
          }
        : null,
    };
  });

  return normalized;
}


export type OfferStatus = 'pending' | 'accepted' | 'declined';

/**
 * ミュージシャンとして「イベントに応募」する
 */
export async function applyToEvent(eventId: string, message?: string): Promise<Offer> {
  const user = await getCurrentUser();

  const payload = {
    event_id: eventId,
    musician_id: user.id,
    message: message ?? null,
  };

  const { data, error } = await supabase
    .from('offers')
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Offer;
}

/**
 * ミュージシャン側：自分が応募した offers 一覧
 */
export async function getMyOffers(): Promise<Offer[]> {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from('offers')
    .select('*')
    .eq('musician_id', user.id);

  if (error) throw error;
  return (data ?? []) as Offer[];
}

/**
 * 店舗側：応募を承認 → events.status更新 → bookings作成
 */
export async function acceptOffer(offerId: string) {
  // 1. オファーを取得して event_id, musician_id を知る
  const { data: offer, error: offerError } = await supabase
    .from('offers')
    .select('id, event_id, musician_id, status')
    .eq('id', offerId)
    .maybeSingle();

  if (offerError) throw offerError;
  if (!offer) throw new Error('Offer not found');

  // 2. 該当イベントの max_artists を取得
  const { data: ev, error: evError } = await supabase
    .from('events')
    .select('id, status, max_artists')
    .eq('id', offer.event_id)
    .maybeSingle();

  if (evError) throw evError;
  if (!ev) throw new Error('Event not found');

  // 3. すでに何件 accepted booking があるか数える
  const { data: existingBookings, error: bookingError } = await supabase
    .from('bookings')
    .select('id, status')
    .eq('event_id', offer.event_id)
    .eq('status', 'upcoming'); // or accepted 扱い相当

  if (bookingError) throw bookingError;

  const currentCount = existingBookings?.length ?? 0;

  if (currentCount >= (ev.max_artists ?? 1)) {
    throw new Error('このイベントはすでに最大組数に達しています。');
  }

  // 4. トランザクション的に、オファー承認 + ブッキング作成 + イベント状態更新
  // Supabase では rpc またはクライアント側で順にやる形（ここでは簡易版）

  // 4-1. bookings に insert
  const { error: insertError } = await supabase.from('bookings').insert({
    event_id: offer.event_id,
    musician_id: offer.musician_id,
    status: 'upcoming', // or accepted
  });

  if (insertError) throw insertError;

  // 4-2. この offer を accepted に更新
  const { error: offerUpdateError } = await supabase
    .from('offers')
    .update({ status: 'accepted' })
    .eq('id', offerId);

  if (offerUpdateError) throw offerUpdateError;

  // 4-3. 上限に達したら、イベントを matched / 他 pending を declined
  const newCount = currentCount + 1;
  if (newCount >= (ev.max_artists ?? 1)) {
    // イベントを matched
    const { error: evUpdateError } = await supabase
      .from('events')
      .update({ status: 'matched' })
      .eq('id', ev.id);

    if (evUpdateError) throw evUpdateError;

    // まだ pending の offers を declined にする（任意）
    const { error: declineError } = await supabase
      .from('offers')
      .update({ status: 'declined' })
      .eq('event_id', ev.id)
      .eq('status', 'pending');

    if (declineError) throw declineError;
  }
}