// AppShell.tsx（Server Component）
"use server";
import { redirect } from "next/navigation";
import { AppShellClient } from "./AppShellClient";
import { createSupabaseServerClient } from "@/lib/supabase/server"; // ←あなたの実装に合わせてパス調整

export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();

  // Supabase SSR の作法に合わせて取得（例：auth.getUser）
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const initialUserId = user?.id ?? null;

  // Clientへ渡すのは string|null のみ（= “Only plain objects” 回避の基本）
  return <AppShellClient initialUserId={initialUserId}>{children}</AppShellClient>;
}
