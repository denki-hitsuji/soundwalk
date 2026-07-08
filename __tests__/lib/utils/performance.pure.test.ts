import {
  detailsSummary,
  normalizeAct,
  padTimeHHMM,
  statusText,
  toPerformanceWithActsPlain,
} from "@/lib/utils/performance";
import { parseYmdLocal } from "@/lib/utils/date";

describe("performance pure utilities", () => {
  test("padTimeHHMM shortens a database time", () => {
    expect(padTimeHHMM("19:30:00")).toBe("19:30");
    expect(padTimeHHMM(null)).toBeNull();
  });

  test.each([
    ["2026-07-01", "期限超過"],
    ["2026-07-03", "今日"],
    ["2026-07-06", "あと3日"],
  ])("statusText(%s)", (target, expected) => {
    expect(statusText(parseYmdLocal(target), parseYmdLocal("2026-07-03"))).toBe(expected);
  });

  test("detailsSummary reports missing details", () => {
    expect(detailsSummary(null, null)).toBe("未登録（開場/開演/チャージ）");
  });

  test("detailsSummary rejects mismatched performance IDs", () => {
    expect(() =>
      detailsSummary({ performance_id: "x" } as any, { id: "y" } as any),
    ).toThrow("ライブと詳細のIDが相違しています。");
  });

  test("detailsSummary combines registered details", () => {
    const performance = {
      id: "p1",
      open_time: "18:30:00",
      start_time: "19:00:00",
    } as any;
    const details = {
      performance_id: "p1",
      load_in_time: null,
      set_start_time: "19:30:00",
      set_end_time: null,
      set_minutes: 30,
      customer_charge_yen: 2000,
      one_drink_required: true,
    };

    expect(detailsSummary(details, performance)).toBe(
      "開場 18:30 / 開演 19:00 / 出演 19:30 / 30分 / ¥2,000 / 1Dあり",
    );
  });

  test.each([
    [{ acts: [{ id: "a1", name: "A" }, { id: "a2", name: "B" }] }, "a1"],
    [{ acts: { id: "a1", name: "A" } }, "a1"],
    [{ acts: null }, null],
  ])("normalizeAct normalizes joined acts", (performance, expectedId) => {
    expect(normalizeAct(performance as any)?.id ?? null).toBe(expectedId);
  });

  test("toPerformanceWithActsPlain normalizes an acts array", () => {
    const result = toPerformanceWithActsPlain({
      id: 1,
      event_date: "2026-01-01",
      profile_id: "u1",
      acts: [{ id: "a1", name: "A" }],
    });

    expect(result.id).toBe("1");
    expect(Array.isArray(result.acts)).toBe(true);
    expect((result.acts as any[])[0].name).toBe("A");
  });

  test("toPerformanceWithActsPlain preserves a single joined act", () => {
    const result = toPerformanceWithActsPlain({
      id: 1,
      event_date: "2026-01-01",
      profile_id: "u1",
      acts: { id: "a1", name: "A" },
    });

    expect(Array.isArray(result.acts)).toBe(false);
    expect((result.acts as any).name).toBe("A");
  });

  test("toPerformanceWithActsPlain preserves null acts", () => {
    const result = toPerformanceWithActsPlain({
      id: 1,
      event_date: "2026-01-01",
      profile_id: "u1",
      acts: null,
    });

    expect(result.acts).toBeNull();
  });
});
