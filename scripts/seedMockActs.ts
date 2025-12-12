// scripts/seedMockActs.ts
import { createClient } from "@supabase/supabase-js";

type ActSeed = {
  name: string;
  act_type: string;
};

const MOCK_ACTS: ActSeed[] = [
  { name: "The Midnight Trains", act_type: "band" },
  { name: "さくら通りアコースティック", act_type: "unit" },
  { name: "Midnight Jazz Trio", act_type: "band" },
  { name: "レイニー・ハイウェイ", act_type: "band" },
  { name: "ひとりぼっちのピアノ", act_type: "solo" },
  { name: "Neighborhood Funk", act_type: "band" },
  { name: "灯台のうたかた", act_type: "duo" },
  { name: "月光ストリートセッションズ", act_type: "unit" },
  { name: "Silent Movie Orchestra", act_type: "band" },
  { name: "雨宿りブルース", act_type: "solo" },
];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, key);

  // 1. 適当な owner_profile_id を1件だけ取る（基本はあなたのプロフィール）
  const { data: profiles, error: profilesError } = await supabase
    .from("musician_profiles")
    .select("id")
    .limit(1);

  if (profilesError) {
    console.error("musician_profiles 読み込みエラー:", profilesError);
    process.exit(1);
  }
  if (!profiles || profiles.length === 0) {
    console.error(
      "musician_profiles が1件もありません。先に自分のプロフィールを作ってください。"
    );
    process.exit(1);
  }

  const ownerProfileId = profiles[0].id as string;

  const payload = MOCK_ACTS.map((a) => ({
    name: a.name,
    act_type: a.act_type,
    owner_profile_id: ownerProfileId,
    is_temporary: true, // モックなので true でOK
  }));

  const { error: insertError } = await supabase.from("acts").insert(payload);
  if (insertError) {
    console.error("Insert acts error:", insertError);
    process.exit(1);
  }

  console.log(`Inserted ${payload.length} mock acts`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
