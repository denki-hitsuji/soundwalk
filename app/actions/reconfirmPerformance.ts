"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function reconfirmPerformance(performanceId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: auth, error: authError } = await (await createSupabaseServerClient()).auth.getUser();
  if (authError || !auth.user) throw new Error("Not authenticated");

  const { error } = await (await createSupabaseServerClient()).rpc("reconfirm_performance", {
    p_performance_id: performanceId,
    p_user_id: auth.user.id,
  });

  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function declineReconfirmPerformance(performanceId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: auth, error: authError } = await (await createSupabaseServerClient()).auth.getUser();
  if (authError || !auth.user) throw new Error("Not authenticated");

  const { error } = await (await createSupabaseServerClient()).rpc("decline_reconfirm_performance", {
    p_performance_id: performanceId,
    p_user_id: auth.user.id,
  });

  if (error) throw new Error(error.message);
  return { ok: true };
}
