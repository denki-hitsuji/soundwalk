// lib/api/publicLives.ts
import { NextResponse } from "next/server";
import { getPublicActLivesDb } from "@/lib/db/publicLives";
import { checkRateLimit } from "@/lib/utils/rateLimit";
import { toYmdLocal } from "@/lib/utils/date";

const RATE_LIMIT = { limit: 60, windowMs: 60_000 };

export async function getPublicActLives(slug: string) {
  return getPublicActLivesDb(slug, toYmdLocal());
}

function clientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return "unknown";
}

/**
 * `GET /api/public/bands/{slug}/lives` の実処理。
 * route.ts からはこの関数を呼ぶだけにする（CLAUDE.md: /app配下にDB接続コード禁止）。
 */
export async function handlePublicActLivesRequest(
  request: Request,
  slug: string
): Promise<NextResponse> {
  const rateLimit = checkRateLimit(`public-lives:${clientIp(request)}`, RATE_LIMIT);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too Many Requests" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  let result;
  try {
    result = await getPublicActLives(slug);
  } catch (error) {
    console.error("getPublicActLives failed", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }

  if (!result) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  return NextResponse.json(result, {
    status: 200,
    headers: { "Cache-Control": "public, max-age=300" },
  });
}
