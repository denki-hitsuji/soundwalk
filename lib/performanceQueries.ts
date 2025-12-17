// lib/performanceQueries.ts
import { supabase } from "@/lib/supabaseClient";
import type {
  PerformanceWithActs,
  FlyerMap,
  DetailsMap,
  PrepMap,
  DetailsRow,
  PrepTaskRow,
  FlyerRow,
} from "@/lib/performanceUtils";
import { PREP_DEFS, addDays, parseLocalDate } from "@/lib/performanceUtils";

export async function getNextPerformance(todayStr?: string) {
  const t = todayStr ?? new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("musician_performances")
    .select(
      `
      id,
      event_date,
      venue_name,
      memo,
      act_id,
      acts:acts ( id, name, act_type )
    `
    )
    .gte("event_date", t)
    .order("event_date", { ascending: true })
    .limit(1);

  if (error) throw error;
  return ((data?.[0] ?? null) as unknown as PerformanceWithActs | null);
}

export async function getFlyerMapForPerformances(performanceIds: string[]) {
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

export async function getDetailsMapForPerformances(performanceIds: string[]) {
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
export async function ensureAndFetchPrepMap(params: {
  performances: Array<{ id: string; event_date: string; act_id: string | null }>;
}) {
  const { performances } = params;
  if (performances.length === 0) return {} as PrepMap;

  const desired = performances.flatMap((p) => {
    const eventDate = parseLocalDate(p.event_date);
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
