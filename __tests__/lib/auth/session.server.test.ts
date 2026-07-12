const mockGetUser = jest.fn();
const mockCreateSupabaseServerClient = jest.fn();

jest.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: (...args: unknown[]) => mockCreateSupabaseServerClient(...args),
}));

import { getCurrentUser } from "@/lib/auth/session.server";

describe("getCurrentUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateSupabaseServerClient.mockResolvedValue({ auth: { getUser: mockGetUser } });
  });

  it("Supabase のユーザーを返す", async () => {
    const user = { id: "user-1" };
    mockGetUser.mockResolvedValue({ data: { user }, error: null });

    await expect(getCurrentUser()).resolves.toEqual(user);
    expect(mockGetUser).toHaveBeenCalledTimes(1);
  });

  it("認証エラー時は null を返す", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("auth failed") });

    await expect(getCurrentUser()).resolves.toBeNull();
  });
});
