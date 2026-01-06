// app/musician/acts/new/page.tsx
"use server"
import { getCurrentUser } from "@/lib/auth/session.server";
import ActNewClient from "./ActNewClient";

export default async function ActNewPage() {
  const user = await getCurrentUser();
  if (!user) throw Error ("ログインしてください");
  return <ActNewClient userId={user.id} />;
}
