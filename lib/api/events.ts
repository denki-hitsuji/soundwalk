// lib/api/events.ts
import { supabase } from '@/lib/supabaseClient';

export type EventStatus = 'open' | 'matched' | 'cancelled';

export type Event = {
  id: string;
  venue_id: string;
  title: string;
  event_date: string;     // 'YYYY-MM-DD'
  start_time: string;     // 'HH:MM:SS'
  end_time: string;       // 'HH:MM:SS'
  status: EventStatus;
  created_at: string;
};

export type EventWithVenue = Event & {
venues: {
  id: string;
  name: string;
  address: string | null;
  volume_preference: string | null;
}[]; // ← 配列になる
};

/**
 * 店舗側：自分のイベントを1件取得
 */
export async function getMyEventById(eventId: string): Promise<Event | null> {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .eq('venue_id', user.id) // 自分の店のイベントだけ
    .single();

  if (error && error.code === 'PGRST116') {
    // 見つからない
    return null;
  }
  if (error) throw error;

  return data as Event;
}
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
 * 店舗としてイベント枠を作成
 */
export async function createEvent(input: {
  title: string;
  eventDate: string;  // '2025-12-31'
  startTime: string;  // '18:00'
  endTime: string;    // '19:00'
}): Promise<Event> {
  const user = await getCurrentUser();

  const payload = {
    venue_id: user.id,
    title: input.title,
    event_date: input.eventDate,
    start_time: input.startTime,
    end_time: input.endTime,
  };

  const { data, error } = await supabase
    .from('events')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data as Event;
}

/**
 * 店舗として自分のイベント一覧
 */
export async function getMyEvents(): Promise<Event[]> {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('venue_id', user.id)
    .order('event_date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Event[];
}

/**
 * ミュージシャン用：募集中（open）のイベント一覧＋店舗情報
 */
export async function getOpenEventsForMusician(): Promise<EventWithVenue[]> {
  const { data, error } = await supabase
    .from('events')
    .select(
      `
      id,
      venue_id,
      title,
      event_date,
      start_time,
      end_time,
      status,
      created_at,
      venues (
        id,
        name,
        address,
        volume_preference
      )
    `
    )
    .eq('status', 'open')
    .order('event_date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) throw error;
  return (data ?? []) as EventWithVenue[];
}