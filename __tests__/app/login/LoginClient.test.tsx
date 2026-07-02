import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import LoginClient from "@/app/(public)/login/LoginClient";

jest.mock("@/lib/auth/oauth.client", () => ({ signInWithGoogle: jest.fn() }));
jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("next=%2Finvites%2Fabc"),
}));

import { signInWithGoogle as mockedSignInWithGoogle } from "@/lib/auth/oauth.client";

const signInWithGoogle = mockedSignInWithGoogle as jest.Mock;

describe("LoginClient", () => {
  beforeEach(() => {
    signInWithGoogle.mockReset();
    signInWithGoogle.mockResolvedValue({ data: {}, error: null });
  });

  it("renders the Google login entry point", () => {
    render(<LoginClient />);
    expect(
      screen.getByRole("heading", { name: "ログイン・新規登録" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Googleでログイン" })
    ).toBeInTheDocument();
  });

  it("starts Google login with next when clicked", async () => {
    render(<LoginClient />);
    fireEvent.click(screen.getByRole("button", { name: "Googleでログイン" }));

    await waitFor(() =>
      expect(signInWithGoogle).toHaveBeenCalledWith("/invites/abc")
    );
  });
});
