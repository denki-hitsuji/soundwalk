import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RehearsalsClient from "../../app/musician/rehearsals/RehearsalsClient";
import type { RehearsalRow } from "../../lib/utils/rehearsals";
import type { ActRow } from "../../lib/utils/acts";

const mockPush = jest.fn();
const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

jest.mock("../../lib/api/rehearsalsAction", () => ({
  addRehearsalAction: jest.fn().mockResolvedValue(undefined),
  deleteRehearsalAction: jest.fn().mockResolvedValue(undefined),
}));

const { addRehearsalAction, deleteRehearsalAction } = require("../../lib/api/rehearsalsAction");

const sampleActs: ActRow[] = [
  { id: "act-1", name: "テストバンド", act_type: "band", owner_profile_id: "user-1", is_temporary: false, description: null, icon_url: null, photo_url: null, profile_link_url: null },
];

const sampleRehearsals: RehearsalRow[] = [
  {
    id: "reh-1",
    act_id: "act-1",
    rehearsal_date: "2026-05-10",
    start_time: "13:00",
    end_time: "15:00",
    studio_name: "スタジオA",
    memo: null,
    performance_id: null,
    created_by_profile_id: "user-1",
    created_at: "2026-05-01T00:00:00Z",
  },
];

beforeEach(() => {
  jest.clearAllMocks();
});

describe("RehearsalsClient", () => {
  it("リハーサル一覧が表示される", () => {
    render(
      <RehearsalsClient
        rehearsals={sampleRehearsals}
        myActs={sampleActs}
        currentProfileId="user-1"
        initialActId={null}
      />
    );
    expect(screen.getByText("2026-05-10")).toBeInTheDocument();
    expect(screen.getByText("スタジオA")).toBeInTheDocument();
  });

  it("リハーサルが0件のとき「リハーサルはまだありません」が表示される", () => {
    render(
      <RehearsalsClient
        rehearsals={[]}
        myActs={sampleActs}
        currentProfileId="user-1"
        initialActId={null}
      />
    );
    expect(screen.getByText("リハーサルはまだありません。")).toBeInTheDocument();
  });

  it("自分が作成したリハーサルに削除ボタンが表示される", () => {
    render(
      <RehearsalsClient
        rehearsals={sampleRehearsals}
        myActs={sampleActs}
        currentProfileId="user-1"
        initialActId={null}
      />
    );
    expect(screen.getByRole("button", { name: "削除" })).toBeInTheDocument();
  });

  it("他人が作成したリハーサルには削除ボタンが表示されない", () => {
    render(
      <RehearsalsClient
        rehearsals={sampleRehearsals}
        myActs={sampleActs}
        currentProfileId="other-user"
        initialActId={null}
      />
    );
    expect(screen.queryByRole("button", { name: "削除" })).not.toBeInTheDocument();
  });

  it("日付入力後に追加ボタンが有効になり、送信でaddRehearsalActionが呼ばれる", async () => {
    render(
      <RehearsalsClient
        rehearsals={[]}
        myActs={sampleActs}
        currentProfileId="user-1"
        initialActId="act-1"
      />
    );
    const user = userEvent.setup();

    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    await user.type(dateInput, "2026-06-01");

    const submitButton = screen.getByRole("button", { name: "追加" });
    await user.click(submitButton);

    await waitFor(() => {
      expect(addRehearsalAction).toHaveBeenCalledWith(
        expect.objectContaining({
          act_id: "act-1",
          rehearsal_date: "2026-06-01",
        })
      );
    });
  });
});
