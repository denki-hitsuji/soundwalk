// scripts/seedVenues.ts
// venues を一括投入し、同時に venue_admins も作成する seed スクリプト

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" }); // .env.local を読む

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

type VenueCsvRow = {
  name: string;
  address?: string;
  capacity?: string;
  volume_preference?: string;
  has_pa?: string;
  photo_url?: string;
  short_name?: string;
  city?: string;
  prefecture?: string;
  url?: string;
  notes?: string;
  latitude?: string;
  longitude?: string;
};

// 超ざっくり CSV パーサ（カンマ区切り・ダブルクォート無し前提）
function parseCsv(text: string): VenueCsvRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const [headerLine, ...dataLines] = lines;
  const headers = headerLine.split(",").map((h) => h.trim());

  return dataLines.map((line) => {
    const cols = line.split(",");
    const row: any = {};
    headers.forEach((h, i) => {
      row[h] = (cols[i] ?? "").trim();
    });
    return row as VenueCsvRow;
  });
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  const ownerEmailFromEnv = process.env.OWNER_PROFILE_EMAIL; // 任意

  if (!url) {
    console.error("ERROR: NEXT_PUBLIC_SUPABASE_URL が環境変数にありません。");
    process.exit(1);
  }
  if (!secretKey) {
    console.error("ERROR: SUPABASE_SECRET_KEY が環境変数にありません。");
    process.exit(1);
  }

  console.log("Supabase URL:", url);
  const supabase = createClient(url, secretKey);

  // CSV 読み込み
  const csvPath = path.join(process.cwd(), "data", "venues.csv");
  if (!fs.existsSync(csvPath)) {
    console.error(`ERROR: CSV ファイルが見つかりません: ${csvPath}`);
    process.exit(1);
  }

  const csvText = fs.readFileSync(csvPath, "utf8");
  const rows = parseCsv(csvText);

  if (rows.length === 0) {
    console.error("ERROR: venues.csv にデータ行がありません。");
    process.exit(1);
  }

  console.log(`CSV 行数: ${rows.length}`);

  // venues テーブル用の payload にマッピング
  const payload = rows.map((r) => {
    // capacity
    const capacity =
      r.capacity && r.capacity.trim() !== "" ? Number(r.capacity) : null;
    if (capacity !== null && Number.isNaN(capacity)) {
      console.warn(
        `WARN: capacity が数値に変換できませんでした: "${r.capacity}" → null`,
      );
    }

    // has_pa (文字列 → boolean)
    const hasPa =
      typeof r.has_pa === "string" && r.has_pa.trim() !== ""
        ? ["1", "true", "TRUE", "yes", "YES", "y"].includes(
            r.has_pa.trim(),
          )
        : null;

    // 緯度経度
    const latitude =
      r.latitude && r.latitude.trim() !== ""
        ? Number(r.latitude)
        : null;
    const longitude =
      r.longitude && r.longitude.trim() !== ""
        ? Number(r.longitude)
        : null;

    if (latitude !== null && Number.isNaN(latitude)) {
      console.warn(
        `WARN: latitude が数値に変換できませんでした: "${r.latitude}" → null`,
      );
    }
    if (longitude !== null && Number.isNaN(longitude)) {
      console.warn(
        `WARN: longitude が数値に変換できませんでした: "${r.longitude}" → null`,
      );
    }

    return {
      // 必須
      name: r.name,
      // 任意
      address: r.address || null,
      capacity: Number.isNaN(capacity) ? null : capacity,
      volume_preference: r.volume_preference || null, // enum volume_level
      has_pa: hasPa,
      photo_url: r.photo_url || null,
      short_name: r.short_name || null,
      city: r.city || null,
      prefecture: r.prefecture || null,
      url: r.url || null,
      notes: r.notes || null,
      latitude: Number.isNaN(latitude) ? null : latitude,
      longitude: Number.isNaN(longitude) ? null : longitude,
      // id は venues.id の DEFAULT gen_random_uuid() に任せる
    };
  });

  console.log("Insert payload sample:", payload[0]);

  // 既存 venues を消してから入れたい場合はこれを有効化
  // console.log("Deleting all existing venues...");
  // const { error: delError } = await supabase.from("venues").delete().neq("id", "");
  // if (delError) {
  //   console.error("Delete venues error:", delError);
  //   process.exit(1);
  // }

  console.log(`Inserting ${payload.length} venues...`);

  // insert した venues の id を取得
  const { data: insertedVenues, error: insertError } = await supabase
    .from("venues")
    .insert(payload)
    .select("id");

  if (insertError) {
    console.error("Insert venues error:", insertError);
    process.exit(1);
  }

  if (!insertedVenues || insertedVenues.length === 0) {
    console.error("ERROR: venues の挿入に成功しましたが、返却データが空です。");
    process.exit(1);
  }

  console.log(`✅ venues を ${insertedVenues.length} 件挿入しました。`);

  // ===== venue_admins を作成する =====

  // 1. owner_profile_id を決める
  let ownerProfileId: string | null = null;

  if (ownerEmailFromEnv) {
    console.log("OWNER_PROFILE_EMAIL:", ownerEmailFromEnv);
    const { data: profileByEmail, error: profileByEmailError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", ownerEmailFromEnv)
      .single();

    if (profileByEmailError) {
      console.error(
        "ERROR: OWNER_PROFILE_EMAIL で profiles が見つかりませんでした:",
        profileByEmailError,
      );
      process.exit(1);
    }

    ownerProfileId = profileByEmail.id as string;
    console.log("venue_admins の owner_profile_id:", ownerProfileId);
  } else {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id")
      .limit(1);

    if (profilesError) {
      console.error("profiles 読み込みエラー:", profilesError);
      process.exit(1);
    }
    if (!profiles || profiles.length === 0) {
      console.error(
        "ERROR: profiles が1件もありません。少なくとも1つプロフィールを作成してください。",
      );
      process.exit(1);
    }

    ownerProfileId = profiles[0].id as string;
    console.log(
      "OWNER_PROFILE_EMAIL が未指定のため、profiles の先頭を owner_profile_id に利用します:",
      ownerProfileId,
    );
  }

  // 2. venue_admins に一括 INSERT
  const adminsPayload = insertedVenues.map((v: any) => ({
    venue_id: v.id as string,
    profile_id: ownerProfileId!,
    role: "owner",
  }));

  console.log(
    `Inserting ${adminsPayload.length} venue_admins for profile_id=${ownerProfileId}`,
  );

  const { error: adminsError } = await supabase
    .from("venue_admins")
    .insert(adminsPayload);

  if (adminsError) {
    console.error("Insert venue_admins error:", adminsError);
    process.exit(1);
  }

  console.log("✅ venue_admins の seed も完了しました。");
}

main().catch((e) => {
  console.error("Unexpected error:", e);
  process.exit(1);
});
