# Vercel環境変数設定ガイド

## 🚨 緊急修正が必要な問題
本番環境で参考書名入力フィールドが使用できない問題の根本原因は、**Vercelの環境変数が設定されていない**ことです。

## 📋 設定手順

### 1. Vercelダッシュボードにアクセス
https://vercel.com/dashboard にアクセスしてログインしてください。

### 2. プロジェクトを選択
`todo-study-frontend` プロジェクトをクリックしてください。

### 3. 環境変数設定画面に移動
1. **Settings** タブをクリック
2. 左サイドバーの **Environment Variables** をクリック

### 4. 環境変数を追加
以下の2つの環境変数を追加してください：

#### 変数1: VITE_SUPABASE_URL
- **Name**: `VITE_SUPABASE_URL`
- **Value**: `https://wjpcfsjtjgxvhijczxnj.supabase.co`
- **Environment**: `Production`, `Preview`, `Development` すべてにチェック

#### 変数2: VITE_SUPABASE_ANON_KEY
- **Name**: `VITE_SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcGNmc2p0amd4dmhpamN6eG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMDYxOTcsImV4cCI6MjA2NTg4MjE5N30.TRMV3BrHkCKH-7RYFD6rGLdYq1kxUqZYQr3uD-WaPy0`
- **Environment**: `Production`, `Preview`, `Development` すべてにチェック

### 5. 再デプロイを実行
環境変数を追加した後、以下のいずれかの方法で再デプロイしてください：

#### 方法A: Vercelダッシュボードから
1. **Deployments** タブに移動
2. 最新のデプロイメントの右側にある **...** メニューをクリック
3. **Redeploy** をクリック

#### 方法B: GitHubプッシュによる自動デプロイ
何かファイルを変更してGitHubにプッシュすると自動的に再デプロイされます。

### 6. 動作確認
再デプロイ完了後、以下のURLでログインテストを実行してください：
https://todo-study-frontend.vercel.app/

## ✅ 確認事項
- ログインが正常に動作する
- ログイン後に参考書管理画面にアクセスできる
- 参考書名入力フィールドでテキスト入力が可能

## 🔧 トラブルシューティング
もし設定後も問題が解決しない場合は、以下を確認してください：

1. **環境変数の値が正確か**: 上記の値をコピー&ペーストで正確に入力
2. **すべての環境にチェックが入っているか**: Production, Preview, Development
3. **再デプロイが完了しているか**: デプロイメント履歴で確認
4. **ブラウザキャッシュをクリア**: Ctrl+F5 または Cmd+Shift+R

## 📞 サポート
設定完了後、「設定完了しました」とお知らせください。動作確認をサポートします。