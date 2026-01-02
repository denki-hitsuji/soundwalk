// lib/api/events.ts
import { supabase } from "@/lib/supabase/client.legacy";

export type EventStatus = 'open' | 'pending' | 'draft' | 'matched' | 'cancelled';

export type Event = {
  id: string;
  venue_id: string;
  title: string;
  event_date: string;
  start_time: string;
  end_time: string;
  status: EventStatus;
  created_at: string;
  max_artists: number;  
  organizer_profile_id: string;
};

export type EventWithVenue = Event & {
  venues: {
    id: string;
    name: string;
    address: string | null;
    volume_preference: string | null;
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

/**
 * 店舗側：自分のイベントを1件取得
 */
/**
 * 店舗側：自分のイベントを 1件取得
 * EventOffersPage (/venue/events/[eventId]) から使用
 */
export async function getMyEventById(eventId: string): Promise<Event | null> {
  const user = await getCurrentUser();

  const { data, error } = await supabase
        .from('events')
        .select(`
  id,
  venue_id,
  title,
  event_date,
  start_time,
  end_time,
  status,
  created_at,
  max_artists,
  organizer_profile_id
`)
        .eq('id', eventId)
        .eq('venue_id', user.id) // 自分の店のイベントだけ見えるようにする
        .maybeSingle(); // 行が無い場合は error ではなく data: null になる

    if (error) throw error;

    // 行が無い場合は null を返す（呼び出し側で「イベントが見つかりません」と表示）
    if (!data) return null;

    return {
        id: data.id,
        venue_id: data.venue_id,
        title: data.title,
        event_date: data.event_date,
        start_time: data.start_time,
        end_time: data.end_time,
        status: data.status as EventStatus,
        created_at: data.created_at,
        max_artists: data.max_artists ?? 1,
        organizer_profile_id: data.organizer_profile_id
    };
}


/**
 * ミュージシャン側：応募可能なイベント一覧（会場情報付き）
 */
export async function getOpenEventsForMusician(): Promise<EventWithVenue[]> {
    const user = await getCurrentUser();
    // user は今のところ使わないが、将来的に「自分のエリアだけ」とかに使える

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
      max_artists,
      organizer_profile_id,
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

    const raw = (data ?? []) as any[];

    const normalized: EventWithVenue[] = raw.map((row) => {
        const venueRaw = Array.isArray(row.venues)
            ? row.venues[0] ?? null
            : row.venues ?? null;

        return {
            id: row.id,
            venue_id: row.venue_id,
            organizer_profile_id: row.organizer_profile_id, 
            title: row.title,
            event_date: row.event_date,
            start_time: row.start_time,
            end_time: row.end_time,
            status: row.status as EventStatus,
            created_at: row.created_at,
            max_artists: row.max_artists,
            venues: venueRaw
                ? {
                    id: venueRaw.id,
                    name: venueRaw.name,
                    address: venueRaw.address ?? null,
                    volume_preference: venueRaw.volume_preference ?? null,
                }
                : null,
        };
    });

    return normalized;
}

/**
 * 店舗としてイベント枠を作成
 */
export async function createEvent(input: {
  title: string;
  event_date: string;   // 'YYYY-MM-DD'
  start_time: string;   // 'HH:MM'
  end_time: string;     // 'HH:MM'
  max_artists: number;  // 対バン最大組数
}): Promise<void> {
  const user = await getCurrentUser();

  const { error } = await supabase.from('events').insert({
    venue_id: user.id,
    title: input.title,
    event_date: input.event_date,
    start_time: input.start_time,
    end_time: input.end_time,
    status: 'open',                // 新規は募集中
    max_artists: input.max_artists, 
    organizer_profile_id: user.id
  });

  if (error) {
    throw error;
  }
}

// lib/api/events.ts（一部抜粋）

// 既存: Event / EventStatus / getCurrentUser / createEvent などはそのまま

// ★ イベント更新
export async function updateEvent(eventId: string, input: {
  title: string;
  event_date: string;
  start_time: string;
  end_time: string;
  max_artists: number;
}): Promise<void> {
  const user = await getCurrentUser();

  const { error } = await supabase
    .from('events')
    .update({
      title: input.title,
      event_date: input.event_date,
      start_time: input.start_time,
      end_time: input.end_time,
      max_artists: input.max_artists,
    })
    .eq('id', eventId)
    .eq('venue_id', user.id); // 自分のイベントだけ更新できるように制限

  if (error) {
    throw error;
  }
}

// ★ イベント削除
export async function deleteEvent(eventId: string): Promise<void> {
  const user = await getCurrentUser();

  // まず「自分のイベントか」を確認（任意だが安全）
  const { data: ev, error: evError } = await supabase
    .from('events')
    .select('id')
    .eq('id', eventId)
    .eq('venue_id', user.id)
    .maybeSingle();

  if (evError) throw evError;
  if (!ev) throw new Error('指定されたイベントが見つからないか、権限がありません。');

  // ここで関連レコードを先に消す（FKの ON DELETE CASCADE を貼っているなら不要）
//   await supabase.from('bookings').delete().eq('event_id', eventId);
//   await supabase.from('offers').delete().eq('event_id', eventId);

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)
    .eq('venue_id', user.id);

  if (error) {
    throw error;
  }
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

