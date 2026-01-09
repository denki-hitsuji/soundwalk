"use server"
import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  PerformanceWithActs,
  FlyerMap,
  DetailsMap,
  PrepMap,
  DetailsRow,
  PrepTaskRow,
  FlyerRow,
  PerformanceRow,
} from "@/lib/utils/performance";
import { getPerformances, PREP_DEFS, toPerformanceWithActsArrayPlain, toPerformanceWithActsPlain } from "@/lib/utils/performance";
import { toYmdLocal, parseYmdLocal, addDaysLocal, diffDaysLocal, addDays } from "@/lib/utils/date";
import { getMyActs } from "@/lib/api/acts";
import { ActRow } from "@/lib/utils/acts"
import { toStringOrNull, toBoolean, toString, toPlainError } from "../utils/convert";
export type {
  PerformanceRow,
  PerformanceWithActs,
  FlyerMap,
  DetailsMap,
  PrepMap,
  DetailsRow,
  PrepTaskRow,
  FlyerRow,
} from "@/lib/utils/performance"; 



export async function getMyUpcomingPerformancesDb(todayStr?: string) {
  console.log("getMyUpcomingPerformances start");
  const supabase = await createSupabaseServerClient();
  const t = todayStr ?? toYmdLocal();
  const myActs = await getMyActs().then((acts) => acts.map((a) => a.id));
  const { data, error } = await supabase
    .from("musician_performances")
    .select(
      `
      id,
      event_date,
      venue_name,
      memo,
      act_id,
      status,
      status_reason,
      status_changed_at,
      acts:acts ( id, name, act_type )
    `
    )
    .in("act_id", myActs)
    .gte("event_date", t)
    .neq("status", "canceled")   
    .order("event_date", { ascending: true })

  console.log(`data : ${data}`);
  if (error) throw error;
  return toPerformanceWithActsArrayPlain(data);
}

export async function getNextPerformanceDb(todayStr?: string) {
  const supabase = await createSupabaseServerClient();
  const t = todayStr ?? toYmdLocal();
  const myActs = await getMyActs().then((acts) => acts.map((a) => a.id));
  // console.log(`my acts: ${myActs}`);
  const { data, error } = await supabase
    .from("musician_performances")
    .select(
      `
      id,
      event_date,
      venue_name,
      memo,
      act_id,
      status,
      status_reason,
      status_changed_at,
      acts:acts ( id, name, act_type )
    `
    )
    .in("act_id", myActs)
    .gte("event_date", t)
    .neq("status", "canceled")   
    .order("event_date", { ascending: true })
    .limit(1);

  if (error) throw error;
  return toPerformanceWithActsPlain(data);
}

export async function getFlyerMapForPerformancesDb(performanceIds: string[]) {
  const supabase = await createSupabaseServerClient();
  if (performanceIds.length === 0) return {} as FlyerMap;

  const { data, error } = await supabase
    .from("performance_attachments")
    .select("performance_id, file_url, created_at")
    .eq("file_type", "flyer")
    .in("performance_id", performanceIds)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const map: FlyerMap = {};
  for (const a of (data ?? []) as unknown as FlyerRow[]) {
    if (!map[a.performance_id]) {
      map[a.performance_id] = { file_url: a.file_url, created_at: a.created_at };
    }
  }
  return map;
}

export async function getDetailsMapForPerformancesDb(performanceIds: string[]) : Promise<DetailsMap> {
  const supabase = await createSupabaseServerClient();
  if (performanceIds.length === 0) return {} as DetailsMap;

  const { data, error } = await supabase
    .from("performance_details")
    .select(
      "performance_id, load_in_time, set_start_time, set_end_time, set_minutes, customer_charge_yen, one_drink_required"
    )
    .in("performance_id", performanceIds);

  if (error) throw error;

  const dmap: DetailsMap = {};
  for (const d of (data ?? []) as unknown as DetailsRow[]) {
    dmap[d.performance_id] = d;
  }
  return dmap;
}

/**
 * 方式B：アクセス時に必要な段取り行を upsert してから、select して返す
 */
export async function ensureAndFetchPrepMapDb(params: {
  performances: Array<{ id: string; event_date: string; act_id: string | null }>;
}) {
  const supabase = await createSupabaseServerClient();
  const { performances } = params;
  if (performances.length === 0) return {} as PrepMap;

  const desired = performances.flatMap((p) => {
    const eventDate = parseYmdLocal(p.event_date);
    return PREP_DEFS.map((def) => {
      const due = addDays(eventDate, def.offsetDays);
      const dueStr = due.toISOString().slice(0, 10);
      return {
        performance_id: p.id,
        task_key: def.key,
        act_id: p.act_id,
        due_date: dueStr,
      };
    });
  });

  const { error: upErr } = await supabase
    .from("performance_prep_tasks")
    .upsert(desired, { onConflict: "performance_id,task_key" });

  if (upErr) throw upErr;

  const ids = performances.map((p) => p.id);
  const { data, error } = await supabase
    .from("performance_prep_tasks")
    .select("id, performance_id, task_key, act_id, due_date, is_done, done_at, done_by_profile_id")
    .in("performance_id", ids);

  if (error) throw error;

  const pm: PrepMap = {};
  for (const t of (data ?? []) as unknown as PrepTaskRow[]) {
    pm[t.performance_id] ??= {};
    pm[t.performance_id][t.task_key] = t;
  }
  return pm;
}

export async function upsertPerformanceDb(params: {
  id: string | null;
  profile_id: string;
  event_date: string;
  venue_name: string | null;
  memo: string | null;
  act_id: string | null;
}): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const { id, profile_id, event_date, venue_name, memo, act_id } = params;

  const payload = {
    event_date,
    venue_name: venue_name?.trim() ? venue_name.trim() : null,
    memo: memo?.trim() ? memo.trim() : null,
    act_id,
    profile_id ,
  };

  let perfId = id;
  if (perfId) {
    const { error } = await supabase
      .from("musician_performances")
      .update(payload)
      .eq("id", perfId);

    if (error) throw error;
  } else {
    const { data, error } = await supabase
      .from("musician_performances")     
      .insert(payload)
      .select("id");

    if (error) throw error;
    perfId = data?.[0]?.id;
  }

  return perfId ?? "";
}

export async function getPerformancesForDashboardDb(userId: string) {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("v_dashboard_performances")
    .select("*");

  return data;
}

export async function updatePerformanceMemoDb(params: {
  performanceId: string;
  newMemo: string | null;
}): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { performanceId, newMemo } = params;

  const patch = {
    memo: newMemo?.trim() ? newMemo.trim() : null,
  };

  const { error } = await supabase
    .from("musician_performances")
    .update(patch)
    .eq("id", performanceId);

  if (error) throw error;
} 
  
export async function updatePrepTaskDoneDb(params: {
  taskId: string;
  nextDone: boolean;
  userId: string | null;
}): Promise<PrepTaskRow> {
  const { taskId, nextDone, userId } = params;
  const supabase = await createSupabaseServerClient();
  const payload = nextDone
    ? { is_done: true, done_at: new Date().toISOString(), done_by_profile_id: userId }
    : { is_done: false, done_at: null, done_by_profile_id: null };

  const { data, error } = await supabase
    .from("performance_prep_tasks")
    .update(payload)
    .eq("id", taskId)
    .select("id, performance_id, task_key, act_id, due_date, is_done, done_at, done_by_profile_id")
    .single();

  if (error) throw error;
  return data as PrepTaskRow;
}

export async function deletePerformanceMemoDb(performanceId: string): Promise<void> { 
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("musician_performances")
    .update({ memo: null })
    .eq("id", performanceId);

  if (error) throw error;
}   

export async function upsertPerformanceDetailsDb(params: {
  performanceId: string;
  notes: string | null;
}): Promise<void> {
  const { performanceId, notes } = params;
  const supabase = await createSupabaseServerClient();
  const payload = {
    performance_id: performanceId,
    notes: notes?.trim() ? notes.trim() : null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("performance_details")
    .upsert(payload, { onConflict: "performance_id" });

  if (error) throw error;
}


export async function getMyActsServerDb() {
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw new Error(`auth.getUser failed: ${toPlainError(authErr).message}`);
  const userId = auth.user?.id;
  if (!userId) return { userId: null , actIds: [] as string[] };

  const { data, error } = await supabase.from("v_my_acts").select("id");
  if (error) throw new Error(`v_my_acts select failed: ${toPlainError(error).message}`);

  return { userId, actIds: (data ?? []).map((r: any) => String(r.id)) };
}

export async function getNextPerformanceServerDb(todayStr?: string) {
  const t = todayStr ?? toYmdLocal();
  const { actIds } = await getMyActsServerDb();
  if (actIds.length === 0) return null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("musician_performances")
    .select(
      `
      id,
      event_date,
      venue_name,
      memo,
      act_id,
      status,
      status_reason,
      status_changed_at,
      acts:acts ( id, name, act_type )
    `
    )
    .in("act_id", actIds)
    .gte("event_date", t)
    .neq("status", "canceled")
    .order("event_date", { ascending: true })
    .limit(1);

  if (error) throw new Error(`musician_performances select failed: ${toPlainError(error).message}`);

  // supabaseの返すdataは基本 plain object なのでOK。Date化しないのが大事。
  return (data?.[0] ?? null) as PerformanceWithActs | null;
}
