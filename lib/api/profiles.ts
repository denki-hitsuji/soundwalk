// lib/api/profiles.ts
"use server";
import { getCurrentUser } from "@/lib/auth/session.server";
import { getProfileByUserId, ProfileRow, upsertProfile } from "../db/profiles";

export async function getMyProfile(): Promise<ProfileRow | null> {
  const user = await getCurrentUser();
  if (!user) throw new Error("ログインが必要です");

  const data = await getProfileByUserId(user.id);
  // 行がない場合は null で返す
  return data as ProfileRow;
}

/**
 * 自分のプロフィールを upsert
 */
export async function upsertMyProfile(input: {
  name: string;
  avatarUrl: string;
}): Promise<ProfileRow> {
  const user = await getCurrentUser();
  if (!user) throw new Error("ログインが必要です");

  const payload = {
    id: user.id,
    display_name: input.name,
    avatar_url: input.avatarUrl || null,
  };

  const updated = await upsertProfile(payload);
  return updated;
}

