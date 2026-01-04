"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient, supabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    supabase.auth.getUser().then((result: { data: { user: User | null } }) => {
      setUser(result.data.user ?? null);
      setLoading(false);
    });
  }, []);

  return { user, loading };
}

export async function getCurrentUserClient() {
  const supabase = createSupabaseBrowserClient();

  // 1) まずセッションがあるか
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw new Error(sessionError.message);

  // セッション無し＝未ログイン（または cookie が来てない）
  if (!sessionData.session) return { user: null, loading: false };

  // 2) user を確実に取りたいなら getUser()
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw new Error(userError.message);

  return { user: userData.user, loading: false };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}