import { render, screen } from "@testing-library/react";
import SongDetailClient from "../../app/musician/songs/[songId]/SongDetailClient";
import type { SongRow } from "../../lib/db/songs";
import type { ActRow } from "../../lib/utils/acts";

jest.mock("../../lib/utils/templates", () => ({
  makeSongMemoTemplate: () => "",
}));
jest.mock("../../components/songs/SongMemoEditor", () => ({
  __esModule: true,
  default: () => <div />,
}));
jest.mock("../../components/songs/SongAssetsBox", () => ({
  __esModule: true,
  default: () => <div />,
}));
jest.mock("../../lib/api/songsAction", () => ({
  deleteSong: jest.fn(),
  updateSong: jest.fn(),
}));

const baseSong: SongRow = {
  id: "song-1",
  act_id: "act-1",
  title: "テスト曲",
  memo: null,
  created_at: "2026-01-01T00:00:00Z",
} as SongRow;

const baseAct: ActRow = {
  id: "act-1",
  name: "テストバンド",
  act_type: "band",
  owner_profile_id: "user-1",
} as ActRow;

describe("SongDetailClient – 一覧へリンク", () => {
  it("act がある場合、actページへのリンクになる", () => {
    render(<SongDetailClient songId="song-1" song={baseSong} act={baseAct} />);

    const link = screen.getByRole("link", { name: "一覧へ" });
    expect(link).toHaveAttribute("href", "/musician/acts/act-1");
  });

  it("act がない場合、曲一覧ページへのリンクになる", () => {
    render(<SongDetailClient songId="song-1" song={baseSong} act={undefined} />);

    const link = screen.getByRole("link", { name: "一覧へ" });
    expect(link).toHaveAttribute("href", "/musician/songs");
  });
});
