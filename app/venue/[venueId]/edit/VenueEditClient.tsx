// app/venue/[venueId]/edit/VenueEditClient.tsx
'use client';

import { useState } from 'react';
import { updateVenue, type VolumeLevel, type VenueProfile } from '@/lib/api/venues';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const volumeOptions: { value: VolumeLevel; label: string }[] = [
  { value: 'quiet', label: 'かなり静かめ（会話が主）' },
  { value: 'medium', label: 'ほどほど（BGM〜軽いライブ）' },
  { value: 'loud', label: 'やや大きめ（ライブバーに近い）' },
];

type Props = {
  venueId: string;
  initialVenue: VenueProfile;
};

export function VenueEditClient({ venueId, initialVenue }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [name, setName] = useState(initialVenue.name ?? '');
  const [address, setAddress] = useState(initialVenue.address ?? '');
  const [capacity, setCapacity] = useState<string>(
    initialVenue.capacity != null ? String(initialVenue.capacity) : ''
  );
  const [volumePreference, setVolumePreference] = useState<VolumeLevel>(
    (initialVenue.volume_preference as VolumeLevel) ?? 'quiet'
  );
  const [hasPa, setHasPa] = useState(Boolean(initialVenue.has_pa));
  const [photoUrl, setPhotoUrl] = useState(initialVenue.photo_url ?? '');

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
      await updateVenue(venueId, {
        name: name.trim(),
        address: address.trim(),
        capacity: parsedCapacity,
        volumePreference,
        hasPa,
        photoUrl: photoUrl.trim(),
      });
      setSuccess('店舗プロフィールを保存しました。');
      setTimeout(() => {
        router.push('/venue');
      }, 1500);
    } catch (e: any) {
      console.error(e);
      setError('店舗プロフィールの保存に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="mb-6">
        <Link
          href="/venue"
          className="text-sm text-blue-600 hover:underline mb-2 inline-block"
        >
          ← 会場ダッシュボードに戻る
        </Link>
        <h1 className="text-2xl font-bold">店舗プロフィール編集</h1>
      </div>

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
