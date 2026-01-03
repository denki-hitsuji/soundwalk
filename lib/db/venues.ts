// lib/venueQueries.ts
import { supabase } from "@/lib/auth/session";;

// ===== 型定義 =====
export type Venue = {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  prefecture: string | null;
};

export type Act = {
  id: string;
  name: string;
  act_type: string;
  owner_profile_id: string;
  description?: string | null;
  icon_url?: string | null;
};

export type Event = {
  id: string;
  venue_id: string;
  title: string;
  event_date: string;
  start_time: string;
  end_time: string;
  max_artists: number | null;
  description: string | null;
  status: string;
  created_at: string;
};

export type EventAct = {
  event_id: string;
  act_id: string;
  status: string;
  sort_order: number | null;
  created_at: string;
  act: Act;
};

export type VenueBooking = {
  id: string;
  status: string;
  message: string | null;
  created_at: string;
  event_id: string;
  act_id: string;
  event?: Partial<Event>; // 必要に応じて page 側で埋める
  act: Pick<Act, "id" | "name" | "act_type" | "owner_profile_id">;
};

// ==========================================================
//   venueId → Event + acceptedCount
// ==========================================================
export async function getVenueById(venueId: string): Promise<Venue | null> {
  const { data, error } = await supabase
    .from("venues")
    .select("*")
    .eq("id", venueId)
    .single();

  if (error) throw error;
  return (data ?? null) as Venue | null;
} 

export async function getAllVenues(): Promise<Venue[]> {
  const { data, error } = await supabase
    .from("venues")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Venue[];
}

export async function getVenueEventsWithAcceptedCount(venueId: string) {
  // 1. 会場のイベント取得
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("*")
    .eq("venue_id", venueId)
    .order("start_time", { ascending: true });

  if (eventsError) throw eventsError;
  if (!events) return [];

  const eventIds = events.map((e) => e.id);

  // 2. event_acts（accepted）取得
  const { data: eventActs, error: actsError } = await supabase
    .from("event_acts")
    .select("event_id")
    .eq("status", "accepted")
    .in("event_id", eventIds);

  if (actsError) throw actsError;

  const countMap = new Map<string, number>();
  for (const ea of eventActs ?? []) {
    countMap.set(ea.event_id, (countMap.get(ea.event_id) ?? 0) + 1);
  }

  return events.map((e) => ({
    ...e,
    acceptedCount: countMap.get(e.id) ?? 0,
  })) as (Event & { acceptedCount: number })[];
}

// ==========================================================
//   venueId → venue_bookings（応募）
// ==========================================================

export async function getVenueBookingsWithDetails(venueId: string) {
  // 1. この会場のイベントを全部取得
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, title, start_time, end_time, max_artists, venue_id")
    .eq("venue_id", venueId);

  if (eventsError) throw eventsError;
  if (!events || events.length === 0) return [];

  const eventMap = new Map(events.map((e) => [e.id, e]));
  const eventIds = events.map((e) => e.id);

  // 2. そのイベントの booking を取得
  const { data: bookings, error: bookingsError } = await supabase
    .from("venue_bookings")
    .select("id, status, message, created_at, event_id, act_id")
    .in("event_id", eventIds)
    .order("created_at", { ascending: false });

  if (bookingsError) throw bookingsError;
  if (!bookings || bookings.length === 0) return [];

  const actIds = Array.from(new Set(bookings.map((b) => b.act_id)));

  // 3. act 情報を取得
  const { data: acts, error: actsError } = await supabase
    .from("acts")
    .select("id, name, act_type, owner_profile_id")
    .in("id", actIds);

  if (actsError) throw actsError;

  const actMap = new Map(acts?.map((a) => [a.id, a]) ?? []);

  // 4. VenueBooking 型に整形して返す
  return bookings.map((b) => ({
    ...b,
    event: eventMap.get(b.event_id),
    act: actMap.get(b.act_id)!,
  })) as VenueBooking[];
}

// ==========================================================
//   eventId → venue_bookings（応募）
// ==========================================================

export async function getEventBookings(eventId: string) {
  // 1. booking だけ取る
  const { data: bookings, error: bookingsError } = await supabase
    .from("venue_bookings")
    .select("id, status, message, created_at, event_id, act_id")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (bookingsError) throw bookingsError;
  if (!bookings || bookings.length === 0) return [];

  const actIds = Array.from(new Set(bookings.map((b) => b.act_id)));

  // 2. act 情報取得
  const { data: acts, error: actsError } = await supabase
    .from("acts")
    .select("id, name, act_type, owner_profile_id")
    .in("id", actIds);

  if (actsError) throw actsError;

  const actMap = new Map(acts?.map((a) => [a.id, a]) ?? []);

  return bookings.map((b) => ({
    ...b,
    act: actMap.get(b.act_id)!,
  })) as VenueBooking[];
}

// ==========================================================
//   eventId → event_acts（出演名義）
// ==========================================================

export async function getEventActs(eventId: string) {
  // 1. event_acts を取得
  const { data, error } = await supabase
    .from("event_acts")
    .select("event_id, act_id, status, sort_order, created_at")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true, nullsFirst: false });

  if (error) throw error;
  if (!data || data.length === 0) return [];

  const actIds = data.map((ea) => ea.act_id);

  // 2. 対応する acts を取得
  const { data: acts, error: actsError } = await supabase
    .from("acts")
    .select("*")
    .in("id", actIds);

  if (actsError) throw actsError;

  const actMap = new Map(acts?.map((a) => [a.id, a]) ?? []);

  // 3. EventAct 型として返す
  return data.map((ea) => ({
    ...ea,
    act: actMap.get(ea.act_id)!,
  })) as EventAct[];
}

// ==========================================================
//   eventId → イベント詳細 + acts + bookings
// ==========================================================

export async function getEventWithDetails(eventId: string) {
  // 1. イベント本体
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();

  if (eventError) throw eventError;

  // 2. 出演名義
  const eventActs = await getEventActs(eventId);

  // 3. 応募
  const bookings = await getEventBookings(eventId);

  const acceptedCount = eventActs.filter((ea) => ea.status === "accepted").length;

  return {
    event: event as Event,
    acceptedCount,
    acts: eventActs,
    bookings,
  };
}

export async function getPublicEventForBooking(eventId: string) {
  // 1. イベント本体
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();

  if (eventError) throw eventError;
  if (!event) throw new Error("event not found");

  // 2. event_acts から acceptedCount だけ数える
  const { data: eventActs, error: actsError } = await supabase
    .from("event_acts")
    .select("status")
    .eq("event_id", eventId);

  if (actsError) throw actsError;

  const acceptedCount =
    eventActs?.filter((ea) => ea.status === "accepted").length ?? 0;

  return {
    event: event as Event,
    acceptedCount,
  };
}

// すでにある関数はそのままにして、下の方に追加してください
export async function getRecruitingEvents() {
  // 1. 公開中（published）のイベントを取得
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("*")
    .eq("status", "open")
    .order("event_date", { ascending: true });

  if (eventsError) throw eventsError;
  if (!events || events.length === 0) return [];

  const eventIds = events.map((e) => e.id);

  // 2. event_acts から accepted 数をカウント
  const { data: eventActs, error: actsError } = await supabase
    .from("event_acts")
    .select("event_id, status")
    .in("event_id", eventIds);

  if (actsError) throw actsError;

  const acceptedCountMap = new Map<string, number>();
  for (const ea of eventActs ?? []) {
    if (ea.status === "accepted") {
      acceptedCountMap.set(
        ea.event_id,
        (acceptedCountMap.get(ea.event_id) ?? 0) + 1,
      );
    }
  }

  // 3. 募集中かどうかでフィルタ
  const recruitingEvents = events.filter((e) => {
    const acceptedCount = acceptedCountMap.get(e.id) ?? 0;
    if (e.max_artists == null) return true; // 上限なし → 常に募集中扱い
    return acceptedCount < e.max_artists;
  });

  // 4. acceptedCount を付けて返す
  return recruitingEvents.map((e) => ({
    ...e,
    acceptedCount: acceptedCountMap.get(e.id) ?? 0,
  })) as (Event & { acceptedCount: number })[];
}
