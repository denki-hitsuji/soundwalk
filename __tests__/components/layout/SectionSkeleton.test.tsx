import { render } from "@testing-library/react";
import SectionSkeleton from "@/components/layout/SectionSkeleton";

describe("SectionSkeleton", () => {
  it("スケルトンのプレースホルダーを表示する", () => {
    render(<SectionSkeleton />);

    expect(document.querySelectorAll(".animate-pulse")).toHaveLength(2);
  });
});
