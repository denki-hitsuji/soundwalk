// app/musician/actions.ts
"use server";

import { getCurrentUser } from "@/lib/auth/session.server";
import { createSupabaseServerClient } from "@/lib/supabase/server";


export async function updateMyAct(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("ログインが必要です");

  const act_id = String(formData.get("act_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const act_type = String(formData.get("act_type") ?? "solo");
  const descriptionRaw = formData.get("description");
  const description =
    descriptionRaw != null ? String(descriptionRaw).trim() : null;

  if (!act_id || !name) {
    throw new Error("act_id と name は必須です");
  }

  const { error } = await (await createSupabaseServerClient())
    .from("acts")
    .update({
      name,
      act_type,
      description,
    })
    .eq("id", act_id)
    .eq("owner_profile_id", user.id); // 自分のActだけ更新

  if (error) throw error;
}
