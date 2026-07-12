# soundwalk リファクタリング計画書（2026-07-03）

- 基準コミット: `85715a6`（added history screen）。本書の行番号はすべてこのコミット時点のもの。**作業が進むと行番号はずれるため、必ずシンボル名（関数名・変数名）で対象を特定すること。**
- ベースライン実測値（計画作成時に確認済み）:
  - `npm test` → 13 suites / 62 tests、全パス（約2秒）
  - `rm -rf .next && npx tsc --noEmit` → エラー0（`.next` を消さないと、削除済みページを参照する古いキャッシュ起因のエラーが5件出る。ソースのエラーではない）
- 本計画は**挙動を変えないこと**（＝リファクタリング）を原則とする。例外は「11. redirect修正」「12. getFutureFlyers修正」「13. canceled判定統一」の3件で、いずれも明白なバグの修正であり、修正内容を項目内に明記した。

---

## 1. 現状理解（実行者への文脈共有）

### 1-1. アプリの概要

ミュージシャン向けのライブ管理 Web アプリ。Next.js 16（App Router）+ Supabase（PostgreSQL / Auth / Storage）。認証は Google OAuth（Supabase 経由）のみ。主な機能:

- **ライブ管理** (`/musician/performances`): 自分の出演予定（`musician_performances` テーブル）の一覧・詳細・フライヤー添付・段取りチェック
- **曲管理** (`/musician/songs`)、**リハ管理** (`/musician/rehearsals`)、**カレンダー** (`/musician/calendar`)、**足跡（実績振り返り）** (`/musician/history`)
- **名義（アクト）管理** (`/musician/acts`): ソロ/バンド等の出演名義。`acts` / `act_members` テーブル
- **企画・会場側機能** (`/organizer`, `/venue`): イベント作成、出演オファー、ブッキング承認
- **公開マップ** (`/map`): Leaflet で会場を表示

### 1-2. レイヤ構造（CLAUDE.md で規定された設計ルール）

```
app/**/page.tsx        … ページ。ロジック最小。サーバーコンポーネントでデータ取得して Client に渡す
components/**          … 再利用UI。DB接続禁止（propsで受け取る）
lib/api/**             … "use server"。認証チェック+lib/dbの薄いラッパ。クライアントから呼ばれる
lib/actions/**         … "use server"。RPC等の複合操作
lib/db/**              … Supabase クエリ。関数名は *Db サフィックス
lib/utils/**           … 純粋関数・型定義（本来はDBアクセス禁止だが、現状違反あり→項目18）
lib/auth/**            … 認証（session.server.ts の getCurrentUser() が認可の要）
lib/supabase/**        … クライアント生成（client.ts=ブラウザ / server.ts=サーバー）
```

### 1-3. 中核データフロー（ライブ一覧の例）

```
app/musician/performances/page.tsx
  → getPerformances()            … lib/utils/performance.ts:238 ←【違反】utilsにDBアクセスが居る
  → getFutureFlyers()            … lib/utils/performance.ts:341 ←【バグ】引数を無視して全件取得
  → getDetailsMapForPerformancesDb() … lib/db/performances.ts
  → ensureAndFetchPrepMapDb()    … lib/db/performances.ts
  → <PerformancesClient>         … app/musician/performances/PerformancesClient.tsx
      → <PerformanceCard>        … components/performances/PerformanceCard.tsx
```

### 1-4. 重要な前提知識

- **`status` の綴りゆれ**: `musician_performances.status` には歴史的に `"canceled"`（DB書き込みはすべてこの綴り）が入るが、コード内の比較は `"canceled"` と `"cancelled"` が混在。`lib/utils/history.ts` に両綴り対応の `isCanceledStatus()` が既にある（テスト済みの純粋関数モジュール）。
- **Supabase join のゆれ**: PostgREST の join 結果は単体オブジェクト/配列の両方がありうる。`toPerformanceWithActsPlain`（lib/utils/performance.ts:121）などの正規化関数で吸収している。
- **`v_my_performances` / `v_my_acts`**: RLS 前提のビュー。ログインユーザー自身の行だけが見える。
- **テスト**: jest + jsdom。`__tests__/` 配下に13スイート。`lib/utils/performance.ts` を import するテストが既に存在し通っているので、同モジュールをテストから import して問題ない。
- **`.next` はビルドキャッシュ**（gitignore 済み）。型チェック前に `rm -rf .next` すること。開発サーバーは再生成するので消してよい。

### 1-5. 洗い出した問題の全体像

| 分類 | 内容 |
|---|---|
| デッドコード | 呼び出し元ゼロのファイル6個・関数9個（項目1〜10）。特に「次のライブ取得」は**4実装中3系統がデッド** |
| バグ | 相対パス `redirect("login")`、引数を無視して全 attachments を取得する `getFutureFlyers`、`"cancelled"` 比較が実データ `"canceled"` を弾けないフィルタ |
| 重複 | `typeLabel`×3、`normalizeAct`×4、`DetailsRow` 型×2、`songAssets` モジュール×2（ほぼ同一）、メモ更新関数×2 |
| 責務混在 | `lib/utils/performance.ts` にDBアクセス4関数、`lib/db` が `lib/api` を逆参照、page.tsx 8ファイルに不要な `"use server"` |
| その他 | デバッグ `console.log` 残存、ファイル先頭の旧パスコメント |

---## 2. 項目0: 安全網の構築（最初に実行）

### 0-A. ブランチ作成とベースライン記録

```bash
cd /Users/satrex/projects/soundwalk
git status --short          # 期待: 出力なし（クリーン）。差分があれば中断して報告
git switch -c refactor/cleanup-2026-07
rm -rf .next
npx tsc --noEmit            # 期待: エラー0
npm test                    # 期待: 13 suites / 62 tests 全パス
```

期待結果にならない場合は**作業を開始せず報告**すること。

### 0-B. 特性テストの追加（コミット1つ目）

今回の作業で触る純粋関数の現在の挙動を固定する。以下の2ファイルを新規作成する。

**ファイル1: `__tests__/lib/utils/performance.pure.test.ts`**

`@/lib/utils/performance` から `padTimeHHMM, statusText, detailsSummary, normalizeAct, toPerformanceWithActsPlain` を、`@/lib/utils/date` から `parseYmdLocal` を import し、次のケースを書く:

| 対象 | 入力 | 期待出力 |
|---|---|---|
| `padTimeHHMM` | `"19:30:00"` | `"19:30"` |
| `padTimeHHMM` | `null` | `null` |
| `statusText` | `(parseYmdLocal("2026-07-01"), parseYmdLocal("2026-07-03"))` | `"期限超過"` |
| `statusText` | `(parseYmdLocal("2026-07-03"), parseYmdLocal("2026-07-03"))` | `"今日"` |
| `statusText` | `(parseYmdLocal("2026-07-06"), parseYmdLocal("2026-07-03"))` | `"あと3日"` |
| `detailsSummary` | `(null, null)` | `"未登録（開場/開演/チャージ）"` |
| `detailsSummary` | `(d, p)` で `d.performance_id="x"`, `p.id="y"` | throw（メッセージ `"ライブと詳細のIDが相違しています。"`） |
| `detailsSummary` | `p={id:"p1",open_time:"18:30:00",start_time:"19:00:00"}`, `d={performance_id:"p1",set_start_time:"19:30:00",set_minutes:30,customer_charge_yen:2000,one_drink_required:true}`（他フィールドはnull） | `"開場 18:30 / 開演 19:00 / 出演 19:30 / 30分 / ¥2,000 / 1Dあり"` |
| `normalizeAct` | `{acts:[{id:"a1",name:"A"},{id:"a2",name:"B"}]}` （PerformanceWithActs相当のanyでよい） | `.id === "a1"` |
| `normalizeAct` | `{acts:{id:"a1",name:"A"}}` | `.id === "a1"` |
| `normalizeAct` | `{acts:null}` | `null` |
| `toPerformanceWithActsPlain` | `{id:1, event_date:"2026-01-01", profile_id:"u1", acts:[{id:"a1",name:"A"}]}` | `.id === "1"`（文字列化される）、`.acts` は長さ1の配列、`.acts[0].name === "A"` |
| `toPerformanceWithActsPlain` | 同上で `acts:{id:"a1",name:"A"}`（単体） | `.acts` は配列でなくオブジェクトで `.name === "A"` |
| `toPerformanceWithActsPlain` | 同上で `acts:null` | `.acts === null` |

型が合わない引数は `as any` でよい（挙動の固定が目的）。

**ファイル2: `__tests__/lib/utils/history.test.ts`**

`@/lib/utils/history` から `isCanceledStatus` を import し:

| 入力 | 期待 |
|---|---|
| `"canceled"` / `"cancelled"` / `"CANCELLED"` / `"Canceled"` | すべて `true` |
| `null` / `undefined` / `""` / `"confirmed"` | すべて `false` |

**完了条件**: `npm test` 全パス（スイート数 15、テスト数 62+追加分）。パス後にコミット:
`git commit -m "test: add characterization tests before refactoring"`

---

## 3. 作業項目リスト（実行順）

> 各項目共通:
> - **完了条件（共通部分）**: `rm -rf .next && npx tsc --noEmit` がエラー0、`npm test` が全パス。項目に追加条件があれば併記。
> - **戻し方（共通）**: 完了条件を満たせない場合は `git checkout -- .`（未コミット）または `git revert <コミット>`（コミット済み）で戻し、中断して報告。
> - 削除系項目では、削除前に必ず記載の grep で「参照ゼロ」を再確認する。ヒットした場合は削除せず中断して報告。

### フェーズA: デッドコード削除（効果:高 / リスク:低）

#### 項目1: app 配下の未参照 actions.ts 3ファイルを削除
- **対象**: `app/musician/actions.ts`(34行) / `app/organizer/shows/[eventId]/actions.ts`(36行) / `app/shows/[eventId]/actions.ts`(36行)
- **問題**: 3ファイルとも import 元ゼロのデッドコード。`app/musician/actions.ts` はモジュールトップレベルで `await createSupabaseServerClient()` しており、そもそも壊れている。後者2つは同名 `submitBooking` の重複コピー。実際に使われる同機能は `lib/api/eventsAction.ts` 等にある。
- **どう変えるか**: 3ファイルを `git rm` で削除。
- **削除前確認**: `grep -rn "musician/actions\|shows/\[eventId\]/actions\|submitBooking\|updateMyAct" --include="*.ts*" app components lib` → ヒットが削除対象ファイル自身のみであること。
- **リスク**: 低。誤検知時は tsc が import エラーで検出。
- **依存**: 0-B

#### 項目2: `lib/api/musician.ts` を削除
- **対象**: `lib/api/musician.ts`（83行、全体）
- **問題**: `getMyMusicianProfile` / `upsertMyMusicianProfile` とも呼び出し元ゼロ。`musicians` テーブルという現行スキーマに存在しない参照と、`lib/auth/session.server.ts` と重複するローカル `getCurrentUser` を含む。
- **どう変えるか**: ファイルごと削除。
- **削除前確認**: `grep -rn "lib/api/musician\|getMyMusicianProfile\|upsertMyMusicianProfile\|MusicianProfile" --include="*.ts*" app components lib` → ヒットがこのファイル自身のみ。
- **リスク**: 低。 **依存**: 0-B

#### 項目3: `lib/db/songAction.ts` を削除
- **対象**: `lib/db/songAction.ts`（2行、全体）
- **問題**: `"use server"` と未使用 import のみで export が無い。完全なデッドファイル。命名も規約違反（db配下にAction）。
- **どう変えるか**: ファイルごと削除。
- **削除前確認**: `grep -rn "db/songAction" --include="*.ts*" app components lib` → ヒット0。
- **リスク**: 極小。 **依存**: 0-B

#### 項目4: `lib/auth/roles.ts` を削除
- **対象**: `lib/auth/roles.ts`（31行、全体）
- **問題**: `getCurrentUserRole` / `UserRole` とも import 元ゼロ。ブラウザ用 supabase クライアントを import しておりサーバーから呼べない設計上の袋小路でもある。
- **どう変えるか**: ファイルごと削除。
- **削除前確認**: `grep -rn "auth/roles\|getCurrentUserRole" --include="*.ts*" app components lib` → ヒットがこのファイル自身のみ。
- **リスク**: 低。 **依存**: 0-B

#### 項目5: `lib/db/profiles.ts` の重複 `updatePerformanceMemo` を削除
- **対象**: `lib/db/profiles.ts` の `updatePerformanceMemo`（21〜38行）
- **問題**: `lib/db/performances.ts` の `updatePerformanceMemoDb` と同一処理の重複。呼び出し元ゼロ（UIは `lib/api/performancesAction.ts` 経由で `updatePerformanceMemoDb` を使う）。profiles ファイルに performance 更新が居る責務違反でもある。
- **どう変えるか**: 関数を削除。ファイル末尾のコメントアウト済み `getOtherActs` も同時に削除してよい。
- **削除前確認**: `grep -rn "updatePerformanceMemo" --include="*.ts*" app components lib` → `lib/db/profiles.ts` のヒットが定義のみ（他のヒットは performances 系で正常）。
- **リスク**: 低。 **依存**: 0-B

#### 項目6: `lib/api/performances.ts` のデッド関数2件と未使用 import を削除
- **対象**: `lib/api/performances.ts` の `getPerformancesForDashboard`（11〜14行）と `getNextPerformanceServer`（27〜30行）
- **問題**: 前者は呼び出し元ゼロかつバグ入り（配列に単体用 `toPlainPerformance` を適用）。後者は**中身が `return` だけで常に undefined を返す**壊れた関数、呼び出し元ゼロ。
- **どう変えるか**: 2関数を削除。あわせて import 行から未使用になる `getPerformancesForDashboardDb`（2行目）、`toPlainPerformance` と `getPerformances`（3行目）を除去。
- **削除前確認**: `grep -rn "getPerformancesForDashboard\b" --include="*.ts*" app components` → ヒット0。
- **リスク**: 低。 **依存**: 0-B

#### 項目7: 「次のライブ取得」のデッド系統を削除
- **対象**:
  - `lib/api/acts.ts` の `getNextPerformance`（14〜16行）
  - `lib/db/acts.ts` の `getNextPerformanceDb`（53〜79行）
  - `lib/api/performances.ts` の `getNextPerformance`（16〜18行）
  - `lib/db/performances.ts` の `getNextPerformanceDb`（100〜128行）
- **問題**: 「次のライブ」の実装が4つあり、実際に UI（`components/performances/NextPerformanceSection.server.tsx`）が使うのは `lib/utils/performance.ts` の `getNextPerformanceServer` のみ。上記4関数は互いに包むだけで外部から呼ばれていない。
- **どう変えるか**: 4関数を削除。各ファイルの import 行から未使用になったシンボル（`lib/api/acts.ts` の `getNextPerformanceDb`、`lib/api/performances.ts` の `getNextPerformanceDb`）を除去。
- **削除前確認**: `grep -rn "getNextPerformance\b\|getNextPerformanceDb" --include="*.ts*" app components` → ヒット0（`getNextPerformanceServer` は別名なので残っていて正常）。
- **リスク**: 低〜中（同名関数が複数あるため取り違え注意。**必ず上記4定義だけ**を消す）。
- **依存**: 6（同一ファイルを編集するため順番に）

#### 項目8: `lib/db/performances.ts` のデッド3関数と未使用 import を削除
- **対象**: `getPerformancesForDashboardDb`（273〜281行）/ `getMyActsServerDb`（353〜364行）/ `getNextPerformanceServerDb`（366〜397行）
- **問題**: `getPerformancesForDashboardDb` は項目6で唯一の呼び出し元が消えた（かつ `error` を握りつぶし `userId` 引数も未使用のバグ持ち）。後者2つは互いを呼ぶだけの孤島（実際に使われているのは `lib/utils/performance.ts` の同名類似関数）。
- **どう変えるか**: 3関数を削除。14行目の import から未使用の `getPerformances` を除去（`toPerformanceWithActsArrayPlain` 等は使用中なので残す）。
- **削除前確認**: `grep -rn "getPerformancesForDashboardDb\|getMyActsServerDb\|getNextPerformanceServerDb" --include="*.ts*" app components lib` → ヒットが `lib/db/performances.ts` 内の定義と相互呼び出しのみ。
- **リスク**: 低。 **依存**: 6, 7

#### 項目9: musician ダッシュボードのデッドUIを削除
- **対象**: `app/musician/page.tsx` の未使用 import 2行（3行目 `DashboardSongsSection`、6行目 `DashboardClient`）、および `app/musician/DashboardClient.tsx`（全体）/ `app/musician/QuickPerformanceBar.tsx`（143行、全体）/ `components/songs/DashboardSongsSection.tsx`（全体）
- **問題**: `page.tsx` は import するだけで描画していない。`DashboardClient` は誰にも使われず、`QuickPerformanceBar` は `DashboardClient` 内のコメントアウトからのみ参照。`DashboardSongsSection` も参照ゼロ。
- **どう変えるか**: import 2行を削除 → 3ファイルを削除。
- **注意**: `components/performances/NextPerformanceSectionClient.tsx` と `DashboardPerformanceCard.tsx` は**生きている**（`NextPerformanceSection.server.tsx` 経由で使用中）。消さないこと。
- **削除前確認**: `grep -rn "DashboardClient\|QuickPerformanceBar\|DashboardSongsSection" --include="*.ts*" app components lib` → ヒットが削除対象自身と `app/venue/VenueClient.tsx` の `VenueDashboardClient`（別物・対象外）のみ。
- **完了条件（追加)**: `npm run build` 成功。
- **リスク**: 中（ページ周辺のため）。ビルドで検出可能。 **依存**: 0-B

#### 項目10: `app/musician/performances/page.tsx` の死んだ計算と `var` を除去
- **対象**: 同ファイル 40〜42行（`var` 3連）と 70〜86行（`desired` の計算）
- **問題**: `desired` は計算されるがどこにも使われない（同じ計算を `ensureAndFetchPrepMapDb` が内部で再実行している）。`var` はプロジェクト内で他に使用例のない古い書き方。
- **どう変えるか**: `desired` の計算ブロック（コメント「4) 段取りタスク…」の直後〜`.flatMap` 終端）を削除。`var flyerByPerformanceId` 等3行を `let` に変更（後続で再代入があるため `const` 不可）。未使用になる import（`PREP_DEFS`, `addDays` など。tsc/eslint の未使用警告に従う）を除去。
- **リスク**: 低。`desired` が本当に未使用かは削除前に `grep -n "desired" app/musician/performances/page.tsx` で確認（宣言と直後の flatMap 以外にヒットがないこと）。
- **依存**: 0-B

### フェーズB: 明白なバグの修正（効果:高 / リスク:低〜中）

#### 項目11: 相対パス redirect の修正
- **対象**: `app/musician/page.tsx` 11行目
- **問題**: `redirect("login")` が相対パスのため、`/musician` 配下からの遷移先が `/login` にならない恐れ。他ページはすべて `redirect("/login")`。
- **どう変えるか**: `redirect("login")` → `redirect("/login")`
- **完了条件（追加）**: `grep -rn 'redirect("login")' app` → ヒット0。
- **リスク**: 極小。 **依存**: なし

#### 項目12: `getFutureFlyers` が引数を無視する問題の修正
- **対象**: `lib/utils/performance.ts` の `getFutureFlyers`（341〜350行）
- **問題**: 引数 `flyerIds` を使わず `performance_attachments` を**全件**取得している（他人の行はRLSで絞られるが、自分の全過去分を毎回取得）。ローカル変数 `todayStr` も未使用。
- **どう変えるか**:
  ```ts
  // before
  const todayStr = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("performance_attachments")
    .select("performance_id, file_url, created_at")
    .order("created_at", { ascending: false });
  // after
  if (flyerIds.length === 0) return { data: [] as FlyerRow[], error: null };
  const { data, error } = await supabase
    .from("performance_attachments")
    .select("performance_id, file_url, created_at")
    .in("performance_id", flyerIds)
    .order("created_at", { ascending: false });
  ```
  呼び出し元（`app/musician/performances/page.tsx:47`、渡している `futureIds` は未来分のみ）にとって、利用される key は元々 `futureIds` の分だけなので表示挙動は不変。
- **リスク**: 中（表示に直結）。確認: `npm run build` 成功 + 可能なら `npm run dev` で `/musician/performances` の未来ライブにフライヤーが表示されること。
- **依存**: 0-B

#### 項目13: canceled 判定の一本化（綴りゆれバグの解消）
- **対象**:
  - `app/musician/performances/page.tsx` 73行 `p.status !== "cancelled"` と 87〜92行 `activePerformances` の同条件
  - `app/musician/performances/PerformancesClient.tsx` 75行 `.filter((p) => p.status !== "canceled")`
- **問題**: DBに書き込まれる値は `"canceled"` のみなのに、page.tsx は `"cancelled"` と比較しており**キャンセル行を弾けていない**（現状はクエリ側の `.neq("status","canceled")` に救われて顕在化していないだけ）。
- **どう変えるか**: 3箇所を `!isCanceledStatus(p.status)` に置換し、両ファイルに `import { isCanceledStatus } from "@/lib/utils/history";` を追加（純粋関数モジュールなのでクライアントからも import 可）。
- **注意**: 表示分岐（`PerformanceDetailClient.tsx` の `=== "canceled"` など）は**変更しない**。除外フィルタの3箇所のみ。
- **完了条件（追加）**: `npm test`（特に `__tests__/performances/PerformancesClient.test.tsx` がパスすること）。
- **リスク**: 中。挙動差が出るのは「statusが `cancelled` 綴りの行が存在した場合に正しく除外されるようになる」方向のみ。
- **依存**: 0-B（isCanceledStatus の特性テスト）

### フェーズC: 重複の統合（効果:中 / リスク:低〜中）

#### 項目14: `typeLabel` 3重複の統合
- **対象**: `app/musician/songs/SongsPageClient.tsx:11-18` / `components/songs/SongSummaryCard.tsx:23` / `components/history/ActJourneys.tsx` の各ローカル `typeLabel`
- **問題**: act_type→日本語ラベル変換（solo→ソロ 等）が3ファイルに複製されている。
- **どう変えるか**: 3実装が同一であることを目視確認のうえ、`lib/utils/acts.ts` に `export function typeLabel(t: string | null): string` として1つ追加し、3ファイルのローカル定義を削除して import に置換。
- **完了条件（追加）**: `grep -rn "function typeLabel" app components` → ヒット0。
- **リスク**: 低。3実装に差異があった場合は中断して報告。 **依存**: 0-B

#### 項目15: `songAssets` 二重実装の統合
- **対象**: `lib/songAssets.ts` と `lib/utils/songAssets.ts`（ほぼ同一のクライアント用アップロード/一覧/削除モジュール）
- **問題**: ほぼ同一のファイルが2つあり、`components/songs/SongAssetsBox.tsx` は `@/lib/songAssets` を、`lib/api/songs.ts` と `lib/db/songAssets.ts` は `@/lib/utils/songAssets` を参照。片方だけ直して片方が直らない事故の温床。
- **手順**:
  1. `diff lib/songAssets.ts lib/utils/songAssets.ts` を実行。差分が「コメント・import表記・定義順」のみであることを確認。**関数本体に差分があれば中断して報告**（どちらが正か判断が必要なため）。
  2. `SongAssetsBox.tsx` の import を `@/lib/songAssets` → `@/lib/utils/songAssets` に変更（使用シンボル `listSongAssets, uploadSongAsset, deleteSongAsset, getSignedUrl, validateSongAssetFile, SongAssetRow, SONG_ASSET_MAX_BYTES` はすべて utils 側に存在することを確認済み）。
  3. `lib/songAssets.ts` を削除。
- **削除前確認**: `grep -rn "@/lib/songAssets\"" --include="*.ts*" app components lib` → ヒット0。
- **リスク**: 中（曲ファイルのアップロードUIに直結）。可能なら `npm run dev` で曲詳細のファイル添付一覧が表示されることを確認。
- **依存**: 0-B

#### 項目16: `normalizeAct` の統合
- **対象**: `lib/utils/acts.ts:45`（`normalizeAct(a: ActRow|ActRow[]|null)`）/ `lib/utils/performance.ts:232`（`normalizeAct(p: PerformanceWithActs)`）/ `app/musician/acts/page.tsx:8`（ローカルコピー）
- **問題**: 同名関数が3つ（+`lib/hooks/useCurrentAct.ts:15` に unknown 対応の別物）。acts.ts 版と page.tsx 版は完全同一。performance.ts 版は「p.acts を取り出してから同じ処理」。
- **どう変えるか**:
  - `app/musician/acts/page.tsx` のローカル定義を削除し `import { normalizeAct } from "@/lib/utils/acts";` に置換。
  - `lib/utils/performance.ts` の `normalizeAct` は本体を委譲に変更（シグネチャは維持。呼び出し元 `PerformancesClient` / `PerformanceCard` / `BookingCard` 等が多いため）:
    ```ts
    import { normalizeAct as normalizeActRow } from "./acts";
    export function normalizeAct(p: PerformanceWithActs): ActRow | null {
      return normalizeActRow(p.acts);
    }
    ```
  - `lib/hooks/useCurrentAct.ts` のローカル版は**触らない**（挙動が異なる）。
- **完了条件（追加）**: 0-B の `normalizeAct` 特性テストがパス。
- **リスク**: 低。 **依存**: 0-B

#### 項目17: `DetailsRow` 二重定義の統合
- **対象**: `lib/utils/performance.ts:156`（notes なし）と `lib/utils/acts.ts:18`（`notes: string | null` あり）
- **問題**: 同名型が2定義。import 元がファイルによって異なり、フィールド差（notes）がある。
- **どう変えるか**: `lib/utils/performance.ts` の `DetailsRow` に `notes?: string | null;` を追加（optional にすれば既存の構築箇所はそのまま通る）。`lib/utils/acts.ts` の `DetailsRow` 定義を削除し、`export type { DetailsRow } from "./performance";` で再エクスポート（import 元の書き換え不要）。
- **リスク**: 中（型のみ、実行時挙動なし）。tsc エラー0 が完了条件のすべて。エラーが出た場合は acts.ts の再エクスポートをやめ、両定義を残したまま中断して報告。
- **依存**: 0-B

### フェーズD: 責務の再配置と仕上げ（効果:中 / リスク:中）

#### 項目18: `lib/utils/performance.ts` のDBアクセス4関数を `lib/db/performances.ts` へ移設
- **対象**: `getPerformances`(238〜339行) / `getFutureFlyers`(341〜350行) / `getMyActsServer`(352〜363行) / `getNextPerformanceServer`(365〜396行)
- **問題**: CLAUDE.md の「データ取得は lib/db」「utils は純粋関数」に違反。utils がサーバー専用モジュール（`lib/supabase/server`）に依存し、テスト容易性を損なう。
- **どう変えるか**: 4関数を `lib/db/performances.ts` の末尾に移動し、*Db 規約に合わせてリネーム。呼び出し元を更新:

  | 旧（lib/utils/performance.ts） | 新（lib/db/performances.ts） | 呼び出し元の更新 |
  |---|---|---|
  | `getPerformances` | `getMyPerformancesDb` | `app/musician/performances/page.tsx`（import 2箇所・呼び出し1箇所） |
  | `getFutureFlyers` | `getFutureFlyersDb` | 同上ファイル |
  | `getMyActsServer` | `getMyActsServerDb` | `components/performances/NextPerformanceSection.server.tsx` |
  | `getNextPerformanceServer` | `getNextPerformanceServerDb` | 同上ファイル |

  - 新名 `getMyActsServerDb` / `getNextPerformanceServerDb` は項目8で削除済みのため衝突しない。
  - 移動後、`lib/utils/performance.ts` から `createSupabaseServerClient` の import と、未使用になった `toPlainError` 等の import を除去。**型定義と純粋関数（toXxxPlain 系、detailsSummary、PREP_DEFS 等）は utils に残す。**
  - `lib/db/performances.ts` は既に `"use server"` + `server-only` なので移動先での追記は不要。
- **完了条件（追加）**: `grep -n "createSupabaseServerClient" lib/utils/performance.ts` → ヒット0。`npm run build` 成功。0-B の特性テスト（utils の純粋関数）が引き続きパス。
- **リスク**: 中（ライブ一覧・ダッシュボード直撃）。可能なら `npm run dev` で `/musician/performances` と `/musician` の表示確認。
- **依存**: 6, 7, 8（旧名の削除完了）、12（getFutureFlyers の修正後に移動）

#### 項目19: `lib/db` → `lib/api` の逆依存を解消
- **対象**: `lib/db/performances.ts` 16行目 `import { getMyActs } from "@/lib/api/acts";`（使用箇所: `getMyUpcomingPerformancesDb`, `getPerformancesInRangeDb`）
- **問題**: 下位層（db）が上位層（api）を参照するレイヤ逆転。`getMyActs` は `getMyActsDb`（lib/db/acts.ts）の素通しラッパなので、db 同士の参照に差し替えられる。
- **どう変えるか**: import を `import { getMyActsDb } from "@/lib/db/acts";` に変更し、2関数内の `getMyActs()` 呼び出しを `getMyActsDb()` に置換。
- **事前確認**: `grep -n "export async function getMyActs" lib/api/acts.ts lib/db/acts.ts` で両者が素通し関係であることを目視確認。
- **リスク**: 低。 **依存**: 18（同一ファイルの編集が続くため、順序を固定する目的。技術的依存はない）

#### 項目20: page.tsx から不要な `"use server"` を除去（8ファイル）
- **対象**: `app/organizer/shows/page.tsx` / `app/venue/slots/page.tsx` / `app/venue/[venueId]/page.tsx` / `app/musician/page.tsx` / `app/musician/songs/page.tsx` / `app/musician/acts/[actId]/page.tsx` / `app/musician/acts/new/page.tsx` / `app/musician/profile/page.tsx`
- **問題**: `"use server"` はページ用ディレクティブではなく「全 export を Server Action 化する」宣言。ページコンポーネントが外部から叩ける Action エンドポイントとして公開されてしまう（不要な攻撃面）。ページはデフォルトでサーバーコンポーネントなので単に不要。
- **どう変えるか**: 各ファイル1行目（または冒頭）の `"use server"` 行を削除。**1ファイルずつ**: 削除前にそのファイルの export を確認し、default のページコンポーネント（と `metadata` 等の定数）以外の export が他所から Server Action として import されていないことを `grep -rn "<ファイル名のパス>" app components lib` で確認。
- **完了条件（追加）**: `npm run build` 成功。`grep -rln '"use server"' app --include="page.tsx"` → ヒット0。
- **リスク**: 中。ビルドが通れば実行時挙動は同一（サーバーコンポーネントのまま）。1ファイルでも判断に迷う点があればそのファイルはスキップして報告。
- **依存**: 9, 11（同一ファイル `app/musician/page.tsx` の編集を先に完了させる）

#### 項目21: デバッグ console.log の削除と旧パスコメントの修正
- **対象（削除する console.log、計10行）**:
  - `lib/db/performances.ts:33`（`"getMyUpcomingPerformances start"`）と 57・104行のコメントアウト済み console.log
  - `lib/db/events.ts:151, 174`（🔥付きデバッグ）
  - `lib/db/bookings.ts:126`
  - `lib/api/eventsAction.ts:31`（🔥付き）
  - `lib/api/performancesAction.ts:23`（`upsert start`）
  - `lib/utils/songAssets.ts` 内の MIME デバッグ4行（`"Original MIME type:"` 等。項目15実施後は utils 側のみ存在）
  - `lib/db/venues.ts:182`（コメントアウト済み）
- **対象（修正するファイル先頭コメント）**: `lib/utils/performance.ts:1`（`// lib/performanceUtils.ts` → `// lib/utils/performance.ts`）、`lib/utils/date.ts:1`（`// lib/dateUtils.ts` → `// lib/utils/date.ts`）、`lib/db/songAssets.ts:1`（`// lib/songAssets.ts` → `// lib/db/songAssets.ts`）
- **問題**: 本番コードにデバッグ出力が残りログを汚す。先頭コメントは移動前の旧パスを指し誤解を招く。
- **注意**: `console.error` / `console.warn` は**残す**（エラーハンドリングの一部）。
- **完了条件（追加）**: `grep -rn "console.log" lib | grep -v "console.error\|console.warn"` → ヒット0。
- **リスク**: 極小。 **依存**: 15, 18（対象ファイルの行が確定してから）

---

## 4. やらないことリスト（実行者への禁止事項）

以下は「気づいても着手しない」。必要と思った場合は作業せず報告に書くこと。

1. **機能追加・仕様変更・UI文言変更**（本計画の11〜13で明記した3つのバグ修正を除く）
2. **依存パッケージの追加・更新・削除**。`package.json` / `tsconfig.json` / `jest.config.*` / `next.config.*` の変更（0-B のテストファイル追加はこれに該当しない）
3. **DBスキーマ・マイグレーション・Supabase 設定・RLS の変更**。`supabase/` ディレクトリと `lib/db/types.ts`（自動生成）には触れない
4. **`.neq("status", "canceled")` などクエリ側のステータス条件の変更**（`cancelled` も弾くよう広げる等は挙動変更。項目13はアプリ側フィルタのみ）
5. **`lib/api` 関数の一括リネーム**（`*Action` サフィックス統一）。呼び出し箇所が多く差分が膨らむため今回は対象外
6. **`app/musician/performances/page.tsx` の集計ロジックの lib への移設**などの大規模な構造変更（項目10の削除のみ行う）
7. **ESLint / Prettier の一括フォーマット**。編集した行以外の整形をしない
8. **表示用の status 分岐**（`PerformanceDetailClient.tsx` / `PerformanceCard.tsx` 等の `=== "canceled"` 比較）の変更
9. **`lib/hooks/useCurrentAct.ts` の `normalizeAct`** の統合（unknown 入力対応の別物）
10. **コメントアウトされた古いコードの一括削除**（項目5・10・21 で明記した箇所以外）
11. **テストの削除・スキップ・期待値の書き換え**。テストが落ちたらコードを直すか、戻して報告

---

## 5. 実行者への指示文（このままコピペして渡す）

> あなたはこのリポジトリのリファクタリング実行者です。同梱の `doc/refactoring-plan-2026-07-03.md` に**厳密に**従って作業してください。
>
> ルール:
> 1. まず計画書の「項目0: 安全網の構築」を実行する。ベースライン（tsc エラー0 / npm test 13 suites 62 tests 全パス）を確認できない場合は、何も変更せず状況を報告して終了する。
> 2. 作業項目は**計画書の番号順に、1項目ずつ**実施する。並行作業・先回り・順序入れ替えを禁止する。
> 3. **1項目 = 1コミット**。コミットメッセージは `refactor: <項目番号> <要約>`（例: `refactor: item7 remove dead next-performance chains`）。項目0-B のみ `test:` プレフィックス。
> 4. 各項目の作業前に、項目に記載された「削除前確認 / 事前確認」の grep を必ず実行し、記載された期待結果と一致しない場合は**その項目に着手せず**、理由を添えて報告する。
> 5. 各項目の完了条件（共通: `rm -rf .next && npx tsc --noEmit` エラー0、`npm test` 全パス。項目により `npm run build` 等の追加条件）をすべて満たしてからコミットする。満たせない場合は `git checkout -- .` で戻し、**そこで作業を中断して**何が起きたかを報告する。
> 6. 行番号は基準コミット `85715a6` 時点の参考値である。**シンボル名で対象を特定**し、行番号のズレに惑わされないこと。
> 7. 計画書の「やらないことリスト」に該当する変更を一切行わない。改善点に気づいた場合はコードを触らず最終報告に記載する。
> 8. すべての項目が完了したら、`git log --oneline` と最終的な `npm test` / `npx tsc --noEmit` / `npm run build` の結果を添えて完了報告する。

---

## 付録: 実行順トレースによる整合性検証（計画作成時に実施済み）

- 0-B のテストは `lib/utils/performance.ts` の**純粋関数のみ**を対象にしており、項目16（normalizeAct委譲化）・項目18（DB関数の移設）後も import 先・挙動とも不変 → 全項目を通じて有効な安全網になる。
- 項目6（api ラッパ削除）→ 項目8（db 実体削除）の順序により、中間状態で未解決 import が発生しない。項目7は6と同一ファイルを触るため直後に配置。
- 項目8で `getMyActsServerDb` / `getNextPerformanceServerDb` が先に消えるため、項目18のリネーム移設で名前衝突しない。
- 項目12（getFutureFlyers修正）は項目18（同関数の移設）より前。移設後のファイルを再修正する手戻りがない。
- 項目9・11 が `app/musician/page.tsx` を確定させた後に項目20（同ファイル含む "use server" 除去）が来る。
- 項目15（songAssets統合）が `lib/songAssets.ts` を消した後に項目21（utils側の console.log 削除）が来るため、二重修正が発生しない。
