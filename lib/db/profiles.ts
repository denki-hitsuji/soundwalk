"use server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ProfileRow = {
  id: string;
  display_name: string;
  avatar_url: string | null;
};

export async function getProfileByUserId(userId: string) {
  const { data, error } = await (await createSupabaseServerClient())
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  return data as ProfileRow;
}

export async function updatePerformanceMemo(params: {
  performanceId: string;
  newMemo: string | null;
}): Promise<void> {
  const { performanceId, newMemo } = params;

  const patch = {
    memo: newMemo?.trim() ? newMemo.trim() : null,
  };

  const { error } = await (await createSupabaseServerClient())
    .from("musician_performances")
    .update(patch)
    .eq("id", performanceId);

  if (error) throw error;
} 

export async function upsertProfile(profile: {
  id: string;
  display_name: string;
  avatar_url: string | null;
}): Promise<ProfileRow> {
  const { data, error } = await (await createSupabaseServerClient())
    .from("profiles")
    .upsert(profile)
    .select()
    .single();

  if (error) throw error;
  return data as ProfileRow;
}

// export async function getOtherActs(userId: string): Promise<ActRow[]> {
//     const { data, error } = await (await createSupabaseServerClient())
//         .from("v_my_acts")
//         .select("*")
//         .neq("owner_profile_id", userId);
//     if (error) throw error;
//     return (data ?? []) as ActRow[];
// }