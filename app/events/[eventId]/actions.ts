// app/events/[eventId]/actions.ts
"use server";

import { supabase, getCurrentUser } from "@/lib/supabaseClient";

export async function submitBooking(formData: FormData, eventId: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("ログインが必要です");
  }

  const message = String(formData.get("message") ?? "");

  // 1. このユーザーのデフォルトActを取る（現状は1ユーザー1名義想定）
  const { data: acts, error: actsError } = await supabase
    .from("acts")
    .select("id")
    .eq("owner_profile_id", user.id)
    .limit(1);

  if (actsError) throw actsError;
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

  if (insertError) throw insertError;
}
