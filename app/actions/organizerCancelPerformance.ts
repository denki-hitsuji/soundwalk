"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function organizerCancelPerformance(performanceId: string, reason?: string) {
  const supabase = await createSupabaseServerClient();

  const { data: auth, error: authError } = await (await createSupabaseServerClient()).auth.getUser();
  if (authError || !auth.user) throw new Error("Not authenticated");

  const { error } = await (await createSupabaseServerClient()).rpc("organizer_cancel_performance", {
    p_performance_id: performanceId,
    p_actor_profile_id: auth.user.id, // profiles.id = auth.users.id
    p_reason: reason ?? "ORGANIZER_CANCELED",
  });

  if (error) throw new Error(error.message);

  return { ok: true };
}
