// app/(musician)/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  getMyMusicianProfile,
  upsertMyMusicianProfile,
  type VolumeLevel,
} from '@/lib/api/musician';

const volumeOptions: { value: VolumeLevel; label: string }[] = [
  { value: 'quiet', label: '静かめ（カフェ向き）' },
  { value: 'medium', label: 'ふつう（多くの店舗向き）' },
  { value: 'loud', label: 'やや大きめ（ライブバー向き）' },
];

export default function MusicianProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [genre, setGenre] = useState('');
  const [volume, setVolume] = useState<VolumeLevel>('quiet');
  const [area, setArea] = useState('');
  const [minFee, setMinFee] = useState<string>(''); // stringで持ってから number に変換
  const [sampleVideoUrl, setSampleVideoUrl] = useState('');
  const [bio, setBio] = useState('');

  // 初回ロード：プロフィール取得
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError(null);
      setSuccess(null);
      try {
        const profile = await getMyMusicianProfile();
        if (profile) {
          setGenre(profile.genre ?? '');
          setVolume((profile.volume as VolumeLevel) ?? 'quiet');
          setArea(profile.area ?? '');
          setMinFee(profile.min_fee != null ? String(profile.min_fee) : '');
          setSampleVideoUrl(profile.sample_video_url ?? '');
          setBio(profile.bio ?? '');
        }
      } catch (e: any) {
        console.error(e);
        setError('プロフィールの読み込みに失敗しました。ログイン状態を確認してください。');
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // 簡易バリデーション
    if (!genre.trim()) {
      setError('ジャンルを入力してください（例：アコースティック、ジャズなど）。');
      return;
    }
    if (!area.trim()) {
      setError('主な活動エリアを入力してください。');
      return;
    }

    const parsedMinFee =
      minFee.trim() === '' ? null : Number.isNaN(Number(minFee)) ? null : Number(minFee);

    setSaving(true);
    try {
      await upsertMyMusicianProfile({
        genre: genre.trim(),
        volume,
        area: area.trim(),
        minFee: parsedMinFee,
        sampleVideoUrl: sampleVideoUrl.trim(),
        bio: bio.trim(),
      });
      setSuccess('プロフィールを保存しました。');
    } catch (e: any) {
      console.error(e);
      setError('プロフィールの保存に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="px-6 py-8">
        <h1 className="text-2xl font-bold mb-4">ミュージシャンプロフィール</h1>
        <p>読み込み中です...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">ミュージシャンプロフィール</h1>

      <p className="text-sm text-gray-600 mb-6">
        あなたの音楽の雰囲気が伝わるように、ざっくりでいいので入力してみてください。
        店舗側はこの情報を見て「この人にお願いしよう」と判断します。
      </p>

      {error && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded border border-green-300 bg-green-50 px-4 py-2 text-sm text-green-700">
          {success}
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        {/* ジャンル */}
        <div>
          <label className="block text-sm font-medium mb-1">
            ジャンル <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            placeholder="例：アコースティック／ジャズ／ポップス など"
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>

        {/* 音量レベル */}
        <div>
          <label className="block text-sm font-medium mb-1">音量の目安</label>
          <div className="flex gap-4">
            {volumeOptions.map((opt) => (
              <label key={opt.value} className="flex items-center gap-1 text-sm">
                <input
                  type="radio"
                  name="volume"
                  value={opt.value}
                  checked={volume === opt.value}
                  onChange={() => setVolume(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {/* エリア */}
        <div>
          <label className="block text-sm font-medium mb-1">
            主な活動エリア <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="例：水戸〜ひたちなか周辺、都内23区 など"
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>

        {/* 最低ギャラ */}
        <div>
          <label className="block text-sm font-medium mb-1">
            希望する最低ギャラ（任意）
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={minFee}
              onChange={(e) => setMinFee(e.target.value)}
              placeholder="例：3000"
              className="w-32 rounded border px-3 py-2 text-sm"
            />
            <span className="text-sm text-gray-600">円（空欄なら「相談ベース」扱い）</span>
          </div>
        </div>

        {/* 動画URL */}
        <div>
          <label className="block text-sm font-medium mb-1">サンプル動画URL（任意）</label>
          <input
            type="url"
            value={sampleVideoUrl}
            onChange={(e) => setSampleVideoUrl(e.target.value)}
            placeholder="YouTube などのURLを1つ"
            className="w-full rounded border px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">
            1分程度の弾き語り動画が1つあれば十分です。スマホ撮りでもOK。
          </p>
        </div>

        {/* 自己紹介 */}
        <div>
          <label className="block text-sm font-medium mb-1">自己紹介・ひとこと（任意）</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder="音楽歴・好きなアーティスト・ライブの雰囲気など、自由に書いてください。"
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>

        {/* 保存ボタン */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? '保存中...' : 'プロフィールを保存する'}
          </button>
        </div>
      </form>
    </div>
  );
}