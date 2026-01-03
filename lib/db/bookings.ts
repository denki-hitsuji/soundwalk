"use server";

import { createSupabaseServerClient } from "../supabase/server";
export type BookingStatus = 'upcoming' | 'accepted' | 'completed' | 'cancelled';

export type BookingWithDetails = {
  id: string;
  event_id: string;
  musician_id: string;
  venue_id: string;
  status: BookingStatus;
  created_at: string;
  events: {
    id: string;
    title: string;
    event_date: string;
    start_time: string;
    end_time: string;
  } | null;
  venues: {
    id: string;
    name: string;
  } | null;
};


// 店舗側で使う：ミュージシャン情報もほしい版
export type VenueBookingWithDetails = {
  id: string;
  event_id: string;
  musician_id: string;
  venue_id: string;
  status: BookingStatus;
  created_at: string;
  events: {
    id: string;
    title: string;
    event_date: string;
    start_time: string;
    end_time: string;
  } | null;
  musicians: {
    id: string;
    genre: string | null;
    area: string | null;
    sample_video_url: string | null;
    bio: string | null;
    profiles: {
      display_name: string;
    } | null;
  } | null;
};
/**
 * ミュージシャン側：自分のブッキング一覧
 */

export async function getBookingsWithDetails(): Promise<BookingWithDetails[]> {

    const { data, error } = await (await createSupabaseServerClient())
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
      venues (
        id,
        name
      )
    `
   );
    if (error) { throw error; }

    return data as unknown as BookingWithDetails[];
}

export async function getVenueBookingsWithDetailsDB(userId: string): Promise<VenueBookingWithDetails[]> {
    const { data, error } = await (await createSupabaseServerClient())
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
        .eq('venue_id', userId)
        .order('events(event_date)', { ascending: true })
        .order('events(start_time)', { ascending: true });

    if(error) throw error;
    return data as unknown as VenueBookingWithDetails[];
}

export async function createBooking(params: {
  eventId: string;
  musicianId: string;
  venueId: string;
  message: string;
}) {
  const { data, error } = await (await createSupabaseServerClient())
    .from("bookings")
    .insert({
      event_id: params.eventId,
      musician_id: params.musicianId,
      venue_id: params.venueId,
      message: params.message || null,
      status: "upcoming",
    })
    .select()
    .single();

  if (error) throw error;

  return data as unknown as BookingWithDetails[];
}   

export async function updateBookingStatusDB(params: {
  bookingId: string;
  status: "accepted" | "rejected";
}) {
  const { error } = await (await createSupabaseServerClient())
    .from("venue_bookings")
    .update({ status: params.status })
    .eq("id", params.bookingId);

  if (error) throw error;
}