"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session.server";

export async function organizerCancelPerformance(performanceId: string, reason?: string) {
  const supabase = await createSupabaseServerClient();

  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.rpc("organizer_cancel_performance", {
    p_performance_id: performanceId,
    p_actor_profile_id: user.id, // profiles.id = auth.users.id
    p_reason: reason ?? "ORGANIZER_CANCELED",
  });

  if (error) throw new Error(error.message);

  return { ok: true };
}
