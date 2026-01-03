// lib/api/profiles.ts
import { getCurrentUser, supabase } from "../auth/session";

export type ProfileRow = {
  id: string;
  display_name: string;
  avatar_url: string | null;
};

export async function getMyProfile(): Promise<ProfileRow | null> {
  const user = await getCurrentUser();
  if (!user) throw new Error("ログインが必要です");

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // 行がない場合は null で返す
  if (error && error.code === 'PGRST116') {
    return null;
  }
  if (error) throw error;

  return data as ProfileRow;
}

/**
 * 自分の店舗プロフィールを upsert
 */
export async function upsertMyProfile(input: {
  name: string;
  avatarUrl: string;
}): Promise<ProfileRow> {
  const user = await getCurrentUser();
  if (!user) throw new Error("ログインが必要です");

  const payload = {
    id: user.id,
    display_name: input.name,
    avatar_url: input.avatarUrl || null,
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload)
    .select()
    .single();

  if (error) throw error;
  return data as ProfileRow;
}