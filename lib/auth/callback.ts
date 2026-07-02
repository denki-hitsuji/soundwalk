import "server-only";

import { NextResponse } from "next/server";
import { sanitizeNextPath } from "@/lib/auth/redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function oauthErrorRedirect(url: URL, next?: string) {
  const loginUrl = new URL("/login", url.origin);
  loginUrl.searchParams.set("error", "oauth");
  if (next) loginUrl.searchParams.set("next", next);
  return NextResponse.redirect(loginUrl);
}

export async function handleOAuthCallback(request: Request) {
  const url = new URL(request.url);
  const next = sanitizeNextPath(url.searchParams.get("next"));

  if (url.searchParams.has("error")) {
    return oauthErrorRedirect(url, next);
  }

  const code = url.searchParams.get("code");
  if (!code) return oauthErrorRedirect(url);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return oauthErrorRedirect(url);

  return NextResponse.redirect(new URL(next, url.origin));
}
