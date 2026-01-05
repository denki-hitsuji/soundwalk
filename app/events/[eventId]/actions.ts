// app/events/[eventId]/actions.ts
"use server";

import { createBooking } from "@/lib/api/bookings";
import { useCurrentUser } from "@/lib/auth/session.client";
import { getMyOwnerActs } from "@/lib/api/acts";
import { supabase } from "@/lib/supabase/client";
export async function submitBooking(formData: FormData, eventId: string) {
  const data = await useCurrentUser();
  if (!data.user) {
    throw new Error("ログインが必要です");
  }

  const message = String(formData.get("message") ?? "");

  // 1. このユーザーのデフォルトActを取る
  const acts = await getMyOwnerActs();
  const act = acts?.[0];
  if (!act) {
    throw new Error("このユーザーに紐づく活動名義(Act)がありません");
  }

  // 2. venue_bookings に insert
  const { error: insertError } = await supabase.from("venue_bookings").insert({
    event_id: eventId,
    act_id: act.id,
    message: message || null,
    status: "pending",
  });
  const booking = createBooking({
    eventId,
    musicianId: act.id,
    venueId: data?.user?.id ?? "",
    message: message ,
  });

  if (insertError) throw insertError;
}
