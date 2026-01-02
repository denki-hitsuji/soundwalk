// lib/performanceActions.ts
import { supabase } from "@/lib/supabase/client.legacy";;
import type { PrepTaskRow } from "@/lib/performanceUtils";

export async function updatePrepTaskDone(params: {
  taskId: string;
  nextDone: boolean;
  userId: string | null;
}): Promise<PrepTaskRow> {
  const { taskId, nextDone, userId } = params;

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
