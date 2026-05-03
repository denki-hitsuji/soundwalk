import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NewPerformanceClient from "../../app/musician/performances/new/NewPerformanceClient";

// next/navigation モック
const mockPush = jest.fn();
const mockSearchParamsGet = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: mockSearchParamsGet }),
}));

// Server Action モック
jest.mock("../../lib/api/performancesAction", () => ({
  upsertPerformance: jest.fn().mockResolvedValue({}),
}));

const { upsertPerformance } = require("../../lib/api/performancesAction");

const sampleActs = [
  { id: "act-1", name: "テストバンド", act_type: "band", owner_profile_id: "user-1" } as any,
];

function setupSearchParams(params: Record<string, string | null>) {
  mockSearchParamsGet.mockImplementation((key: string) => params[key] ?? null);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("NewPerformanceClient – returnTo リダイレクト", () => {
  it("returnTo がある場合、保存後にそのURLへ遷移する", async () => {
    setupSearchParams({
      returnTo: "/musician/acts/act-123",
      actId: "act-1",
      date: null,
      venue: null,
    });

    render(<NewPerformanceClient userId="user-1" myActs={sampleActs} />);

    // 日付とactを設定して保存ボタンを有効にする
    const dateInput = screen.getByDisplayValue(/\d{4}-\d{2}-\d{2}/);
    await userEvent.clear(dateInput);
    await userEvent.type(dateInput, "2026-06-01");

    const select = screen.getByRole("combobox");
    await userEvent.selectOptions(select, "act-1");

    const saveButton = screen.getByRole("button", { name: "このライブを記録する" });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(upsertPerformance).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/musician/acts/act-123");
    });
  });

  it("returnTo がない場合、保存後に /musician/performances へ遷移する", async () => {
    setupSearchParams({
      returnTo: null,
      actId: "act-1",
      date: null,
      venue: null,
    });

    render(<NewPerformanceClient userId="user-1" myActs={sampleActs} />);

    const dateInput = screen.getByDisplayValue(/\d{4}-\d{2}-\d{2}/);
    await userEvent.clear(dateInput);
    await userEvent.type(dateInput, "2026-06-01");

    const select = screen.getByRole("combobox");
    await userEvent.selectOptions(select, "act-1");

    const saveButton = screen.getByRole("button", { name: "このライブを記録する" });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(upsertPerformance).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/musician/performances");
    });
  });

  it("actId クエリパラメータで名義が初期選択される", () => {
    setupSearchParams({ actId: "act-1", returnTo: null, date: null, venue: null });

    render(<NewPerformanceClient userId="user-1" myActs={sampleActs} />);

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("act-1");
  });

  it("保存ボタンは日付と名義が未入力のとき無効", () => {
    setupSearchParams({ actId: null, returnTo: null, date: null, venue: null });

    render(<NewPerformanceClient userId="user-1" myActs={sampleActs} />);

    expect(screen.getByRole("button", { name: "このライブを記録する" })).toBeDisabled();
  });
});
