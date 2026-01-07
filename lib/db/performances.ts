// lib/performanceQueries.ts
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
import { toStringOrNull, toBoolean, toString } from "../utils/convert";
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



/**
 * “plain object化”の最後の砦。
 * - Date / Map / Set / Error / null prototype が混ざっていても plain になる
 * - ただし BigInt は落ちる（必要なら事前に文字列化する）
 */


/**
 * Supabaseの data を、Client Component に渡して安全な形へ詰め直す
 */


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

export async function getNextPerformance(todayStr?: string) {
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

export async function getFlyerMapForPerformances(performanceIds: string[]) {
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

export async function getDetailsMapForPerformances(performanceIds: string[]) : Promise<DetailsMap> {
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

export async function upsertPerformance(params: {
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
    updated_at: new Date().toISOString(),
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