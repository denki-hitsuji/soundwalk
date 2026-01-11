// app/musician/profile/page.tsx
import "server-only";
import { redirect } from "next/navigation";
import ProfileEditorClient from "./ProfileEditorClient";
import { getCurrentUser } from "@/lib/auth/session.server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/api/profiles";
import { ProfileRow } from "@/lib/db/profiles";

export const dynamic = "force-dynamic";

type ActionState =
  | { ok: true; message: string; profile: ProfileRow }
  | { ok: false; message: string };

export default async function MusicianProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // RLS 前提：自分の row のみ取れる/取れない
  const myProfile = await getMyProfile();

  // ここで error が出るのは RLS/権限/テーブル定義あたりが原因
  // ただし「存在しない」は error にならず data=null になる想定
  if (myProfile instanceof Error) {
    // “落とす”より、ページ側で編集させつつ保存時に気づけるほうが実用的なので握りつぶさない
    console.error("profiles load error:", myProfile);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">プロフィール</h1>
      <p className="text-sm text-muted-foreground">
        バンドのメンバー一覧などに表示される “あなたの名前” を編集します。
      </p>

      <ProfileEditorClient initialProfile={myProfile ?? null} saveProfile={saveProfile} />
    </div>
  );
}

// ===== Server Action (upsert) =====
async function saveProfile(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  "use server";

  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "ログインが必要です" };

  const displayNameRaw = (formData.get("display_name") ?? "").toString();
  const display_name = displayNameRaw.trim();

  // 最小バリデーション（事故防止）
  if (display_name.length < 1) return { ok: false, message: "表示名を入力してください" };
  if (display_name.length > 40) return { ok: false, message: "表示名は40文字以内にしてください" };

  const supabase = await createSupabaseServerClient();

  // RLS 前提：自分の id 以外は upsert できない/できると危険
  const payload = {
    id: user?.id,
    display_name,
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select("id, display_name, avatar_url")
    .single();

  if (error) {
    console.error("profiles upsert error:", error);
    return { ok: false, message: error.message ?? "保存に失敗しました" };
  }

  return { ok: true, message: "保存しました", profile: data as ProfileRow };
}
