# ライブ情報公開API仕様書（Hugo連携用）

> **ステータス: 実装済み**（`npm test` / `tsc --noEmit` / `next build` 通過済み。本番デプロイ・Hugo側からの疎通確認は未実施）
> `app/api/` 配下には元々Hugo向けの公開APIは存在しませんでした（`flyer`・`send-verification`・`stripe/webhook` の3ディレクトリはすべて空で、Git履歴上も一度も実装されたことがありません）。本書は、既存のバンド公開ページ（`/bands/{slug}`）が使っているデータをベースに新規設計したAPI仕様です。4章の論点は2026-07-28にユーザーと合意済みで、確定仕様として実装しています。

## 1. 目的・想定読者

- 目的: Hugoサイトのビルド時（`data` テンプレートや外部データ取得）に、アクト（バンド）単位のライブ告知情報をJSONで取得する。
- 想定読者: Hugoのビルドスクリプト、および本APIを参照するLLM/エージェント。
- 認証: **不要（完全パブリック）**。個人情報・内部業務情報は一切含めない。

## 2. 既存資産との関係

既存の `/bands/{slug}` ページ（[app/bands/[slug]/page.tsx](app/bands/[slug]/page.tsx)）は Supabase ビュー `v_act_public_page_payload` を参照しているが、このビューは `supabase/migrations/` 配下のどのファイルにも定義が見つからず、`data/dbschema.sql`（2025-12-23時点のダンプ、古い）にも存在しない。Supabase側で直接作成された可能性が高く、マイグレーション管理外＝RLS/フィルタ内容をコードから監査できない状態。

**方針転換（確定）**: 上記のリスクがあるため、本APIはこの謎ビューには依存しない。代わりに `act_public_pages` / `acts` / `musician_performances` / `events` / `performance_details` を直接クエリし、`is_public` / キャンセル除外 / 企画ステータス絞り込みをアプリケーションコード側で明示的に行う。これにより、DB側のRLS設定が将来変わってもレスポンス内容が予測可能になる（4章参照）。

```text
act_public_pages (slug, is_public) --1:1--> acts (name, photo_url, profile_link_url)
                                                     │
musician_performances (act_id, event_date, venue_name, open_time, start_time, status, event_id)
        ├──> events (title, charge, status)               [event_id がある場合のみ]
        └──> performance_details (customer_charge_yen)     [performance_id で1:1]
```

**アクセス方式**: anonキーではなく `SUPABASE_SECRET_KEY` を使い、RLSをバイパスした上でコード側のフィルタ（`is_public = true` / `status <> 'canceled'` / 企画ありなら `status = 'matched'` のみ）を安全境界とする。サーバー専用モジュール（`"server-only"` import）とし、クライアントバンドルに絶対混入しないようにする。

## 3. エンドポイント設計

### 3.1 `GET /api/public/bands/{slug}/lives`（メイン）

アクト1件分の、Hugoの個別バンドページ生成に使う想定。

**配置場所（プロジェクトルール準拠）**:

- ルートハンドラ: `app/api/public/bands/[slug]/lives/route.ts`（DB接続コードを直接書かず、下記関数を呼ぶだけにする。`app/(public)/auth/callback/route.ts` と同じ「薄いラッパー」方式）
- サービスクライアント: `lib/supabase/service.ts` に `createSupabaseServiceClient()` を追加（`SUPABASE_SECRET_KEY`、service_role相当の権限でRLSをバイパス、`"server-only"`）
- DB層: `lib/db/publicLives.ts` に `getPublicActLivesDb(slug)` を追加
- レート制限: `lib/utils/rateLimit.ts` に `checkRateLimit()` を追加（簡易インメモリ実装）
- ハンドラ層: `lib/api/publicLives.ts` に `getPublicActLives(slug)`（薄いラッパー）と `handlePublicActLivesRequest(request, slug)`（レート制限＋レスポンス組み立て）を追加

**成功レスポンス例**（ユーザー提示の形をベースに、既存データにある項目を補完）:

```json
{
  "artist": {
    "name": "ザ・ホリデイズ",
    "slug": "the-holidays",
    "photo_url": "https://.../holidays.jpg",
    "profile_link_url": "https://x.com/theholidays"
  },
  "events": [
    {
      "title": "○○ LIVE",
      "date": "2026-09-12",
      "open_time": "18:30",
      "start_time": "19:00",
      "venue": "水戸○○",
      "charge": 2500
    }
  ]
}
```

ユーザー提示の形との差分（2026-07-28 確定）:

| フィールド | 対応 |
|---|---|
| `open_time` / `start_time` / `charge` | **追加**。既存データから低コストで出せる値。 |
| `url`（イベント単体のURL） | **削除確定**。DB上に対応するカラムが存在しないため。v1ではHugo側で自サイト内の詳細ページURLを自前生成する（4章-4参照）。 |
| `photo_url` / `profile_link_url`（artist側） | **追加**。既存の `/bands/{slug}` ページが既に表示している情報。 |
| `status` | **含めない確定**。キャンセル済み・未確定のライブはAPI側で除外し（4章-1, 2参照）、レスポンスにステータス値自体を含めない。Hugo側にビジネスロジックの解釈をさせない設計とする。 |
| `title` が null になるケース | 個人のスケジュール登録（企画に紐付かない単独ライブ）では `event_title` が null になりうる。Hugo側では `title ?? "${artist.name} LIVE"` 等のフォールバックを推奨。 |
| `charge` の算出元 | `events.charge`（企画に紐づく場合の公式チャージ）を優先し、無ければ `performance_details.customer_charge_yen`（個人ライブの入力値）にフォールバック。 |
| 期間フィルタ | v1では `event_date >= 当日` の**今後のライブのみ**を返す（告知用途のため）。過去分が必要になれば `?from=`/`?to=` を後日追加。 |

**エラー時**:
- `slug` が存在しない、または `is_public = false` → `404 Not Found`（存在有無を区別せず同じ404にし、非公開ページの存在を推測されないようにする）
- サーバ内部エラー → `500`（詳細メッセージは返さない）

**キャッシュ**: `Cache-Control: public, max-age=300` を推奨（既存の `/bands/{slug}` ページの `revalidate = 300` と揃える）。

### 3.2 `GET /api/public/lives`（任意・拡張案）

全アクト横断で「今後のライブ一覧」をフラットに返す、サイト全体のカレンダー/トップページ用。今回のユーザー提示例には無いが、Hugo側でアクト個別ページだけでなく横断一覧も作るなら同じデータソースから低コストで追加できる。

```json
{
  "events": [
    {
      "artist": { "name": "ザ・ホリデイズ", "slug": "the-holidays" },
      "title": "○○ LIVE",
      "date": "2026-09-12",
      "open_time": "18:30",
      "start_time": "19:00",
      "venue": "水戸○○",
      "charge": 2500
    }
  ]
}
```

クエリパラメータ案: `?from=2026-07-28&to=2026-12-31`（未指定時は当日以降）、`?limit=100`。

必要でなければ v1 スコープからは外して構いません。

## 4. 公開前の検討事項と決定（2026-07-28 確定）

1. **キャンセル済みライブの除外** — 確定
   `musician_performances.status` は `"confirmed"` / `"canceled"`（綴りは `canceled` 1L）等の値を持ち、正規の除外は `isCanceledStatus()`（[lib/utils/history.ts:93](lib/utils/history.ts#L93)）で行われています。現在の `/bands/{slug}` ページ（[app/bands/[slug]/page.tsx](app/bands/[slug]/page.tsx)）はこのフィルタをかけていない既存バグですが、新APIでは明示的に `status <> 'canceled'` を実装し、**レスポンスに `status` フィールド自体を含めない**（Hugo側にステータス解釈をさせない）。既存の `/bands/{slug}` ページ側の同修正は別タスク扱いとし、本対応のスコープ外とする。

2. **`draft` / `pending` の企画（events）の除外** — 確定
   `musician_performances` の `status <> 'canceled'` のみを一次フィルタとする。加えて、`event_id` が設定されている（＝企画に紐づく）行については、紐づく `events.status = 'matched'` の場合のみ公開対象とする。企画に紐づかない個人ライブ（`event_id` が null）は `musician_performances.status` の判定のみで公開する。

3. **`is_public` / RLSの扱い** — 確定（謎ビューへの依存をやめる形で解決）
   `v_act_public_page_payload` ビューの定義・RLSはマイグレーション管理外で本エージェントの環境からは検証不能なため、依存しない設計に変更（2章参照）。新規クエリは `SUPABASE_SECRET_KEY` でRLSをバイパスし、`is_public = true` 等の絞り込みをすべてアプリケーションコード側で行う。これにより本番RLS設定の不確実性を実装上のリスクから外している。

4. **`url`（チケット/詳細ページリンク）** — 確定: (a) v1では省略
   Hugo側で自サイト内の詳細ページURLを自前生成する。API側にはそのためのカラムを追加しない。

5. **個人情報・内部情報の非混入** — 確定
   `musician_performances` の `memo` / `status_reason` / `profile_id` 等はDB層のSELECTで明示的に列挙せず除外する（`select("*")` 禁止）。

6. **レート制限** — 確定: 簡易インメモリのレート制限を実装する
   `lib/utils/rateLimit.ts` にIPアドレス（`x-forwarded-for`）単位の固定ウィンドウ方式（例: 60秒あたり60リクエスト）を実装し、超過時は `429` + `Retry-After` を返す。サーバーレス環境ではインスタンスごとにカウンタが分離される簡易実装である点は既知の制約とする（本格的な分散レート制限が必要になれば、Upstash Redis等の外部ストアへの置き換えを別途検討）。

## 5. 実装時のディレクトリルール遵守メモ

`CLAUDE.md` のルールに従い:
- `app/api/public/bands/[slug]/lives/route.ts` は `lib/db` または `lib/api` の関数を呼ぶだけにし、Supabaseクライアントを直接生成しない。
- 現状の `app/bands/[slug]/page.tsx` は `createSupabaseServerClient()` をpage内で直接呼んでおり、CLAUDE.mdの「/app配下にDB接続コード禁止」に反しています。新規API実装を機に、同ページも `lib/api` 経由に揃えることを推奨します（任意・別タスク）。
- DB層の関数名は `getPublicActLivesDb` のように `*Db` サフィックスを付与。
- テストは対象ファイルのパス構造を反映し、`__tests__/lib/db/publicLives.test.ts` / `__tests__/lib/api/publicLives.test.ts` / `__tests__/lib/utils/rateLimit.test.ts` に配置し、`npm test` で実行できるようにする（プロジェクトのテストコード規約）。
