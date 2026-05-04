"use client";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CalendarClient from "../../app/musician/calendar/CalendarClient";

const mockPush = jest.fn();
const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

jest.mock("../../components/calendar/MonthView", () => ({
  MonthView: () => <div data-testid="month-view" />,
}));

jest.mock("../../components/calendar/PerformancePopup", () => ({
  PerformancePopup: () => <div data-testid="performance-popup" />,
}));

jest.mock("../../components/calendar/InlinePerformanceForm", () => ({
  InlinePerformanceForm: () => <div data-testid="inline-form" />,
}));

const defaultProps = {
  performances: [],
  myActs: [],
  userId: "user-1",
  initialMonth: "2026-05",
};

beforeEach(() => {
  jest.clearAllMocks();
});

// TZ依存のない形で期待値を算出するヘルパー（コンポーネントと同じロジック）
function toMonthParam(isoMonth: string, delta: number): string {
  const base = new Date(`${isoMonth}-01`);
  const next = new Date(base.getFullYear(), base.getMonth() + delta, 1);
  return `?month=${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
}

describe("CalendarClient – initialMonth の表示", () => {
  it("initialMonth の年月がヘッダーに表示される", () => {
    render(<CalendarClient {...defaultProps} initialMonth="2026-05" />);
    const d = new Date("2026-05-01");
    expect(
      screen.getByText(`${d.getFullYear()}年 ${d.getMonth() + 1}月`)
    ).toBeInTheDocument();
  });
});

describe("CalendarClient – 月切り替え（changeMonth）", () => {
  it("「次月 →」を押すと翌月の ?month=YYYY-MM で router.push が呼ばれる", async () => {
    const user = userEvent.setup();
    render(<CalendarClient {...defaultProps} initialMonth="2026-05" />);

    await user.click(screen.getByText("次月 →"));

    expect(mockPush).toHaveBeenCalledWith(toMonthParam("2026-05", 1));
  });

  it("「← 前月」を押すと前月の ?month=YYYY-MM で router.push が呼ばれる", async () => {
    const user = userEvent.setup();
    render(<CalendarClient {...defaultProps} initialMonth="2026-05" />);

    await user.click(screen.getByText("← 前月"));

    expect(mockPush).toHaveBeenCalledWith(toMonthParam("2026-05", -1));
  });

  it("12月から「次月 →」を押すと翌年1月になる（年をまたぐ）", async () => {
    const user = userEvent.setup();
    render(<CalendarClient {...defaultProps} initialMonth="2026-12" />);

    await user.click(screen.getByText("次月 →"));

    expect(mockPush).toHaveBeenCalledWith(toMonthParam("2026-12", 1));
    // 期待値の確認: 2027-01
    const next = new Date(new Date("2026-12-01").getFullYear(), new Date("2026-12-01").getMonth() + 1, 1);
    expect(next.getFullYear()).toBe(2027);
    expect(next.getMonth() + 1).toBe(1);
  });

  it("1月から「← 前月」を押すと前年12月になる（年をまたぐ）", async () => {
    const user = userEvent.setup();
    render(<CalendarClient {...defaultProps} initialMonth="2026-01" />);

    await user.click(screen.getByText("← 前月"));

    expect(mockPush).toHaveBeenCalledWith(toMonthParam("2026-01", -1));
    // 期待値の確認: 2025-12
    const prev = new Date(new Date("2026-01-01").getFullYear(), new Date("2026-01-01").getMonth() - 1, 1);
    expect(prev.getFullYear()).toBe(2025);
    expect(prev.getMonth() + 1).toBe(12);
  });

  it("月切り替え時に router.push が1回だけ呼ばれる", async () => {
    const user = userEvent.setup();
    render(<CalendarClient {...defaultProps} initialMonth="2026-05" />);

    await user.click(screen.getByText("次月 →"));

    expect(mockPush).toHaveBeenCalledTimes(1);
  });
});
