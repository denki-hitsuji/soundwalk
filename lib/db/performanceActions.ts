// lib/performanceActions.ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PrepTaskRow } from "@/lib/utils/performance";
import { PerformanceRow } from "../utils/performance";
export async function updatePerformanceMemo(params: {
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
  
export async function updatePrepTaskDone(params: {
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

export async function deletePerformanceMemo(performanceId: string): Promise<void> { 
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("musician_performances")
    .update({ memo: null })
    .eq("id", performanceId);

  if (error) throw error;
}   

export async function upsertPerformanceDetails(params: {
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