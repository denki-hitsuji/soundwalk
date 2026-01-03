// lib/api/venue.ts
"use server"
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "../auth/session.server";

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
  const user = await getCurrentUser();
  if (!user) throw new Error("ログインが必要です");

  const { data, error } = await (await createSupabaseServerClient())
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

/**
 * 自分の店舗プロフィールを upsert
 */
export async function upsertMyVenueProfile(input: {
  name: string;
  address: string;
  capacity: number | null;
  volumePreference: VolumeLevel;
  hasPa: boolean;
  photoUrl: string;
}): Promise<VenueProfile> {
  const user = await getCurrentUser();
  if (!user) throw new Error("ログインが必要です");

  const payload = {
    id: user.id,
    name: input.name,
    address: input.address || null,
    capacity: input.capacity,
    volume_preference: input.volumePreference || null,
    has_pa: input.hasPa,
    photo_url: input.photoUrl || null,
  };

  const { data, error } = await (await createSupabaseServerClient())
    .from('venues')
    .upsert(payload)
    .select()
    .single();

  if (error) throw error;
  return data as VenueProfile;
}