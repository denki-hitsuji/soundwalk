// "use server";

// import { createSupabaseServerClient } from "@/lib/supabase/server";

// export async function updatePersonalPerformanceCore(input: {
//   performanceId: string;
//   eventDate: string; // "YYYY-MM-DD"
//   venueId: string | null;
//   venueName: string | null;
// }) {
//   const supabase = await createSupabaseServerClient();

//   const { error } = await supabase.rpc("update_personal_performance_core", {
//     p_performance_id: input.performanceId,
//     p_event_date: input.eventDate,
//     p_venue_id: input.venueId,
//     p_venue_name: input.venueName,
//   });

//   if (error) throw new Error(error.message);

//   return { ok: true };
// }
