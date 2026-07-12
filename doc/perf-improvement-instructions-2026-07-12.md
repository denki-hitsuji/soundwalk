# パフォーマンス改善 実装手順書(Codex 用)

作成日: 2026-07-12
目的: 画面遷移・操作時のレスポンス改善(体感の「もっさり感」の解消)

## 背景(調査結果の要約)

本アプリは 1 回の画面遷移で Supabase への直列ネットワーク往復が 10 回前後発生する構造になっている。主な原因は以下の 4 点。

1. `supabase.auth.getUser()`(Supabase Auth サーバーへの HTTP 往復)が、ミドルウェア・レイアウト・ページ・DB 関数で重複して呼ばれている。リクエスト内キャッシュ(React の `cache()`)が一切使われていない。
2. `getNextPerformanceServerDb()` が内部で `getMyActsServerDb()` を再実行しており、呼び出し元(`NextPerformanceSectionServer`)でも同じ関数を呼んでいるため、auth + `v_my_acts` クエリが二重実行されている。
3. `app/` 配下に `loading.tsx` が 1 つもなく、Suspense によるストリーミングも未使用。遷移先の全データ取得が終わるまで画面が無反応になる。
4. 更新操作の成功後に `router.refresh()`(ページ全体の RSC 再取得 = 上記の全往復のやり直し)を約 30 箇所で呼んでいる。

本手順書では、リスクの低い順に Phase 1〜3 に分けて実装する。**Phase 1 と Phase 2 は必須。Phase 3 は任意(着手前にユーザーへ確認すること)。**

## 前提・遵守事項

- 作業ブランチ: `refactor/cleanup-2026-07` から `perf/reduce-auth-roundtrips` を切って作業する。
- CLAUDE.md のルールに従うこと。特に:
  - コード変更時は必ずテストを書く。テストは `__tests__/` 配下に、対象ファイルのパス構造を反映して配置する。実行は `npm test`。
  - `/app` 配下に Server Actions・DB 接続コードを置かない。DB 操作は `/lib/db/`、Server Actions は `/lib/api/` または `/lib/actions/`。
  - DB 操作関数は `*Db` サフィックス、Server Actions は `*Action` サフィックス。
- 各 Phase の完了ごとに `npm test` と `npm run build` が通ることを確認してからコミットする。
- 既存の characterization テスト(コミット aaf8964 で追加)を壊さないこと。

---

## Phase 1: auth.getUser() の重複排除(必須・効果最大)

### 1-1. `getCurrentUser` を React `cache()` でリクエスト内キャッシュ化

対象: `lib/auth/session.server.ts`

1. まず、`lib/auth/session.server.ts` をクライアントコンポーネント(`"use client"` 付きファイル)から import している箇所がないことを grep で確認する(クライアント用には `lib/auth/session.client.ts` が別に存在する)。
2. 確認できたら、ファイル先頭の `"use server"` を `import "server-only";` に置き換える。
   - 理由: この関数はサーバーコンポーネント/サーバーコードから直接呼ぶユーティリティであり、Server Action としてクライアントに公開する必要がない。また `"use server"` ファイルでは `cache()` ラップしたエクスポートが Server Action の制約と衝突する。
3. `getCurrentUser` を `cache()` でラップする:

```ts
// lib/auth/session.server.ts
import "server-only";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const getCurrentUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) return null;
  return user;
});
```

これにより、同一リクエスト内で何度呼んでも Supabase Auth への実通信は 1 回になる。

### 1-2. `createSupabaseServerClient` の `"use server"` を除去

対象: `lib/supabase/server.ts`

- ファイル先頭の `"use server"` を削除する(`import "server-only"` は既にあるので残す)。
- 理由: Supabase クライアントを返す関数を Server Action として公開する意味はなく(戻り値がシリアライズ不能)、不要なエンドポイント公開になっている。
- 削除後、`npm run build` が通ることを確認する。

### 1-3. サーバー側の直接 `auth.getUser()` 呼び出しを `getCurrentUser()` に置き換え

以下のサーバー側ファイルで、`supabase.auth.getUser()` を直接呼んでいる箇所を `getCurrentUser()`(1-1 でキャッシュ化したもの)に置き換える。取得した `user.id` の使い方(null チェック、エラー処理の挙動)は各箇所の既存ロジックを維持すること。

置き換え対象(2026-07-12 時点の行番号):

| ファイル | 行 |
|---|---|
| `components/layout/AppShell.tsx` | 13 |
| `lib/db/performances.ts` | 519, 542, 635, 719 |
| `lib/db/eventAttachments.ts` | 35, 97 |
| `lib/db/rehearsals.ts` | 87, 109 |
| `lib/actions/reconfirmPerformance.ts` | 8, 23 |
| `lib/actions/updateEventCore.ts` | 15 |
| `lib/actions/acceptAndCreatePerformance.ts` | 8, 25 |
| `lib/actions/organizerCancelPerformance.ts` | 8 |
| `lib/songAssets.ts` | 102 |

注意点:

- **クライアント側のファイルは対象外**: `lib/auth/session.client.ts`、`lib/hooks/useCurrentAct.ts`、`app/(public)/invites/[token]/InviteClient.tsx` は変更しない。
- `components/songs/SongSummaryCard.tsx:97` はサーバー/クライアントどちらのコンテキストか確認し、サーバーコンポーネントであれば置き換え、クライアントであれば対象外とする。
- `proxy.ts`(ミドルウェア)は `cookies()` が使えない実行コンテキストのため対象外。Phase 3 で扱う。
- 各ファイルで `getCurrentUser` の import を追加する。auth エラーを throw していた箇所(例: `lib/db/performances.ts:719-720`)は、`getCurrentUser()` が null を返した場合に従来と同等のエラーを throw する形に揃える。

### 1-4. `getMyActsServerDb` の二重実行を解消

対象: `lib/db/performances.ts`、`components/performances/NextPerformanceSection.server.tsx`

1. `getNextPerformanceServerDb(todayStr?)` のシグネチャを `getNextPerformanceServerDb(todayStr?: string, actIds?: string[])` に変更する。`actIds` が渡された場合は内部の `getMyActsServerDb()` 呼び出しをスキップして渡された値を使う。未指定時は従来どおり内部で取得する(後方互換)。
2. `NextPerformanceSectionServer`(components/performances/NextPerformanceSection.server.tsx:11-12)で、`getMyActsServerDb()` の結果 `actIds` を `getNextPerformanceServerDb(todayStr, actIds)` に渡す。
3. さらに `getMyActsServerDb` 自体も `cache()` でラップし、同一リクエスト内の重複実行を防ぐ。

### 1-5. Phase 1 のテスト

- `__tests__/lib/auth/session.server.test.ts`: `getCurrentUser` が Supabase クライアントの `auth.getUser` を呼び、エラー時に null を返すこと(既存テストがあれば維持・修正)。
- `__tests__/lib/db/performances.test.ts`: `getNextPerformanceServerDb` に `actIds` を渡した場合に `getMyActsServerDb` 相当の照会(auth.getUser / v_my_acts の select)が発生しないことを、Supabase クライアントのモックで検証する。
- 既存テストが全て通ること: `npm test`

### 1-6. コミット

```
perf: リクエスト内キャッシュで auth.getUser の重複呼び出しを排除
```

---

## Phase 2: loading.tsx と Suspense によるストリーミング(必須・体感改善大)

### 2-1. 各セクションに `loading.tsx` を追加

以下のディレクトリに `loading.tsx` を新規作成する。内容は簡素なスケルトン(パルスアニメーション付きのプレースホルダ)で統一する。

- `app/loading.tsx`
- `app/musician/loading.tsx`
- `app/organizer/loading.tsx`
- `app/venue/loading.tsx`
- `app/shows/loading.tsx`
- `app/map/loading.tsx`

実装例(Tailwind 使用。プロジェクトの既存スタイルに合わせて調整可):

```tsx
export default function Loading() {
  return (
    <main className="w-full mx-auto space-y-4 p-4">
      <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
      <div className="h-40 animate-pulse rounded-lg bg-gray-200" />
      <div className="h-40 animate-pulse rounded-lg bg-gray-200" />
    </main>
  );
}
```

`loading.tsx` はページコンポーネント扱いなので `/app` 配下への配置ルールに適合する。DB 接続コードを含めないこと。

### 2-2. `/musician` ページの Suspense 分割

対象: `app/musician/page.tsx`

`NextPerformanceSectionServer` と `SongSummaryCard` は互いに独立したデータを取得しているため、それぞれ `<Suspense>` で包み、ページの枠を先に表示させる:

```tsx
import { Suspense } from "react";

export default async function MusicianDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <main className="w-full mx-auto">
      <Suspense fallback={<SectionSkeleton />}>
        <NextPerformanceSectionServer />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <SongSummaryCard />
      </Suspense>
    </main>
  );
}
```

`SectionSkeleton` は `components/layout/` 配下に再利用可能なコンポーネントとして作成する(props でデータを受け取らない純粋な表示コンポーネント)。

他のページ(organizer / venue / shows 配下)にも、複数の独立したデータ取得セクションを持つサーバーコンポーネントがあれば同様に適用する。ただし 1 ページ内のデータ取得が単一の場合は `loading.tsx` のみで十分であり、無理に分割しない。

### 2-3. Phase 2 のテスト

- `__tests__/components/layout/SectionSkeleton.test.tsx`: スケルトンがレンダリングされることのスモークテスト。
- `app/musician/page.tsx` に既存テストがあれば、Suspense 追加後も通ることを確認する。
- `npm test` と `npm run build` が通ること。

### 2-4. コミット

```
perf: loading.tsx と Suspense を追加し遷移時の体感を改善
```

---

## Phase 3: 任意(着手前にユーザーへ確認すること)

以下は効果はあるがリスクや設計判断を伴うため、Phase 1・2 の完了後、ユーザーの承認を得てから着手する。

### 3-1. ミドルウェアの見直し

対象: `proxy.ts`

- 現状 matcher がほぼ全パスにマッチし、リクエストごとに `auth.getUser()`(Auth サーバー往復)を実行している。
- 選択肢 A: matcher から認証不要のパス(`(public)` 配下のルートなど)を除外する。ただし Supabase SSR のセッションリフレッシュ(cookie 更新)が必要なパスを除外しないよう注意。
- 選択肢 B: `supabase.auth.getClaims()`(JWT のローカル検証。Auth サーバー往復なし)に置き換える。Supabase プロジェクト側で JWT Signing Keys(非対称鍵)の設定が必要なため、事前にダッシュボードの設定を確認すること。

### 3-2. `router.refresh()` の削減

- 操作頻度の高い画面から順に、Server Action の戻り値で更新後データを受け取りローカル state を更新する方式へ移行する。
- 最優先候補: `app/musician/performances/[performanceId]/PerformanceDetailClient.tsx`(8 箇所で refresh)。
- 全面的な置き換えは行わず、1 画面ずつ動作確認しながら進める。

### 3-3. `ensureAndFetchPrepMapDb` の書き込み分離

- `lib/db/performances.ts:143` の `ensureAndFetchPrepMapDb` はページ表示のクリティカルパスで upsert(書き込み)を行っている。読み取り専用の関数と、初期化用の Server Action に分離し、初期化はクライアント側から遅延実行する設計を検討する。

---

## 最終確認チェックリスト

- [ ] `npm test` が全件パス
- [ ] `npm run build` が成功
- [ ] `npm run dev` で以下を手動確認:
  - [ ] ログイン → `/musician` 遷移時、スケルトンが即座に表示された後にコンテンツが出る
  - [ ] `/musician` の「次のライブ」セクションと曲サマリが従来どおり表示される
  - [ ] 出演詳細画面での更新操作(メモ編集など)が従来どおり動作する
  - [ ] ログアウト → 未ログイン状態で保護ページにアクセスすると `/login` にリダイレクトされる
- [ ] 変更ファイルに対応するテストが `__tests__/` 配下に追加されている
