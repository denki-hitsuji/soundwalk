// lib/api/bookings.ts
"use server";
import { getCurrentUser } from "@/lib/auth/session.server";
import { getBookingsWithDetails, getVenueBookingsWithDetailsDB } from "../db/bookings";
import { BookingStatus, BookingWithDetails } from "../utils/bookings";
import { VenueBookingWithDetails } from "../utils/venues";

/**
 * ミュージシャン側：自分のブッキング一覧
 */

export async function getMyBookingsWithDetails(): Promise<BookingWithDetails[]> {
  const user = await getCurrentUser();
  if(!user) throw new Error("ログインが必要です");

  const data = getBookingsWithDetails({ userId: user.id}).then((bookings) => {
    return bookings.filter((booking) => booking.musician_id === user.id);
  });


  // 👇 ここで「生の data:any[]」を正規化してから BookingWithDetails にする
  const normalized: BookingWithDetails[] = (await data).map((row) => {
    const ev = Array.isArray(row.events) ? row.events[0] ?? null : row.events ?? null;
    const venue = Array.isArray(row.venues) ? row.venues[0] ?? null : row.venues ?? null;

    return {
      id: row.id,
      event_id: row.event_id,
      musician_id: row.musician_id,
      venue_id: row.venue_id,
      status: row.status as BookingStatus,
      created_at: row.created_at,
      events: ev
        ? {
            id: ev.id,
            title: ev.title,
            event_date: ev.event_date,
            start_time: ev.start_time,
            end_time: ev.end_time,
          }
        : null,
      venues: venue
        ? {
            id: venue.id,
            name: venue.name,
          }
        : null,
    };
  });

  return normalized;
}

/**
 * 店舗側：自分の店のブッキング一覧（イベント＆ミュージシャン名付き）
 */
export async function getVenueBookingsWithDetails(): Promise<VenueBookingWithDetails[]> {
  const user = await getCurrentUser();
  if(!user) throw new Error("ログインが必要です");

  const data = await getVenueBookingsWithDetailsDB(user.id);
  const raw = (data ?? []) as any[];

  const normalized: VenueBookingWithDetails[] = raw.map((row) => {
    // events は配列のときとオブジェクトのとき両方に対応
    const evRaw = Array.isArray(row.events) ? row.events[0] ?? null : row.events ?? null;

    // musicians も同様に配列/オブジェクト両対応
    const musicianRaw = Array.isArray(row.musicians)
      ? row.musicians[0] ?? null
      : row.musicians ?? null;

    // profiles も配列/オブジェクト両対応
    const profileRaw =
      musicianRaw && Array.isArray(musicianRaw.profiles)
        ? musicianRaw.profiles[0] ?? null
        : musicianRaw?.profiles ?? null;

    return {
      id: row.id,
      event_id: row.event_id,
      musician_id: row.musician_id,
      venue_id: row.venue_id,
      status: row.status as BookingStatus,
      created_at: row.created_at,
      events: evRaw
        ? {
            id: evRaw.id,
            title: evRaw.title,
            event_date: evRaw.event_date,
            start_time: evRaw.start_time,
            end_time: evRaw.end_time,
          }
        : null,
      musicians: musicianRaw
        ? {
            id: musicianRaw.id,
            genre: musicianRaw.genre ?? null,
            area: musicianRaw.area ?? null,
            sample_video_url: musicianRaw.sample_video_url ?? null,
            bio: musicianRaw.bio ?? null,
            profiles: profileRaw
              ? {
                  display_name: profileRaw.display_name,
                }
              : null,
          }
        : null,
    };
  });

  return normalized;
}