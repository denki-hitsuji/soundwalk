import { supabase } from '@/lib/supabaseClient';

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;

  // data.user に authユーザーが入る（メール確認ONなら確認前はnullのことも）
  return data.user;
}