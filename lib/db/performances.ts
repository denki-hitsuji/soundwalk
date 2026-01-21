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

  // console.log(`data : ${data}`);
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
}):Promise<PrepMap> {
  const supabase = await createSupabaseServerClient();

  const performancesWithAct = params.performances.filter(
    (p): p is { id: string; event_date: string; act_id: string } =>
      typeof p.act_id === "string" && p.act_id.length > 0
  );

  if (performancesWithAct.length === 0) return {} as PrepMap;
const desired = performancesWithAct.flatMap((p) => {
  const eventDate = parseYmdLocal(p.event_date);
  return PREP_DEFS.map((def) => {
    const due = addDays(eventDate, def.offsetDays);
    const dueStr = due.toISOString().slice(0, 10);
    return {
      performance_id: p.id,
      task_key: def.key,
      act_id: p.act_id, // ← ここは string で確定
      due_date: dueStr,
    };
  });
});

  const { error: upErr } = await supabase
    .from("performance_prep_tasks")
    .upsert(desired, { onConflict: "performance_id,task_key" });

  if (upErr) throw upErr;

  const ids = performancesWithAct.map((p) => p.id);
  const { data, error } = await supabase
    .from("performance_prep_tasks")
    .select("id, performance_id, task_key, act_id, due_date, is_done, done_at, done_by_profile_id")
    .in("performance_id", ids);

  if (error) throw error;

  const pm: PrepMap = {};
  for (const t of data ?? []) {
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

const BUCKET = "performance-attachments";

export async function savePerformanceDetailsFullDb(params: {
  performanceId: string;
  load_in_time: string | null;
  set_start_time: string | null;
  set_end_time: string | null;
  set_minutes: number | null;
  customer_charge_yen: number | null;
  one_drink_required: boolean | null;
  notes: string | null;
    open_time: string | null;
    start_time: string | null;
}) {
  const supabase = await createSupabaseServerClient();
  const { error :p_error } = await supabase.from("musician_performances").update({
    open_time: params.open_time,
    start_time: params.start_time
  }).eq("id", params.performanceId);
  
  const { error:d_error } = await supabase.from("performance_details").upsert({
    performance_id: params.performanceId,
    load_in_time: params.load_in_time,
    set_start_time: params.set_start_time,
    set_end_time: params.set_end_time,
    set_minutes: params.set_minutes,
    customer_charge_yen: params.customer_charge_yen,
    one_drink_required: params.one_drink_required,
    notes: params.notes,
  });

  if (p_error) throw new Error(p_error.message);
  if (d_error) throw new Error(d_error.message);
}

export async function postPerformanceMessageDb(params: {
  performanceId: string;
  body: string;
  source: string | null;
}) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("performance_messages").insert({
    performance_id: params.performanceId,
    body: params.body,
    source: params.source,
  });
  if (error) throw new Error(error.message);
}

export async function uploadPerformanceFlyerDb(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const performanceId = String(formData.get("performanceId") ?? "");
  const actId = String(formData.get("actId") ?? "");
  const file = formData.get("file");

  if (!performanceId || !actId) throw new Error("Invalid params");
  if (!(file instanceof File)) throw new Error("File missing");

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const safeExt = ["png", "jpg", "jpeg", "webp"].includes(ext) ? ext : "bin";
  const path = `${actId}/${performanceId}/${crypto.randomUUID()}.${safeExt}`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type });

  if (upErr) throw new Error(upErr.message);

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const fileUrl = pub.publicUrl;

  const { error: insErr } = await supabase.from("performance_attachments").insert({
    performance_id: performanceId,
    file_url: fileUrl,
    file_path: path,
    file_type: "flyer",
    caption: null,
  });

  if (insErr) throw new Error(insErr.message);
}

export async function deletePerformanceAttachmentDb(params: {
  performanceId: string;
  attachmentId: string;
}) {
  const supabase = await createSupabaseServerClient();

  // まずfile_pathを取る
  const { data: row, error: selErr } = await supabase
    .from("performance_attachments")
    .select("id, file_path")
    .eq("id", params.attachmentId)
    .eq("performance_id", params.performanceId)
    .single();

  if (selErr) throw new Error(selErr.message);

  // DB削除
  const { error: delErr } = await supabase
    .from("performance_attachments")
    .delete()
    .eq("id", params.attachmentId)
    .eq("performance_id", params.performanceId);

  if (delErr) throw new Error(delErr.message);

  // storage削除（失敗は致命じゃない）
  if (row?.file_path) {
    const { error: stErr } = await supabase.storage.from(BUCKET).remove([row.file_path]);
    if (stErr) console.warn("storage remove failed", stErr);
  }
}

export async function acceptOfferDb(params: {
  performanceId: string;
  eventId: string;
  actId: string;
}) {
  const supabase = await createSupabaseServerClient();

  // 1) booking を探す
  const { data: bk, error: bkErr } = await supabase
    .from("venue_bookings")
    .select("id, status")
    .eq("event_id", params.eventId)
    .eq("act_id", params.actId)
    .maybeSingle();

  if (bkErr) throw new Error(bkErr.message);
  if (!bk) throw new Error("booking が見つかりませんでした。");

  // 2) booking accepted
  {
    const { error } = await supabase.from("venue_bookings").update({ status: "accepted" }).eq("id", bk.id);
    if (error) throw new Error(error.message);
  }

  // 3) event_acts accepted
  {
    const { error } = await supabase
      .from("event_acts")
      .upsert({ event_id: params.eventId, act_id: params.actId, status: "accepted" }, { onConflict: "event_id,act_id" });
    if (error) throw new Error(error.message);
  }

  // 4) performance confirmed
  {
    const { error } = await supabase
      .from("musician_performances")
      .update({ status: "confirmed", status_reason: "ACCEPTED_BY_MUSICIAN", status_changed_at: new Date().toISOString() })
      .eq("id", params.performanceId);
    if (error) throw new Error(error.message);
  }

  // 5) max_artists reached => events.status matched
  const { data: ev, error: evErr } = await supabase.from("events").select("id,status,max_artists").eq("id", params.eventId).single();
  if (evErr) throw new Error(evErr.message);

  const max = (ev.max_artists as number | null) ?? null;
  if (max && max > 0 && ev.status === "open") {
    const { count, error: cntErr } = await supabase
      .from("event_acts")
      .select("*", { count: "exact", head: true })
      .eq("event_id", params.eventId)
      .eq("status", "accepted");

    if (cntErr) throw new Error(cntErr.message);

    if ((count ?? 0) >= max) {
      const { error: upErr } = await supabase.from("events").update({ status: "matched" }).eq("id", params.eventId).eq("status", "open");
      if (upErr) throw new Error(upErr.message);
    }
  }
}

export async function withdrawFromEventDb(params: {
  performanceId: string;
  eventId: string;
}) {
  const supabase = await createSupabaseServerClient();

  // 認証必須（自分のperformanceだけ更新する安全柵）
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("musician_performances")
    .update({ status: "canceled", status_reason: "WITHDRAWN_BY_MUSICIAN", status_changed_at: new Date().toISOString() })
    .eq("id", params.performanceId)
    .eq("profile_id", uid);

  if (error) throw new Error(error.message);

  // 任意：通知イベント
  await supabase.from("notification_events").insert({
    type: "PERFORMANCE_WITHDRAWN",
    event_id: params.eventId,
    payload: { performance_id: params.performanceId, profile_id: uid, reason: "WITHDRAWN_BY_MUSICIAN" },
  });
}

export async function deletePersonalPerformanceDb(params: { performanceId: string }) {
  const supabase = await createSupabaseServerClient();

  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Not authenticated");

  // performance を読んで event_id が無いことを確認（安全）
  const { data: perf, error: perfErr } = await supabase
    .from("musician_performances")
    .select("id, event_id")
    .eq("id", params.performanceId)
    .single();

  if (perfErr) throw new Error(perfErr.message);
  if (perf.event_id) throw new Error("イベント連動の出演は削除できません。");

  // attachments の file_path を取得
  const { data: attRows, error: attErr } = await supabase
    .from("performance_attachments")
    .select("file_path")
    .eq("performance_id", params.performanceId);

  if (attErr) throw new Error(attErr.message);

  const paths = (attRows ?? [])
    .map((a: any) => a.file_path)
    .filter((p: any): p is string => typeof p === "string" && p.length > 0);

  // DB削除（順序は現状あなたのロジック踏襲）
  {
    const { error } = await supabase.from("performance_attachments").delete().eq("performance_id", params.performanceId);
    if (error) throw new Error(error.message);
  }
  if (paths.length > 0) {
    const { error } = await supabase.storage.from(BUCKET).remove(paths);
    if (error) console.warn("storage remove failed", error);
  }
  {
    const { error } = await supabase.from("performance_messages").delete().eq("performance_id", params.performanceId);
    if (error) throw new Error(error.message);
  }
  {
    const { error } = await supabase.from("performance_details").delete().eq("performance_id", params.performanceId);
    if (error) throw new Error(error.message);
  }
  {
    const { error } = await supabase
      .from("musician_performances")
      .delete()
      .eq("id", params.performanceId)
      .eq("profile_id", uid);
    if (error) throw new Error(error.message);
  }
}

export async function getPerformanceAttachmentsDb(params: { performanceId: string }) {
  const { performanceId } = params;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("performance_attachments")
    .select("id, file_url, file_path, file_type, caption, created_at")
    .eq("performance_id", performanceId)
    .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
  return data;
}

export async function getPerformanceMessagesDb(params: { performanceId: string }) {
  const { performanceId } = params;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("performance_messages")
    .select("id, body, source, created_at")
    .eq("performance_id", performanceId)
    .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
  return data;
}
export async function getPerformanceByIdDb(params: { performanceId: string }) {
  const { performanceId } = params;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("musician_performances")
    .select("*" )
    .eq("id", performanceId)
    .maybeSingle()

  if (error) throw new Error(error.message);
  return data satisfies PerformanceRow;
}

export async function getDetailsForPerformanceDb(params: { performanceId: string }) {
  const { performanceId } = params;
  const supabase = await createSupabaseServerClient();
    // 認証必須（自分のperformanceだけ更新する安全柵）
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("performance_details")
    .select(`*` )
    .eq("performance_id", performanceId)
    .maybeSingle()

  if (error) throw new Error(error.message);
  return data;
}