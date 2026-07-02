import { handleOAuthCallback } from "@/lib/auth/callback";

export async function GET(request: Request) {
  return handleOAuthCallback(request);
}
