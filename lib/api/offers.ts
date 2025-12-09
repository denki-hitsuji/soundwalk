// lib/api/offers.ts
import { supabase } from '@/lib/supabaseClient';

export type OfferStatus = 'pending' | 'accepted' | 'declined';

export type Offer = {
  id: string;
  event_id: string;
  musician_id: string;
  status: OfferStatus;
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
    }[];
  }[];
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
 * 店舗側：特定イベントへの応募一覧（ミュージシャン情報込み）
 */
export async function getOffersForEvent(eventId: string): Promise<OfferWithMusician[]> {
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
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as OfferWithMusician[];
}

/**
 * 店舗側：応募を承認 → events.status更新 → bookings作成
 */
export async function acceptOffer(offerId: string) {
  const user = await getCurrentUser();
  const venueId = user.id;

  // 1. オファー取得（event_id / musician_id を知る）
  const { data: offer, error: offerErr } = await supabase
    .from('offers')
    .select('id, event_id, musician_id, status')
    .eq('id', offerId)
    .single();

  if (offerErr) throw offerErr;
  if (!offer) throw new Error('Offer not found');

  // 2. そのイベントの他のオファーを declined に落とす（MVPで軽くやっておく）
  const { error: declineErr } = await supabase
    .from('offers')
    .update({ status: 'declined' })
    .eq('event_id', offer.event_id)
    .neq('id', offerId);

  if (declineErr) throw declineErr;

  // 3. このオファーを accepted に
  const { error: updateOfferErr } = await supabase
    .from('offers')
    .update({ status: 'accepted' })
    .eq('id', offerId);

  if (updateOfferErr) throw updateOfferErr;

  // 4. イベントを matched に
  const { error: updateEventErr } = await supabase
    .from('events')
    .update({ status: 'matched' })
    .eq('id', offer.event_id);

  if (updateEventErr) throw updateEventErr;

  // 5. bookings にINSERT
  const bookingPayload = {
    event_id: offer.event_id,
    musician_id: offer.musician_id,
    venue_id: venueId,
    status: 'upcoming' as const,
  };

  const { data: booking, error: bookingErr } = await supabase
    .from('bookings')
    .insert(bookingPayload)
    .select()
    .single();

  if (bookingErr) throw bookingErr;
  return booking;
}
