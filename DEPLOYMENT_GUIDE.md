# デプロイメント設定ガイド

## 本番環境での406エラー修正完了

### 修正内容
- `loadExamDates()` メソッドを `.maybeSingle()` に修正
- 全てのデータ読み込みメソッドで406エラーを解決
- エラーハンドリングを強化

### 環境変数設定

本番環境（Vercel/Netlify等）で以下の環境変数を設定してください：

```
VITE_SUPABASE_URL=https://wjpcfsjtjgxvhijczxnj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcGNmc2p0amd4dmhpamN6eG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMDYxOTcsImV4cCI6MjA2NTg4MjE5N30.TRMV3BrHkCKH-7RYFD6rGLdYq1kxUqZYQr3uD-WaPy0
NODE_ENV=production
```

### Vercelでのデプロイ手順

1. **Vercelにログイン**
   ```bash
   npx vercel login
   ```

2. **プロジェクトをデプロイ**
   ```bash
   npx vercel --prod
   ```

3. **環境変数を設定**
   - Vercel Dashboard → Settings → Environment Variables
   - 上記の環境変数を追加

### Netlifyでのデプロイ手順

1. **Netlify CLI インストール**
   ```bash
   npm install -g netlify-cli
   ```

2. **ログイン**
   ```bash
   netlify login
   ```

3. **デプロイ**
   ```bash
   netlify deploy --prod --dir=dist
   ```

4. **環境変数設定**
   - Netlify Dashboard → Site Settings → Environment Variables
   - 上記の環境変数を追加

### 修正されたファイル

- `src/services/taskService.js` - 全データ読み込みメソッドを `.maybeSingle()` に修正
- `src/services/authService.js` - ユーザーID取得の改善
- `src/App.jsx` - エラーハンドリング強化

### 確認事項

本番環境で以下を確認してください：

1. ✅ タスクの追加・保存・読み込み
2. ✅ 406エラーが発生しないこと
3. ✅ ユーザー認証の正常動作
4. ✅ データの永続化

### トラブルシューティング

もし問題が発生した場合：

1. **ブラウザのコンソールログを確認**
2. **環境変数が正しく設定されているか確認**
3. **Supabaseの接続状況を確認**

### サポート

問題が解決しない場合は、コンソールログのスクリーンショットと共にお知らせください。