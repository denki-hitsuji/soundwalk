// app/events/[eventId]/actions.ts
"use server";

import { createBooking } from "@/lib/api/bookingsAction";
import { getMyOwnerActs } from "@/lib/api/acts";
import { getCurrentUser } from "@/lib/auth/session.server";
import { getMyVenueProfile } from "@/lib/api/venues";
export async function submitBooking(formData: FormData, eventId: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("ログインが必要です");
  }

  const message = String(formData.get("message") ?? "");

  // 1. このユーザーのデフォルトActを取る
  const acts = await getMyOwnerActs();
  const act = acts?.[0];
  if (!act) {
    throw new Error("このユーザーに紐づく活動名義(Act)がありません");
  }
  
  const venue = await getMyVenueProfile();

  // 2. venue_bookings に insert
  const booking = createBooking({
    userId: user.id, 
    eventId: eventId,
    actId: act.id,
    venueId: venue?.id ?? "",
    message: message ,
    status: "upcoming", 

  });

}
