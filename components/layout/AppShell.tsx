// AppShell.tsx（Server Component）
import { redirect } from "next/navigation";
import { AppShellClient } from "./AppShellClient";
import { getCurrentUser } from "@/lib/auth/session.server";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const initialUserId = user?.id ?? null;

  // Clientへ渡すのは string|null のみ（= “Only plain objects” 回避の基本）
  return <AppShellClient initialUserId={initialUserId}>{children}</AppShellClient>;
}
