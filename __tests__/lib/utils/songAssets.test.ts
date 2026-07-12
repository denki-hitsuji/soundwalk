import {
  normalizeSongAssetMimeType,
  validateSongAssetFile,
  SONG_ASSET_MAX_BYTES,
} from "@/lib/utils/songAssets";

describe("song asset utilities", () => {
  it("許可されたファイル形式を受け入れる", () => {
    expect(validateSongAssetFile(new File(["data"], "demo.mp3", { type: "audio/mpeg" }))).toBeNull();
  });

  it("m4a の MIME type を audio/mp4 に正規化する", () => {
    expect(normalizeSongAssetMimeType(new File(["data"], "demo.m4a", { type: "audio/x-m4a" }))).toBe("audio/mp4");
  });

  it("動画と上限超過ファイルを拒否する", () => {
    expect(validateSongAssetFile(new File(["data"], "movie.mp4", { type: "audio/mpeg" }))).toContain("動画");
    const large = new File([new Uint8Array(SONG_ASSET_MAX_BYTES + 1)], "large.mp3", { type: "audio/mpeg" });
    expect(validateSongAssetFile(large)).toContain("10MB");
  });
});
