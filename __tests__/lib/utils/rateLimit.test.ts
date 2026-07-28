import { checkRateLimit, __resetRateLimitForTests } from "@/lib/utils/rateLimit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    __resetRateLimitForTests();
  });

  it("上限未満のリクエストは許可する", () => {
    const result = checkRateLimit("k1", { limit: 2, windowMs: 1000 }, 0);
    expect(result.allowed).toBe(true);
    expect(result.retryAfterSeconds).toBe(0);
  });

  it("同一ウィンドウ内で上限を超えたら拒否する", () => {
    checkRateLimit("k2", { limit: 2, windowMs: 1000 }, 0);
    checkRateLimit("k2", { limit: 2, windowMs: 1000 }, 100);
    const blocked = checkRateLimit("k2", { limit: 2, windowMs: 1000 }, 200);

    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("ウィンドウ経過後はカウントがリセットされる", () => {
    checkRateLimit("k3", { limit: 1, windowMs: 1000 }, 0);
    const afterWindow = checkRateLimit("k3", { limit: 1, windowMs: 1000 }, 1500);

    expect(afterWindow.allowed).toBe(true);
  });

  it("キーが異なれば独立してカウントする", () => {
    checkRateLimit("k4a", { limit: 1, windowMs: 1000 }, 0);
    const other = checkRateLimit("k4b", { limit: 1, windowMs: 1000 }, 0);

    expect(other.allowed).toBe(true);
  });
});
