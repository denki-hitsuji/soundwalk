// lib/api/venue.ts
import { supabase } from "@/lib/supabase/client.legacy";

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
 * 現在ログイン中ユーザーを取得
 */
async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error('Not logged in');
  return user;
}

/**
 * 自分の店舗（venues）プロフィールを取得
 */
export async function getMyVenueProfile(): Promise<VenueProfile | null> {
  const user = await getCurrentUser();

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

  const payload = {
    id: user.id,
    name: input.name,
    address: input.address || null,
    capacity: input.capacity,
    volume_preference: input.volumePreference || null,
    has_pa: input.hasPa,
    photo_url: input.photoUrl || null,
  };

  const { data, error } = await supabase
    .from('venues')
    .upsert(payload)
    .select()
    .single();

  if (error) throw error;
  return data as VenueProfile;
}