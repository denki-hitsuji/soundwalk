# プロジェクトルール

## ディレクトリ構成ルール

### /app 配下

- ページコンポーネント（page.tsx）とレイアウト（layout.tsx）のみ配置
- **Server Actions や DB 接続コードは配置禁止**

### /lib 配下

- データ取得・更新ロジックはすべて `/lib` 配下に配置
- `/lib/db/` - データベース操作（Supabase クライアント使用）
- `/lib/api/` - Server Actions（クライアントから呼び出される）
- `/lib/actions/` - Server Actions（RPC呼び出しなど）
- `/lib/utils/` - ユーティリティ関数
- `/lib/auth/` - 認証関連

### /components 配下

- 再利用可能なUIコンポーネント
- DB接続コードは使用禁止（propsでデータを受け取る）

## コーディング規約

- Server Actionsには `"use server"` を必ず記述
- DB操作関数は `*Db` サフィックスを付ける（例: `getMyActsDb`）
- API関数（Server Actions）は `*Action` サフィックスを付ける（例: `upsertPerformanceAction`）

## 会話・ドキュメント管理

### /doc 配下

- 会話の履歴を `/doc` 配下に日付ファイル（YYYY-MM-DD.md）で保存する
- 新規チャットを開始する際は、これまでの会話（/doc配下）を参照すること

## テストコード規約

- コードを変更・追加した際は、必ずテストコードを書くこと
- テストは `__tests__/` 配下に配置し、対象ファイルのパス構造を反映させる
- 実行コマンド: `npm test`

### CLAUDE.md の運用

- 重要なルールは CLAUDE.md に追記すること
- 追記するか判断に迷う場合は、ユーザーに質問すること
