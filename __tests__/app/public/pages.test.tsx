import { render, screen } from "@testing-library/react";
import Home, { metadata as homeMetadata } from "@/app/page";
import PrivacyPage, { metadata as privacyMetadata } from "@/app/privacy/page";
import TermsPage, { metadata as termsMetadata } from "@/app/terms/page";
import { operator } from "@/lib/public/operator";

// 認証フックやサーバー認証が混入すると、OAuth審査の未ログイン閲覧を壊す。
jest.mock("next/navigation", () => ({
  useRouter: () => { throw new Error("Public information must not redirect"); },
  redirect: () => { throw new Error("Public information must not redirect"); },
}));
jest.mock("@/lib/auth/session.server", () => ({ getCurrentUser: () => { throw new Error("Public information must not require authentication"); } }));

it.each([
  [Home, /次のライブを/, homeMetadata, "https://soundwalk.net/"],
  [PrivacyPage, "プライバシーポリシー", privacyMetadata, "https://soundwalk.net/privacy"],
  [TermsPage, "利用規約", termsMetadata, "https://soundwalk.net/terms"],
] as const)("renders a public page with canonical URL and policy navigation", (Page, heading, metadata, canonical) => {
  render(<Page />);
  expect(screen.getByRole("heading", { level: 1, name: heading })).toBeInTheDocument();
  expect(screen.getAllByRole("link", { name: "プライバシーポリシー" })[0]).toHaveAttribute("href", "/privacy");
  expect(screen.getAllByRole("link", { name: "利用規約" })[0]).toHaveAttribute("href", "/terms");
  expect(metadata.alternates?.canonical).toBe(canonical);
});

it("explains calendar access, Limited Use, revocation and deletion", () => {
  render(<PrivacyPage />);
  expect(screen.getByText(/「ライブ」を含まない予定も一時的に処理/)).toBeInTheDocument();
  expect(screen.getByText(/sessionStorage/)).toBeInTheDocument();
  expect(screen.getByText(/Limited Use/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Googleアカウントの接続管理画面" })).toHaveAttribute("href", "https://myaccount.google.com/connections");
  expect(screen.getByText(/アカウント全体の削除/)).toBeInTheDocument();
});

it.each([PrivacyPage, TermsPage])("publishes the same operator contact on both policies", Page => {
  expect(operator.name).not.toBe("");
  expect(operator.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  render(<Page />);
  expect(screen.getByRole("link", { name: operator.email })).toHaveAttribute("href", `mailto:${operator.email}`);
});
