import "server-only"
import { actionAsyncStorage } from "next/dist/server/app-render/action-async-storage.external";
import { getCurrentUser } from "../auth/session.server";
import { createSupabaseServerClient } from "../supabase/server";
import { EventWithAct, EventRow, EventStatus, EventWithVenue, toPlainEventWithVenue, EventActRow } from "../utils/events";
import { ActRow } from "../utils/acts";
import { PerformanceRow, toPlainPerformance } from "../utils/performance";

// CRUD

/**
 * 店舗側：自分のイベントを1件取得
 */
/**
 * 店舗側：自分のイベントを 1件取得
 * EventOffersPage (/venue/events/[eventId]) から使用
 */
export async function getEventByIdDb(eventId: string): Promise<EventWithVenue | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('events')
    .select(`
    id,
    organizer_profile_id,
    venue_id,
    title,
    event_date,
    open_time,
    start_time,
    end_time,
    max_artists,
    status, 
    charge,
    conditions,
    created_at,
    reconfirm_deadline,
        venues (
        id,
        name,
        address,
        volume_preference
      )
`)
    .eq('id', eventId)
    .maybeSingle(); // 行が無い場合は error ではなく data: null になる

  if (error) throw error;

  // 行が無い場合は null を返す（呼び出し側で「イベントが見つかりません」と表示）
  if (!data) return null;

  const ret = toPlainEventWithVenue(data) satisfies EventWithVenue;
  return { ...ret };
}


/**
 * ミュージシャン側：応募可能なイベント一覧（会場情報付き）
 */
export async function getOpenEventsForMusicianDb(): Promise<EventWithVenue[]> {
  const supabase = await createSupabaseServerClient();
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
      open_time,
      charge,
      conditions, 
      max_artists,
      organizer_profile_id,
      reconfirm_deadline,
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

  const normalized: EventWithVenue[] = raw.map(
    (row) => toPlainEventWithVenue(row)
  );

  return normalized;
}

/**
 * 店舗としてイベント枠を作成
 */
export async function createEventDb(input: {
  title: string;
  event_date: string;   // 'YYYY-MM-DD'
  start_time: string;   // 'HH:MM'
  end_time: string;     // 'HH:MM'
  max_artists: number;  // 対バン最大組数
}): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();

  const { error } = await supabase.from('events').insert({
    venue_id: user?.id,
    title: input.title,
    event_date: input.event_date,
    start_time: input.start_time,
    end_time: input.end_time,
    status: 'open',                // 新規は募集中
    max_artists: input.max_artists,
    organizer_profile_id: user?.id
  });

  if (error) {
    throw error;
  }
}

// lib/api/events.ts（一部抜粋）

// 既存: Event / EventStatus / getCurrentUser / createEvent などはそのまま

// ★ イベント更新
export async function updateEventDb(eventId: string, input: {
  title: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  max_artists: number | null;
  venue_id: string | null;
  open_time: string | null;
  charge: Number | null;
  conditions: string | null,
}): Promise<void> {
  console.log("🔥 updateEventDb called", eventId, input);
  const supabase = await createSupabaseServerClient();
  // const user = await getCurrentUser();

  const { error } = await supabase
    .from('events')
    .update({
      title: input.title,
      event_date: input.event_date,
      start_time: input.start_time,
      end_time: input.end_time,
      max_artists: input.max_artists,
      venue_id: input.venue_id,
      open_time: input.open_time,
      charge: input.charge,
      conditions: input.conditions
    })
    .eq('id', eventId)
    // .eq('organizer_profile_id', user?.id); // 自分のイベントだけ更新できるように制限

  if (error) {
    throw error;
  }
  console.log("🔥 updateEventDb end");
}

// ★ イベント削除
export async function deleteEventDb(eventId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();

  // まず「自分のイベントか」を確認（任意だが安全）
  const { data: ev, error: evError } = await supabase
    .from('events')
    .select('id')
    .eq('id', eventId)
    .eq('organizer_profile_id', user?.id)
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
    .eq('venue_id', user?.id);

  if (error) {
    throw error;
  }
}

/**
 * 店舗として自分のイベント一覧
 */
export async function getMyEventsDb(): Promise<EventWithVenue[]> {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('organizer_profile_id', user?.id)
    .order('event_date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) throw error;
  return (data ?? []) as EventWithVenue[];
}

export async function getEventCountForVenueDb(venueId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('venue_id', venueId);

  if (error) throw error;
  return count ?? 0;
}

export async function getEventCountForOrganizerDb(organizerProfileId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('organizer_profile_id', organizerProfileId);

  if (error) throw error;
  return count ?? 0;
}

export async function getOpenEventCountDb(): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'open');

  if (error) throw error;
  return count ?? 0;
}

export async function upsertEventActDb(params: {
  eventId: string;
  actId: string;
  status: 'pending' | 'accepted' | 'declined';
}): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { eventId, actId, status } = params;

  const { data, error } = await supabase
    .from("event_acts")
    .upsert(
      {
        event_id: eventId,
        act_id: actId,
        status: status,
      },
      { onConflict: "event_id, act_id" }
    );

  if (error) throw error;
}

export async function removeEventActDb(params: {
  eventId: string;
  actId: string;
}): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { eventId, actId } = params;

  const { error } = await supabase
    .from("event_acts")
    .delete()
    .eq("event_id", eventId)
    .eq("act_id", actId);

  if (error) throw error;
}

export async function upsertAllEventActsDb(params: {
  eventId: string;
  actIds: string[];
}): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { eventId, actIds } = params;

  // 既存の actIds を取得
  const { data: existingData, error: fetchError } = await supabase
    .from("event_acts")
    .select("act_id")
    .eq("event_id", eventId);

  if (fetchError) throw fetchError;

  const existingActIds = existingData?.map((row: { act_id: any; }) => row.act_id) || [];

  // 挿入すべき actIds を決定
  const toInsert = actIds.filter((id) => !existingActIds.includes(id));

  // 削除すべき actIds を決定
  const toDelete = existingActIds.filter((id: string) => !actIds.includes(id));

  // 挿入
  if (toInsert.length > 0) {
    const { error: insertError } = await supabase
      .from("event_acts")
      .insert(
        toInsert.map((actId) => ({
          event_id: eventId,
          act_id: actId,
          status: "accepted",
        })),
      );

    if (insertError) throw insertError;
  }

  // 削除
  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from("event_acts")
      .delete()
      .eq("event_id", eventId)
      .in("act_id", toDelete);

    if (deleteError) throw deleteError;
  }
}

export async function updateEventStatusDb(params: {
  eventId: string;
  status: EventStatus;
}): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { eventId, status } = params;

  const { error } = await supabase
    .from("events")
    .update({ status: status })
    .eq("id", eventId);

  if (error) throw error;
}

export async function getEventActsDb(params: {
  eventId: string;
}): Promise<EventActRow[]> {
  const supabase = await createSupabaseServerClient();
  const { eventId } = params;

  const { data : ea, error } = await supabase
    .from("event_acts")
    .select("*")
    .eq("event_id", eventId)
  if (error) throw error;
  return ea satisfies EventActRow[];
}

export async function getEventPerformancesDb(params: {
  eventId: string;
}): Promise<PerformanceRow[]> {
  const supabase = await createSupabaseServerClient();
  const { eventId } = params;

  const { data , error } = await supabase
    .from("musician_performances")
    .select(
      `
      id,
      profile_id,
      act_id,
      event_date,
  open_time ,
  start_time ,
  venue_name ,
  venue_id ,
  memo,
  created_at ,
  status ,
  status_changed_at ,
  status_reason ,
  event_id,
  booking_id ,
  offer_id ,
  booking_id, created_at, offer_id, open_time, start_time,
      acts ( id, name ),
      profiles ( id, display_name )
    `
    )
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (!data) throw Error("profile not found"); 
  return data?.map(d => toPlainPerformance(d));
  } 