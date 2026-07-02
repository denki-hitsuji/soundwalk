/** @jest-environment node */

jest.mock("server-only", () => ({}));
jest.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: jest.fn(),
}));

import { handleOAuthCallback } from "@/lib/auth/callback";
import { createSupabaseServerClient as mockedCreateServerClient } from "@/lib/supabase/server";

const exchangeCodeForSession = jest.fn();
const createSupabaseServerClient = mockedCreateServerClient as jest.Mock;

describe("handleOAuthCallback", () => {
  beforeEach(() => {
    exchangeCodeForSession.mockReset();
    createSupabaseServerClient.mockReset();
    createSupabaseServerClient.mockResolvedValue({
      auth: { exchangeCodeForSession },
    });
  });

  it("redirects to login when code is missing", async () => {
    const response = await handleOAuthCallback(
      new Request("https://soundwalk.test/auth/callback?next=%2Finvites%2Fabc")
    );

    expect(response.headers.get("location")).toBe(
      "https://soundwalk.test/login?error=oauth"
    );
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("redirects to login when code exchange fails", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: new Error("bad code") });

    const response = await handleOAuthCallback(
      new Request("https://soundwalk.test/auth/callback?code=bad")
    );

    expect(response.headers.get("location")).toBe(
      "https://soundwalk.test/login?error=oauth"
    );
  });

  it("redirects to the requested internal path after exchange", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });

    const response = await handleOAuthCallback(
      new Request("https://soundwalk.test/auth/callback?code=good&next=%2Finvites%2Fabc")
    );

    expect(exchangeCodeForSession).toHaveBeenCalledWith("good");
    expect(response.headers.get("location")).toBe(
      "https://soundwalk.test/invites/abc"
    );
  });
});
