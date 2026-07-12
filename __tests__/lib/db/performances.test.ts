const mockGetCurrentUser = jest.fn();
const mockFrom = jest.fn();

jest.mock("@/lib/auth/session.server", () => ({
  getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
}));
jest.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: jest.fn(async () => ({ from: mockFrom })),
}));

import { getNextPerformanceServerDb } from "@/lib/db/performances";

describe("getNextPerformanceServerDb", () => {
  it("actIds が渡された場合は v_my_acts を再照会しない", async () => {
    const query = {
      select: jest.fn(),
      in: jest.fn(),
      gte: jest.fn(),
      neq: jest.fn(),
      order: jest.fn(),
      limit: jest.fn(),
      then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve({ data: [], error: null })),
    };
    for (const method of ["select", "in", "gte", "neq", "order", "limit"] as const) {
      query[method].mockReturnValue(query);
    }
    mockFrom.mockReturnValue(query);

    await expect(getNextPerformanceServerDb("2026-07-12", ["act-1"])).resolves.toBeNull();

    expect(mockFrom).toHaveBeenCalledWith("musician_performances");
    expect(mockFrom).not.toHaveBeenCalledWith("v_my_acts");
    expect(mockGetCurrentUser).not.toHaveBeenCalled();
  });
});
