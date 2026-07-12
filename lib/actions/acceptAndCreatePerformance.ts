"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session.server";

export async function acceptBookingAndCreatePerformance(bookingId: string) {
  const supabase = await createSupabaseServerClient();

  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase.rpc("accept_booking_and_create_performance", {
    p_booking_id: bookingId,
    p_actor_user_id: user.id,
  });

  if (error) throw new Error(error.message);

  // data は performance_id(uuid)
  return { performanceId: data as string };
}

export async function acceptOfferAndCreatePerformance(offerId: string) {
  const supabase = await createSupabaseServerClient();

  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase.rpc("accept_offer_and_create_performance", {
    p_offer_id: offerId,
    p_actor_user_id: user.id,
  });

  if (error) throw new Error(error.message);

  return { performanceId: data as string };
}
