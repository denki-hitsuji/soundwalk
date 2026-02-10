// lib/api/venue.ts
"use server"
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "../auth/session.server";
import { checkVenueAdminDb, getAllVenuesDb, getEventBookingsDb, getMyOwnerVenuesDb, getPublicEventForBookingDb, getVenueByIdDb, getVenueEventsWithAcceptedCountDb, getVenueProfileByIdDb, updateVenueDb, upsertMyVenueProfileDb } from "../db/venues";
import { VenueRow } from "../utils/venues";
export type VolumeLevel = 'quiet' | 'medium' | 'loud';

export type VenueProfile = {
  id: string;
  name: string;
  address: string | null;
  capacity: number | null;
  volume_preference: VolumeLevel | null;
  has_pa: boolean | null;
  photo_url: string | null;
};

/**
 * 自分の店舗（venues）プロフィールを取得
 */
export async function getMyVenueProfile(): Promise<VenueProfile | null> {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();
  if (!user) throw new Error("ログインが必要です");

  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('id', user.id)
    .single();

  // 行がない場合は null で返す
  if (error && error.code === 'PGRST116') {
    return null;
  }
  if (error) throw error;

  return data as VenueProfile;
}

export async function getEventBookings(eventId: string) {
  return await getEventBookingsDb(eventId);
}

export async function upsertMyVenueProfile(input: {
  name: string;
  address: string;
  capacity: number | null;
  volumePreference: VolumeLevel;
  hasPa: boolean;
  photoUrl: string;
}) {
  return await upsertMyVenueProfileDb(input);
}

export async function getPublicEventForBooking(eventId: string) {
  return await getPublicEventForBookingDb(eventId);
}

export async function getVenueEventsWithAcceptedCount(venueId: string) {
  return await getVenueEventsWithAcceptedCountDb(venueId);
}

export async function getVenueById(venueId: string): Promise<VenueRow | null> {
  return await getVenueByIdDb(venueId);
}

export async function getVenueProfileById(venueId: string): Promise<VenueProfile | null> {
  return await getVenueProfileByIdDb(venueId);
} 

export async function getAllVenues() {
  return await getAllVenuesDb();
}

export async function getMyOwnerVenues() {
  return await getMyOwnerVenuesDb();
}

/**
 * 指定されたユーザーが指定された会場の管理者かどうかを確認
 */
export async function checkVenueAdmin(venueId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return await checkVenueAdminDb(venueId, user.id);
}

/**
 * 会場情報を更新
 */
export async function updateVenue(
  venueId: string,
  input: {
    name: string;
    address: string;
    capacity: number | null;
    volumePreference: VolumeLevel;
    hasPa: boolean;
    photoUrl: string;
  }
): Promise<VenueProfile> {
  const user = await getCurrentUser();
  if (!user) throw new Error("ログインが必要です");

  const isAdmin = await checkVenueAdminDb(venueId, user.id);
  if (!isAdmin) throw new Error("この会場の編集権限がありません");

  return await updateVenueDb(venueId, input);
}