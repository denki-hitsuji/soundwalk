import React from "react";

const mockRedirect = jest.fn();
const mockGetCurrentUser = jest.fn();
const mockGetPerformancesInRangeDb = jest.fn();
const mockGetMyActs = jest.fn();

jest.mock("next/navigation", () => ({
  redirect: (...args: any[]) => mockRedirect(...args),
}));

jest.mock("../../lib/auth/session.server", () => ({
  getCurrentUser: (...args: any[]) => mockGetCurrentUser(...args),
}));

jest.mock("../../lib/db/performances", () => ({
  getPerformancesInRangeDb: (...args: any[]) =>
    mockGetPerformancesInRangeDb(...args),
}));

jest.mock("../../lib/api/acts", () => ({
  getMyActs: (...args: any[]) => mockGetMyActs(...args),
}));

jest.mock("../../app/musician/calendar/CalendarClient", () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="calendar-client" data-props={JSON.stringify(props)} />,
}));

// モック設定後にインポート
import CalendarPage from "../../app/musician/calendar/page";

beforeEach(() => {
  jest.clearAllMocks();
  mockGetCurrentUser.mockResolvedValue({ id: "user-1" });
  mockGetPerformancesInRangeDb.mockResolvedValue([]);
  mockGetMyActs.mockResolvedValue([]);
});

describe("CalendarPage – searchParams によるDB範囲取得", () => {
  it("?month=2026-05 のとき、5月1日〜31日の範囲でDBを検索する", async () => {
    const element = await CalendarPage({
      searchParams: Promise.resolve({ month: "2026-05" }),
    });

    expect(mockGetPerformancesInRangeDb).toHaveBeenCalledWith({
      startDate: "2026-05-01",
      endDate: "2026-05-31",
    });
  });

  it("?month=2026-02 のとき、2月1日〜28日の範囲でDBを検索する（うるう年なし）", async () => {
    await CalendarPage({
      searchParams: Promise.resolve({ month: "2026-02" }),
    });

    expect(mockGetPerformancesInRangeDb).toHaveBeenCalledWith({
      startDate: "2026-02-01",
      endDate: "2026-02-28",
    });
  });

  it("?month=2024-02 のとき、2月1日〜29日の範囲でDBを検索する（うるう年）", async () => {
    await CalendarPage({
      searchParams: Promise.resolve({ month: "2024-02" }),
    });

    expect(mockGetPerformancesInRangeDb).toHaveBeenCalledWith({
      startDate: "2024-02-01",
      endDate: "2024-02-29",
    });
  });

  it("?month=2025-12 のとき、12月1日〜31日の範囲でDBを検索する", async () => {
    await CalendarPage({
      searchParams: Promise.resolve({ month: "2025-12" }),
    });

    expect(mockGetPerformancesInRangeDb).toHaveBeenCalledWith({
      startDate: "2025-12-01",
      endDate: "2025-12-31",
    });
  });

  it("month パラメータなしのとき、今月の範囲でDBを検索する", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-05-04T00:00:00Z"));

    try {
      await CalendarPage({
        searchParams: Promise.resolve({}),
      });

      const call = mockGetPerformancesInRangeDb.mock.calls[0][0];
      expect(call.startDate).toMatch(/^\d{4}-\d{2}-01$/);
      expect(call.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe("CalendarPage – initialMonth プロパティ", () => {
  it("?month=2026-05 のとき initialMonth='2026-05' が CalendarClient に渡される", async () => {
    const element = await CalendarPage({
      searchParams: Promise.resolve({ month: "2026-05" }),
    });

    const el = element as React.ReactElement<any>;
    expect(el.props.initialMonth).toBe("2026-05");
  });

  it("?month=2026-02 のとき initialMonth='2026-02' が CalendarClient に渡される", async () => {
    const element = await CalendarPage({
      searchParams: Promise.resolve({ month: "2026-02" }),
    });

    const el = element as React.ReactElement<any>;
    expect(el.props.initialMonth).toBe("2026-02");
  });
});

describe("CalendarPage – 未認証", () => {
  it("ユーザーが未認証の場合、/login にリダイレクトする", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    try {
      await CalendarPage({
        searchParams: Promise.resolve({ month: "2026-05" }),
      });
    } catch {
      // redirect() は例外を投げることがある
    }

    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });
});
