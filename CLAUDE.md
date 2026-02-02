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
