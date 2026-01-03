"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function updateEventCore(input: {
  eventId: string;
  newDateISO: string;
  newVenueId: string;
}) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await (await createSupabaseServerClient()).auth.getUser();

  if (authError || !user) throw new Error("Not authenticated");

  const { error } = await (await createSupabaseServerClient()).rpc("update_event_core", {
    p_event_id: input.eventId,
    p_new_date: input.newDateISO,
    p_new_venue_id: input.newVenueId,
    p_changed_by_user_id: user.id,
  });

  if (error) throw new Error(error.message);

  return { ok: true };
}
