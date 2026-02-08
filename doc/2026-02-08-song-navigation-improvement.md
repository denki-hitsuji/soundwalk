# 曲目詳細画面への直接遷移改善

## 問題点

現在、ダッシュボードとアクト詳細画面から曲目詳細に辿り着くまでに複数のステップが必要で、UXが悪い：

1. **ダッシュボード** → 曲をタップ → **アクト詳細**に遷移（❌曲詳細に行けない）
2. **アクト詳細** → 曲をタップ → **曲一覧**に遷移 → 曲を再度タップ → やっと**曲詳細**

## 現状の実装分析

### ✅ 正しく実装されている箇所

**[DashboardSongsSection.tsx:18](components/songs/DashboardSongsSection.tsx#L18)**
```tsx
<Link href={`/musician/songs/${song.id}`} className="hover:underline">
  {song.title}
</Link>
```
→ 曲詳細への直接リンクが実装されている

### ❌ 修正が必要な箇所

#### 1. **[ActDetailClient.tsx:187](app/musician/acts/[actId]/ActDetailClient.tsx#L187)**
```tsx
<Link
  href={`/musician/songs?actId=${act.id}`}  // ❌ 曲一覧に遷移
  className="block px-2 py-2 text-sm hover:bg-gray-50"
  title="曲ページへ（この名義で絞り込み）"
>
  {s.title}
</Link>
```

**問題:** 曲をタップしても曲一覧ページに遷移してしまう

**修正案:** 曲詳細への直接リンクに変更
```tsx
<Link
  href={`/musician/songs/${s.id}`}  // ✅ 曲詳細に直接遷移
  className="block px-2 py-2 text-sm hover:bg-gray-50"
  title={s.title}
>
  {s.title}
</Link>
```

#### 2. **[SongSummaryCard.tsx:79](components/songs/SongSummaryCard.tsx#L79)**
```tsx
<li key={s.id} className="flex items-start gap-2">
  <Link href="/musician/songs" className="min-w-0">  // ❌ 曲一覧に遷移
    <span className="text-gray-400">♪</span>{" "}
    <span className="truncate">{s.title}</span>
  </Link>
</li>
```

**問題:** 曲をタップしても曲一覧ページに遷移してしまう

**修正案:** 曲詳細への直接リンクに変更
```tsx
<li key={s.id} className="flex items-start gap-2">
  <Link href={`/musician/songs/${s.id}`} className="min-w-0">  // ✅ 曲詳細に直接遷移
    <span className="text-gray-400">♪</span>{" "}
    <span className="truncate">{s.title}</span>
  </Link>
</li>
```

## 修正方針

### 基本原則
**曲タイトルをタップ → 常に曲詳細画面に直接遷移**

### 修正ファイル
1. [app/musician/acts/[actId]/ActDetailClient.tsx](app/musician/acts/[actId]/ActDetailClient.tsx#L187)
2. [components/songs/SongSummaryCard.tsx](components/songs/SongSummaryCard.tsx#L79)

### 想定される改善効果
- ダッシュボードやアクト詳細から、**1タップで曲詳細にアクセス可能**
- ユーザーの操作ステップが削減され、UXが向上
- 一貫したナビゲーション体験の提供

## 実装タスク

1. `ActDetailClient.tsx` の曲リンクを修正
2. `SongSummaryCard.tsx` の曲リンクを修正
3. 動作確認
   - ダッシュボードから曲タップ → 曲詳細に遷移することを確認
   - アクト詳細から曲タップ → 曲詳細に遷移することを確認
   - SongSummaryCard（演奏できる曲ページ）から曲タップ → 曲詳細に遷移することを確認
