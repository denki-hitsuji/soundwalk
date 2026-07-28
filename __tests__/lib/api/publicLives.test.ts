/** @jest-environment node */

jest.mock("server-only", () => ({}));

const mockGetPublicActLivesDb = jest.fn();

jest.mock("@/lib/db/publicLives", () => ({
  getPublicActLivesDb: (...args: unknown[]) => mockGetPublicActLivesDb(...args),
}));

import { handlePublicActLivesRequest } from "@/lib/api/publicLives";
import { __resetRateLimitForTests } from "@/lib/utils/rateLimit";

function makeRequest(ip = "203.0.113.1") {
  return new Request("https://soundwalk.test/api/public/bands/the-holidays/lives", {
    headers: { "x-forwarded-for": ip },
  });
}

describe("handlePublicActLivesRequest", () => {
  beforeEach(() => {
    mockGetPublicActLivesDb.mockReset();
    __resetRateLimitForTests();
  });

  it("公開アクトが見つかれば200・Cache-Control付きでJSONを返す", async () => {
    const payload = {
      artist: { name: "ザ・ホリデイズ", slug: "the-holidays", photo_url: null, profile_link_url: null },
      events: [],
    };
    mockGetPublicActLivesDb.mockResolvedValue(payload);

    const response = await handlePublicActLivesRequest(makeRequest(), "the-holidays");

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=300");
    await expect(response.json()).resolves.toEqual(payload);
  });

  it("存在しない/非公開 slug は404を返す", async () => {
    mockGetPublicActLivesDb.mockResolvedValue(null);

    const response = await handlePublicActLivesRequest(makeRequest("203.0.113.2"), "unknown");

    expect(response.status).toBe(404);
  });

  it("DB層がエラーを投げたら500を返す", async () => {
    mockGetPublicActLivesDb.mockRejectedValue(new Error("boom"));
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const response = await handlePublicActLivesRequest(makeRequest("203.0.113.3"), "the-holidays");

    expect(response.status).toBe(500);
    consoleSpy.mockRestore();
  });

  it("同一IPからのリクエストが上限を超えたら429とRetry-Afterを返す", async () => {
    mockGetPublicActLivesDb.mockResolvedValue(null);
    const ip = "203.0.113.9";

    for (let i = 0; i < 60; i++) {
      const response = await handlePublicActLivesRequest(makeRequest(ip), "the-holidays");
      expect(response.status).toBe(404);
    }

    const blocked = await handlePublicActLivesRequest(makeRequest(ip), "the-holidays");

    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).not.toBeNull();
  });
});
