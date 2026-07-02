jest.mock("@/lib/supabase/client", () => ({
  supabase: { auth: { signInWithOAuth: jest.fn() } },
}));

import { signInWithGoogle } from "@/lib/auth/oauth.client";
import { supabase } from "@/lib/supabase/client";

const signInWithOAuth = supabase.auth.signInWithOAuth as jest.Mock;

describe("signInWithGoogle", () => {
  beforeEach(() => signInWithOAuth.mockReset());

  it("starts Google OAuth with a sanitized encoded next path", async () => {
    signInWithOAuth.mockResolvedValue({ data: {}, error: null });

    await signInWithGoogle("/invites/a token?tab=1");

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo:
          "http://localhost/auth/callback?next=%2Finvites%2Fa%20token%3Ftab%3D1",
        queryParams: { prompt: "select_account" },
      },
    });
  });
});
