# Vercel環境変数設定ガイド

## 問題の概要
新しい本番環境 `https://todo-study-three.vercel.app/` で認証が失敗している原因は、環境変数が設定されていないためです。

## 必要な環境変数
以下の環境変数をVercelプロジェクト `todo-study-three` に設定する必要があります：

### 1. VITE_SUPABASE_URL
```
https://wjpcfsjtjgxvhijczxnj.supabase.co
```

### 2. VITE_SUPABASE_ANON_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcGNmc2p0amd4dmhpamN6eG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMDYxOTcsImV4cCI6MjA2NTg4MjE5N30.TRMV3BrHkCKH-7RYFD6rGLdYq1kxUqZYQr3uD-WaPy0
```

## 設定方法

### 方法1: Vercel CLI（推奨）
```bash
# プロジェクトをリンク
npx vercel link

# 環境変数を設定
npx vercel env add VITE_SUPABASE_URL production
# 値を入力: https://wjpcfsjtjgxvhijczxnj.supabase.co

npx vercel env add VITE_SUPABASE_ANON_KEY production
# 値を入力: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcGNmc2p0amd4dmhpamN6eG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMDYxOTcsImV4cCI6MjA2NTg4MjE5N30.TRMV3BrHkCKH-7RYFD6rGLdYq1kxUqZYQr3uD-WaPy0

# 再デプロイ
npx vercel --prod
```

### 方法2: Vercelダッシュボード
1. https://vercel.com/dashboard にアクセス
2. `todo-study-three` プロジェクトを選択
3. Settings → Environment Variables に移動
4. 上記の環境変数を追加
5. Deployments → 最新のデプロイメント → Redeploy

## 確認方法
環境変数設定後、以下のURLでテスト：
- https://todo-study-three.vercel.app/
- ログイン: ikki_y0518@icloud.com / ikki0518

## 期待される結果
- ログインが成功する
- 参考書名入力フィールドが正常に動作する
- データベースへの接続が確立される

## トラブルシューティング
環境変数設定後も問題が続く場合：
1. ブラウザキャッシュをクリア
2. 新しいシークレットウィンドウでテスト
3. Vercelのデプロイメントログを確認