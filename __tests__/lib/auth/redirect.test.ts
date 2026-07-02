import { sanitizeNextPath } from "@/lib/auth/redirect";

describe("sanitizeNextPath", () => {
  it("accepts an internal absolute path", () => {
    expect(sanitizeNextPath("/foo")).toBe("/foo");
  });

  it.each(["https://evil.com", "//evil.com", null])(
    "uses the fallback for %p",
    (raw) => {
      expect(sanitizeNextPath(raw)).toBe("/musician");
      expect(sanitizeNextPath(raw, "/home")).toBe("/home");
    }
  );
});
