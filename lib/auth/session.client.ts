"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient, supabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseClient();

    supabase.auth.getUser().then((result: { data: { user: User | null } }) => {
      setUser(result.data.user ?? null);
      setLoading(false);
    });
  }, []);

  return { user, loading };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}