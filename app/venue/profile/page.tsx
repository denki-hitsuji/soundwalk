// app/venue/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  getMyVenueProfile,
  upsertMyVenueProfile,
  type VolumeLevel,
} from '@/lib/api/venue';

const volumeOptions: { value: VolumeLevel; label: string }[] = [
  { value: 'quiet', label: 'かなり静かめ（会話が主）' },
  { value: 'medium', label: 'ほどほど（BGM〜軽いライブ）' },
  { value: 'loud', label: 'やや大きめ（ライブバーに近い）' },
];

export default function VenueProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [capacity, setCapacity] = useState<string>(''); // stringで保持してあとで変換
  const [volumePreference, setVolumePreference] = useState<VolumeLevel>('quiet');
  const [hasPa, setHasPa] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');

  // 初回ロード：店舗プロフィール取得
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError(null);
      setSuccess(null);
      try {
        const venue = await getMyVenueProfile();
        if (venue) {
          setName(venue.name ?? '');
          setAddress(venue.address ?? '');
          setCapacity(venue.capacity != null ? String(venue.capacity) : '');
          setVolumePreference((venue.volume_preference as VolumeLevel) ?? 'quiet');
          setHasPa(Boolean(venue.has_pa));
          setPhotoUrl(venue.photo_url ?? '');
        }
      } catch (e: any) {
        console.error(e);
        setError('店舗プロフィールの読み込みに失敗しました。ログイン状態を確認してください。');
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

    if (!name.trim()) {
      setError('店舗名を入力してください。');
      return;
    }

    const parsedCapacity =
      capacity.trim() === '' ? null : Number.isNaN(Number(capacity)) ? null : Number(capacity);

    setSaving(true);
    try {
      await upsertMyVenueProfile({
        name: name.trim(),
        address: address.trim(),
        capacity: parsedCapacity,
        volumePreference,
        hasPa,
        photoUrl: photoUrl.trim(),
      });
      setSuccess('店舗プロフィールを保存しました。');
    } catch (e: any) {
      console.error(e);
      setError('店舗プロフィールの保存に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="px-6 py-8">
        <h1 className="text-2xl font-bold mb-4">店舗プロフィール</h1>
        <p>読み込み中です...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">店舗プロフィール</h1>

      <p className="text-sm text-gray-600 mb-6">
        あなたのお店に合うミュージシャンを見つけるための情報です。
        ざっくりでかまいませんが、雰囲気が伝わるように入力してみてください。
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
        {/* 店名 */}
        <div>
          <label className="block text-sm font-medium mb-1">
            店舗名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例：Cafe Moonlight"
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>

        {/* 住所 */}
        <div>
          <label className="block text-sm font-medium mb-1">住所（任意）</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="例：○○県△△市…"
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>

        {/* 席数 */}
        <div>
          <label className="block text-sm font-medium mb-1">席数の目安（任意）</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="例：20"
              className="w-24 rounded border px-3 py-2 text-sm"
            />
            <span className="text-sm text-gray-600">席くらい</span>
          </div>
        </div>

        {/* 音量の許容 */}
        <div>
          <label className="block text-sm font-medium mb-1">音量の許容範囲</label>
          <div className="flex flex-col gap-1">
            {volumeOptions.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="volumePreference"
                  value={opt.value}
                  checked={volumePreference === opt.value}
                  onChange={() => setVolumePreference(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            近隣クレームが心配な場合は「静かめ」推奨です。
          </p>
        </div>

        {/* PA有無 */}
        <div>
          <label className="block text-sm font-medium mb-1">店内にPA機材はありますか？</label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={hasPa}
              onChange={(e) => setHasPa(e.target.checked)}
            />
            簡易PA（ミキサー／スピーカーなど）がある
          </label>
          <p className="mt-1 text-xs text-gray-500">
            なくても問題ありません。ミュージシャンが持ち込む、という前提でもOKです。
          </p>
        </div>

        {/* 写真URL（簡易版） */}
        <div>
          <label className="block text-sm font-medium mb-1">店舗写真のURL（任意）</label>
          <input
            type="url"
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            placeholder="お店の外観や内装写真のURLがあれば"
            className="w-full rounded border px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">
            MVPではURL欄だけにしておき、あとで画像アップロード機能をつける想定です。
          </p>
        </div>

        {/* 保存ボタン */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? '保存中...' : '店舗プロフィールを保存する'}
          </button>
        </div>
      </form>
    </div>
  );
}