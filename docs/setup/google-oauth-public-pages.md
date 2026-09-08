# Google OAuthの公開ページ

Google Auth Platformの「ブランディング」に登録するURL:

| 項目 | URL |
| --- | --- |
| アプリケーションのホームページ | https://soundwalk.net/ |
| アプリケーション プライバシーポリシー | https://soundwalk.net/privacy |
| アプリケーション利用規約 | https://soundwalk.net/terms |

- 承認済みドメインは `soundwalk.net`。Google Search Consoleで所有権を確認し、Google Cloudプロジェクトの管理者と関連づける。
- Google側のアプリ名はサイト上の表記と同じ `Soundwalk` にする。
- ホームページ・ポリシーは認証なしで表示し、ホームページとログイン画面からポリシーへリンクする。
- 公開用の運営者名・問い合わせ先は `lib/public/operator.ts` で共有する。
- カレンダー接続には、別途Google Calendar APIの有効化とOAuthクライアントの設定が必要。
- GitHubへのpushだけでは本番反映を保証しない。デプロイ後に、未ログインのブラウザで上記URLが200応答し、最新版の本文が表示されることを確認する。
- 公開ページの整備とGoogleの審査完了は別。カレンダーの機密スコープについては追加審査や操作動画を求められる場合がある。

参照:
- [Google OAuthブランド審査と公開ページ要件](https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification)
- [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy)
