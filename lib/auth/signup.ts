"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signupOrRedirect(params: {
  email: string;
  password: string;
  next: string;
}) {
  const email = params.email.trim().toLowerCase();
  const next = params.next?.startsWith("/") ? params.next : "/musician";

  // ① 既存チェック（ここが肝）
  const admin = createSupabaseAdminClient();
  const { data: existing, error: adminErr } = await admin.auth.admin.listUsers();

  // adminErr が出たら設定ミスの可能性が高いので、ここは素直にエラーで返す
  if (adminErr) {
    return { status: "error" as const, message: adminErr.message };
  }

  if (existing?.users.find(u => u.email === email)) {
    // 既存：サインアップさせずログインへ誘導
    return { status: "existing" as const, email, next };
  }

  // ② 新規だけ signUp
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email,
    password: params.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}${next}`,
    },
  });

  if (error) {
    return { status: "error" as const, message: error.message };
  }

  return { status: "sent" as const, email };
}
