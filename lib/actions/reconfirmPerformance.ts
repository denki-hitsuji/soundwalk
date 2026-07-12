"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session.server";

export async function reconfirmPerformance(performanceId: string) {
  const supabase = await createSupabaseServerClient();

  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.rpc("reconfirm_performance", {
    p_performance_id: performanceId,
    p_user_id: user.id,
  });

  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function declineReconfirmPerformance(performanceId: string) {
  const supabase = await createSupabaseServerClient();

  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.rpc("decline_reconfirm_performance", {
    p_performance_id: performanceId,
    p_user_id: user.id,
  });

  if (error) throw new Error(error.message);
  return { ok: true };
}
