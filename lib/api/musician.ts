// lib/api/musician.ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
const supabase = await createSupabaseServerClient();
export type VolumeLevel = 'quiet' | 'medium' | 'loud';

export type MusicianProfile = {
  id: string;
  genre: string | null;
  volume: VolumeLevel | null;
  area: string | null;
  min_fee: number | null;
  sample_video_url: string | null;
  bio: string | null;
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
 * 自分のミュージシャンプロフィールを取得
 */
export async function getMyMusicianProfile(): Promise<MusicianProfile | null> {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from('musicians')
    .select('*')
    .eq('id', user.id)
    .single();

  // row not found の場合は null を返す
  if (error && error.code === 'PGRST116') {
    return null;
  }
  if (error) throw error;

  return data as MusicianProfile;
}

/**
 * 自分のミュージシャンプロフィールを upsert
 */
export async function upsertMyMusicianProfile(input: {
  genre: string;
  volume: VolumeLevel;
  area: string;
  minFee: number | null;
  sampleVideoUrl: string;
  bio: string;
}): Promise<MusicianProfile> {
  const user = await getCurrentUser();

  const payload = {
    id: user.id,
    genre: input.genre || null,
    volume: input.volume || null,
    area: input.area || null,
    min_fee: input.minFee,
    sample_video_url: input.sampleVideoUrl || null,
    bio: input.bio || null,
  };

  const { data, error } = await supabase
    .from('musicians')
    .upsert(payload)
    .select()
    .single();

  if (error) throw error;
  return data as MusicianProfile;
}