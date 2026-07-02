"use client";

import { sanitizeNextPath } from "@/lib/auth/redirect";
import { supabase } from "@/lib/supabase/client";

export async function signInWithGoogle(next: string) {
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(
        sanitizeNextPath(next)
      )}`,
      queryParams: { prompt: "select_account" },
    },
  });
}
