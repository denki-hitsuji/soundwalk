// lib/supabase/service.ts
import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * RLSをバイパスする service role クライアント。
 * 公開APIなど「ユーザーセッションを持たずに横断的にデータを読む」用途専用。
 * 呼び出し側で公開範囲（is_public 等）を必ず明示的にフィルタすること。
 */
export function createSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error("Supabase secret key の環境変数（SUPABASE_SECRET_KEY）が設定されていません");
  }

  return createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
