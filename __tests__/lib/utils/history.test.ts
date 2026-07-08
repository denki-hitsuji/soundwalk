import { isCanceledStatus } from "@/lib/utils/history";

describe("isCanceledStatus", () => {
  test.each(["canceled", "cancelled", "CANCELLED", "Canceled"])(
    "returns true for %s",
    (status) => {
      expect(isCanceledStatus(status)).toBe(true);
    },
  );

  test.each([null, undefined, "", "confirmed"])("returns false for %s", (status) => {
    expect(isCanceledStatus(status)).toBe(false);
  });
});
