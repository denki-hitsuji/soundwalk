import { formatRehearsalTime } from "../../lib/utils/rehearsals";
import type { RehearsalRow } from "../../lib/utils/rehearsals";

describe("formatRehearsalTime", () => {
  it("両方nullなら空文字を返す", () => {
    expect(formatRehearsalTime(null, null)).toBe("");
  });

  it("開始・終了両方あれば 'HH:MM〜HH:MM' を返す", () => {
    expect(formatRehearsalTime("13:00", "15:00")).toBe("13:00〜15:00");
  });

  it("開始のみなら 'HH:MM〜' を返す", () => {
    expect(formatRehearsalTime("13:00", null)).toBe("13:00〜");
  });

  it("終了のみなら '〜HH:MM' を返す", () => {
    expect(formatRehearsalTime(null, "15:00")).toBe("〜15:00");
  });
});

describe("RehearsalRow 型チェック", () => {
  it("必須フィールドを含むオブジェクトが型に適合する", () => {
    const row: RehearsalRow = {
      id: "uuid-1",
      act_id: "act-1",
      rehearsal_date: "2026-05-10",
      start_time: "13:00",
      end_time: "15:00",
      studio_name: "スタジオA",
      memo: "練習メモ",
      performance_id: null,
      created_by_profile_id: "profile-1",
      created_at: "2026-05-01T00:00:00Z",
    };
    expect(row.rehearsal_date).toBe("2026-05-10");
    expect(row.performance_id).toBeNull();
  });
});
