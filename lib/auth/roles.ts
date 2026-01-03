// lib/authRole.ts
import { supabase } from '@/lib/supabase/client';

export type UserRole = 'musician' | 'venue' | null;

/**
 * 現在ログイン中ユーザーの role を profiles から取得
 */
export async function getCurrentUserRole(): Promise<UserRole> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle(); // singleでエラーになるなら .maybeSingle() 推奨

  if (profileError || !profile) {
    return null;
  }

  const role = profile.role as UserRole | undefined;
  return role ?? null;
}
