import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InlineAddSong } from "@/components/acts/InlineAddSong";

describe("InlineAddSong", () => {
  it("入力フィールドと追加ボタンが表示される", () => {
    render(<InlineAddSong onAdd={async () => {}} />);
    expect(screen.getByPlaceholderText("曲名を追加")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "曲を追加" })).toBeInTheDocument();
  });

  it("曲名を入力してボタンをクリックすると onAdd が呼ばれる", async () => {
    const onAdd = jest.fn().mockResolvedValue(undefined);
    render(<InlineAddSong onAdd={onAdd} />);

    await userEvent.type(screen.getByPlaceholderText("曲名を追加"), "テスト曲");
    await userEvent.click(screen.getByRole("button", { name: "曲を追加" }));

    await waitFor(() => expect(onAdd).toHaveBeenCalledWith("テスト曲"));
  });

  it("空のまま追加するとエラーメッセージが表示される", async () => {
    render(<InlineAddSong onAdd={async () => {}} />);

    await userEvent.click(screen.getByRole("button", { name: "曲を追加" }));

    expect(screen.getByText("曲名を入力してください")).toBeInTheDocument();
  });

  it("空白のみの入力はエラーになる", async () => {
    render(<InlineAddSong onAdd={async () => {}} />);

    await userEvent.type(screen.getByPlaceholderText("曲名を追加"), "   ");
    await userEvent.click(screen.getByRole("button", { name: "曲を追加" }));

    expect(screen.getByText("曲名を入力してください")).toBeInTheDocument();
  });

  it("追加成功後に入力フィールドがクリアされる", async () => {
    const onAdd = jest.fn().mockResolvedValue(undefined);
    render(<InlineAddSong onAdd={onAdd} />);

    const input = screen.getByPlaceholderText("曲名を追加");
    await userEvent.type(input, "新しい曲");
    await userEvent.click(screen.getByRole("button", { name: "曲を追加" }));

    await waitFor(() => expect(input).toHaveValue(""));
  });

  it("Enterキーでも追加できる", async () => {
    const onAdd = jest.fn().mockResolvedValue(undefined);
    render(<InlineAddSong onAdd={onAdd} />);

    await userEvent.type(screen.getByPlaceholderText("曲名を追加"), "Enterで追加{Enter}");

    await waitFor(() => expect(onAdd).toHaveBeenCalledWith("Enterで追加"));
  });

  it("onAdd が失敗するとエラーメッセージが表示される", async () => {
    const onAdd = jest.fn().mockRejectedValue(new Error("保存に失敗"));
    render(<InlineAddSong onAdd={onAdd} />);

    await userEvent.type(screen.getByPlaceholderText("曲名を追加"), "エラー曲");
    await userEvent.click(screen.getByRole("button", { name: "曲を追加" }));

    await waitFor(() => expect(screen.getByText("保存に失敗")).toBeInTheDocument());
  });

  it("追加中はボタンが無効化される", async () => {
    let resolve!: () => void;
    const onAdd = jest.fn().mockReturnValue(new Promise<void>((r) => { resolve = r; }));
    render(<InlineAddSong onAdd={onAdd} />);

    await userEvent.type(screen.getByPlaceholderText("曲名を追加"), "追加中テスト");
    await userEvent.click(screen.getByRole("button", { name: "曲を追加" }));

    expect(screen.getByRole("button", { name: "追加中…" })).toBeDisabled();

    resolve();
    await waitFor(() => expect(screen.getByRole("button", { name: "曲を追加" })).not.toBeDisabled());
  });
});
