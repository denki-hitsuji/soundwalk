import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef } from "react";
import { act } from "react";
import {
  PersonalPerformanceCoreEditor,
  type PersonalPerformanceCoreEditorHandle,
} from "../../components/PersonalPerformanceCoreEditor";

const mockRpc = jest.fn();

jest.mock("../../lib/supabase/client", () => ({
  supabase: {
    rpc: (...args: any[]) => mockRpc(...args),
  },
}));

const defaultProps = {
  performanceId: "perf-1",
  eventDate: "2026-05-10",
  venueId: null,
  venueName: "テストライブハウス",
  venues: [{ id: "venue-1", name: "CLUB QUATTRO" }],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockRpc.mockResolvedValue({ data: null, error: null });
});

describe("PersonalPerformanceCoreEditor", () => {
  it("初期値がフォームに表示される", () => {
    render(<PersonalPerformanceCoreEditor {...defaultProps} />);
    const dateInput = screen.getByDisplayValue("2026-05-10");
    expect(dateInput).toBeInTheDocument();
    expect(screen.getByDisplayValue("テストライブハウス")).toBeInTheDocument();
  });

  it("日付を変更してsave()するとRPCが呼ばれ新しい日付が返る", async () => {
    function Wrapper() {
      const ref = useRef<PersonalPerformanceCoreEditorHandle>(null);
      return (
        <>
          <PersonalPerformanceCoreEditor ref={ref} {...defaultProps} />
          <button
            onClick={async () => {
              const result = await ref.current!.save();
              (window as any).__saveResult = result;
            }}
          >
            テスト保存
          </button>
        </>
      );
    }

    render(<Wrapper />);

    const dateInput = screen.getByDisplayValue("2026-05-10");
    await userEvent.clear(dateInput);
    await userEvent.type(dateInput, "2026-06-15");

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "テスト保存" }));
    });

    expect(mockRpc).toHaveBeenCalledWith("update_personal_performance_core", {
      p_performance_id: "perf-1",
      p_event_date: "2026-06-15",
      p_venue_id: null,
      p_venue_name: "テストライブハウス",
    });
    expect((window as any).__saveResult.eventDate).toBe("2026-06-15");
  });

  it("候補会場を選択するとvenueIdが保存される", async () => {
    function Wrapper() {
      const ref = useRef<PersonalPerformanceCoreEditorHandle>(null);
      return (
        <>
          <PersonalPerformanceCoreEditor ref={ref} {...defaultProps} />
          <button onClick={() => ref.current!.save()}>テスト保存</button>
        </>
      );
    }

    render(<Wrapper />);

    await userEvent.selectOptions(screen.getByRole("combobox"), "venue-1");

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "テスト保存" }));
    });

    expect(mockRpc).toHaveBeenCalledWith("update_personal_performance_core", {
      p_performance_id: "perf-1",
      p_event_date: "2026-05-10",
      p_venue_id: "venue-1",
      p_venue_name: null,
    });
  });

  it("RPCがエラーを返すとsave()がエラーをthrowする", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "DB error" } });

    function Wrapper() {
      const ref = useRef<PersonalPerformanceCoreEditorHandle>(null);
      return (
        <>
          <PersonalPerformanceCoreEditor ref={ref} {...defaultProps} />
          <button
            onClick={async () => {
              try {
                await ref.current!.save();
              } catch (e: any) {
                (window as any).__errorMessage = e.message;
              }
            }}
          >
            テスト保存
          </button>
        </>
      );
    }

    render(<Wrapper />);

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "テスト保存" }));
    });

    expect((window as any).__errorMessage).toBe("DB error");
  });
});
