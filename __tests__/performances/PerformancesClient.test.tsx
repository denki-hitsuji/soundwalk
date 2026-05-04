import { render, screen, fireEvent } from "@testing-library/react";
import { PerformancesClient } from "../../app/musician/performances/PerformancesClient";

// 今日を 2026-05-05 に固定
jest.mock("../../lib/utils/date", () => {
  const real = jest.requireActual("../../lib/utils/date");
  return {
    ...real,
    toYmdLocal: (d?: Date) => {
      if (d) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      }
      return "2026-05-05";
    },
  };
});

jest.mock("../../lib/api/performancesAction", () => ({
  updatePrepTaskDone: jest.fn().mockResolvedValue({}),
}));

jest.mock("../../components/performances/PerformanceCard", () => ({
  PerformanceCard: ({ p }: { p: { id: string; event_date: string } }) => (
    <div data-testid={`card-${p.id}`}>{p.event_date}</div>
  ),
}));

jest.mock("../../components/share/SharePostPreview", () => ({
  SharePostPreview: () => <div />,
}));

jest.mock("../../lib/utils/buildSchedulePost", () => ({
  buildSchedulePost: () => "mock post",
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// 2026-05-05 が今日のとき、翌月末は 2026-06-30

let idSeq = 0;
function makePerf(overrides: Record<string, any> = {}) {
  idSeq++;
  return {
    id: `perf-${idSeq}`,
    event_date: "2026-05-10",
    status: "confirmed",
    venue_name: "テスト会場",
    event_title: null,
    open_time: null,
    start_time: null,
    memo: null,
    act_id: "act-1",
    acts: [],
    ...overrides,
  } as any;
}

const BASE_PROPS = {
  userId: "user-1",
  flyerByPerformanceId: {},
  detailsByPerformanceId: {},
  prep: {},
  profileName: "テストUser",
};

beforeEach(() => {
  idSeq = 0;
});

describe("PerformancesClient – セクション分離", () => {
  it("要対応(offered)は翌月以降でも常に表示される", () => {
    const offeredFar = makePerf({ status: "offered", event_date: "2026-09-01" });
    render(<PerformancesClient {...BASE_PROPS} performances={[offeredFar]} />);
    expect(screen.getByTestId(`card-${offeredFar.id}`)).toBeInTheDocument();
  });

  it("要対応(pending_reconfirm)は翌月以降でも常に表示される", () => {
    const p = makePerf({ status: "pending_reconfirm", event_date: "2026-10-15" });
    render(<PerformancesClient {...BASE_PROPS} performances={[p]} />);
    expect(screen.getByTestId(`card-${p.id}`)).toBeInTheDocument();
  });

  it("確定済みは翌月末(2026-06-30)以内なら初期表示される", () => {
    const p = makePerf({ status: "confirmed", event_date: "2026-06-30" });
    render(<PerformancesClient {...BASE_PROPS} performances={[p]} />);
    expect(screen.getByTestId(`card-${p.id}`)).toBeInTheDocument();
  });

  it("確定済みで翌月末を超える分は初期非表示になる", () => {
    const p = makePerf({ status: "confirmed", event_date: "2026-07-01" });
    render(<PerformancesClient {...BASE_PROPS} performances={[p]} />);
    expect(screen.queryByTestId(`card-${p.id}`)).not.toBeInTheDocument();
  });

  it("折りたたみボタンに非表示件数が表示される", () => {
    const hidden1 = makePerf({ status: "confirmed", event_date: "2026-07-01" });
    const hidden2 = makePerf({ status: "confirmed", event_date: "2026-08-01" });
    render(<PerformancesClient {...BASE_PROPS} performances={[hidden1, hidden2]} />);
    expect(screen.getByRole("button", { name: /先の予定をさらに 2 件表示/ })).toBeInTheDocument();
  });

  it("ボタンをクリックすると折りたたまれた予定が展開される", () => {
    const hidden = makePerf({ status: "confirmed", event_date: "2026-07-01" });
    render(<PerformancesClient {...BASE_PROPS} performances={[hidden]} />);

    fireEvent.click(screen.getByRole("button", { name: /先の予定をさらに/ }));

    expect(screen.getByTestId(`card-${hidden.id}`)).toBeInTheDocument();
  });

  it("展開後にもう一度クリックすると折りたたまれる", () => {
    const hidden = makePerf({ status: "confirmed", event_date: "2026-07-01" });
    render(<PerformancesClient {...BASE_PROPS} performances={[hidden]} />);

    const btn = screen.getByRole("button", { name: /先の予定をさらに/ });
    fireEvent.click(btn);
    expect(screen.getByTestId(`card-${hidden.id}`)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /折りたたむ/ }));
    expect(screen.queryByTestId(`card-${hidden.id}`)).not.toBeInTheDocument();
  });

  it("要対応と確定済みが混在するとき、両方のセクションラベルが表示される", () => {
    const offered = makePerf({ status: "offered", event_date: "2026-05-20" });
    const confirmed = makePerf({ status: "confirmed", event_date: "2026-06-01" });
    render(<PerformancesClient {...BASE_PROPS} performances={[offered, confirmed]} />);
    expect(screen.getByText("要対応")).toBeInTheDocument();
    expect(screen.getByText("確定済み")).toBeInTheDocument();
  });

  it("確定済みのみのとき「確定済み」ラベルは表示されない", () => {
    const p = makePerf({ status: "confirmed", event_date: "2026-06-01" });
    render(<PerformancesClient {...BASE_PROPS} performances={[p]} />);
    expect(screen.queryByText("確定済み")).not.toBeInTheDocument();
  });
});
