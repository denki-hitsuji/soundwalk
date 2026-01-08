"use server";
import "server-only"
import { createSupabaseServerClient } from "../supabase/server";
import { BookingStatus, BookingWithDetails } from "../utils/bookings";

/**
 * ミュージシャン側：自分のブッキング一覧
 */

export async function getBookingsWithDetails(params: {userId: string}): Promise<BookingWithDetails[]> {
  const supabase = await createSupabaseServerClient();
  const { userId } = params;
  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      id,
      event_id,
      act_id,
      venue_id,
      status,
      created_at,
      events (
        id,
        title,
        event_date,
        start_time,
        end_time
      ),
      venues (
        id,
        name
      )
    `
    ).eq(`act_id`, userId);
  if (error) { throw error; }

  return data as unknown as BookingWithDetails[];
}

export async function getVenueBookingsWithDetailsDB(venueId: string): Promise<BookingWithDetails[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      id,
      event_id,
      musician_id,
      venue_id,
      status,
      created_at,
      events (
        id,
        title,
        event_date,
        start_time,
        end_time
      ),
      musicians (
        id,
        genre,
        area,
        sample_video_url,
        bio,
        profiles (
          display_name
        )
      )
    `
    )
    .eq('venue_id', venueId)
    .order('events(event_date)', { ascending: true })
    .order('events(start_time)', { ascending: true });

  if (error) throw error;
  return data as unknown as BookingWithDetails[];
}

export async function createBookingDb(params: {
  eventId: string;
  actId: string;
  venueId: string;
  status: BookingStatus 
  message: string;
}) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("bookings")
    .insert({
      event_id: params.eventId,
      act_id: params.actId,
      venue_id: params.venueId,
      message: params.message || null,
      status: params.status?? "upcoming",
    })
    .select()
    .single();

  if (error) throw error;

  return data as unknown as BookingWithDetails;
}

export async function updateBookingStatusDB(params: {
  bookingId: string;
  status: "accepted" | "rejected";
}) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("venue_bookings")
    .update({ status: params.status })
    .eq("id", params.bookingId);

  if (error) throw error;
}

export async function createOfferAndInboxPerformanceDb(params: { eventId: string, actId: string }) {
  const { eventId, actId } = params;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_offer_and_inbox_performance", {
          p_event_id: eventId,
          p_act_id: actId,
        });

        console.log("offer rpc result", { data, error });
        if (error) throw error;
}
