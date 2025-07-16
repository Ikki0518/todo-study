# Vercelデプロイ手順

## 1. Vercelアカウントの準備
1. https://vercel.com にアクセス
2. GitHubアカウントでログイン

## 2. 新規プロジェクトの作成
1. Vercelダッシュボードで「New Project」をクリック
2. 「Import Git Repository」を選択
3. GitHubアカウントを連携（初回のみ）
4. リポジトリ一覧から `Ikki0518/todo-study` を選択

## 3. プロジェクト設定
### 基本設定
- **Project Name**: todo-study-cramschool（任意）
- **Framework Preset**: Vite（自動検出されるはず）
- **Root Directory**: ./（そのまま）
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 環境変数の設定
以下の環境変数を追加：

```
VITE_SUPABASE_URL=https://wjpcfsjtjgxvhijczxnj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcGNmc2p0amd4dmhpamN6eG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMDYxOTcsImV4cCI6MjA2NTg4MjE5N30.TRMV3BrHkCKH-7RYFD6rGLdYq1kxUqZYQr3uD-WaPy0
```

## 4. デプロイ
1. 「Deploy」ボタンをクリック
2. ビルドプロセスが開始される
3. 完了後、デプロイURLが表示される

## 5. 自動デプロイの設定
- GitHubのmainブランチにプッシュすると自動的にデプロイされる
- プルリクエストごとにプレビューデプロイも作成される

## デプロイ後の確認事項
- [ ] アプリケーションが正常に表示される
- [ ] Supabaseとの接続が確立されている
- [ ] モバイルドラッグ&ドロップ機能が動作する
- [ ] 決済機能が表示される
- [ ] ログイン機能が動作する

## トラブルシューティング
### 白い画面が表示される場合
- 環境変数が正しく設定されているか確認
- ブラウザのコンソールでエラーを確認

### ビルドエラーが発生する場合
- package.jsonのdependenciesを確認
- node_modulesを削除して再インストール

### 404エラーが発生する場合
- vercel.jsonのrewritesルールを確認
- SPAの設定が正しいか確認