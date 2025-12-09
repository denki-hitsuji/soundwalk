// lib/api/bookings.ts
import { supabase } from '@/lib/supabaseClient';

export type BookingStatus = 'upcoming' | 'completed' | 'cancelled';

export type BookingWithDetails = {
  id: string;
  event_id: string;
  musician_id: string;
  venue_id: string;
  status: BookingStatus;
  created_at: string;
  events: {
    id: string;
    title: string;
    event_date: string;
    start_time: string;
    end_time: string;
  }[];
  venues: {
    id: string;
    name: string;
  }[];
};

// 店舗側で使う：ミュージシャン情報もほしい版
export type VenueBookingWithDetails = {
  id: string;
  event_id: string;
  musician_id: string;
  venue_id: string;
  status: BookingStatus;
  created_at: string;
  events: {
    id: string;
    title: string;
    event_date: string;
    start_time: string;
    end_time: string;
  }[];
  musicians: {
    id: string;
    genre: string | null;
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
 * ミュージシャン側：自分のブッキング一覧
 */
export async function getMyBookingsWithDetails(): Promise<BookingWithDetails[]> {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      id,
      event_id,
      musician_id,
      venue_id,
      status,
      created_at,
      events (
        id,
        title,
        event_date,
        start_time,
        end_time
      ),
      venues (
        id,
        name
      )
    `
    )
    .eq('musician_id', user.id)
    .order('events(event_date)', { ascending: true })
    .order('events(start_time)', { ascending: true });

  if (error) throw error;
  return (data ?? []) as BookingWithDetails[];
}

/**
 * 店舗側：自分の店のブッキング一覧（イベント＆ミュージシャン名付き）
 */
export async function getVenueBookingsWithDetails(): Promise<VenueBookingWithDetails[]> {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      id,
      event_id,
      musician_id,
      venue_id,
      status,
      created_at,
      events (
        id,
        title,
        event_date,
        start_time,
        end_time
      ),
      musicians (
        id,
        genre,
        area,
        sample_video_url,
        bio,
        profiles (
          display_name
        )
      )
    `
    )
    .eq('venue_id', user.id)
    .order('events(event_date)', { ascending: true })
    .order('events(start_time)', { ascending: true });

  if (error) throw error;
  return (data ?? []) as VenueBookingWithDetails[];
}
