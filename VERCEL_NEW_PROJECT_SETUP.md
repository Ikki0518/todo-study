# 新しいVercelプロジェクトの作成手順

## 🚀 ステップバイステップガイド

### 1. Vercelダッシュボードにアクセス
1. https://vercel.com/dashboard にアクセス
2. GitHubアカウントでログイン

### 2. 新規プロジェクト作成
1. **「New Project」**ボタンをクリック
2. **「Import Git Repository」**セクションで以下を実行：
   - 「Import from GitHub」を選択
   - リポジトリ検索で「**Ikki0518/todo-study**」を検索
   - 該当リポジトリの「**Import**」ボタンをクリック

### 3. プロジェクト設定
#### 基本設定
- **Project Name**: `todo-study-cramschool`
- **Framework Preset**: `Vite` を選択
- **Root Directory**: `todo-study` を指定
- **Build and Output Settings**:
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Install Command: `npm install`

#### 環境変数設定
**Environment Variables**セクションで以下を追加：
```
Name: VITE_SUPABASE_URL
Value: https://your-project.supabase.co

Name: VITE_SUPABASE_ANON_KEY
Value: your-anon-key-here
```

### 4. デプロイ実行
1. **「Deploy」**ボタンをクリック
2. ビルドプロセスの完了を待機（通常2-3分）

### 5. カスタムドメイン設定（オプション）
デプロイ完了後：
1. プロジェクトダッシュボード → **「Settings」** → **「Domains」**
2. **「Add Domain」**をクリック
3. `todo-study-cramschool.vercel.app` を入力
4. **「Add」**をクリック

## 🔧 トラブルシューティング

### 404エラーが発生する場合

#### 原因1: Root Directoryの設定ミス
**解決策:**
1. プロジェクト設定 → **「Settings」** → **「General」**
2. **「Root Directory」**を `todo-study` に設定
3. **「Save」**をクリック
4. **「Deployments」**タブで **「Redeploy」**実行

#### 原因2: ビルド設定の問題
**解決策:**
1. **「Settings」** → **「Functions」**
2. **「Build & Development Settings」**を確認：
   ```
   Framework Preset: Vite
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

#### 原因3: 環境変数の未設定
**解決策:**
1. **「Settings」** → **「Environment Variables」**
2. 必要な環境変数を追加：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. **「Redeploy」**実行

### ビルドエラーが発生する場合

#### Node.jsバージョンの確認
1. **「Settings」** → **「General」**
2. **「Node.js Version」**を `18.x` に設定

#### 依存関係の問題
ローカルでビルドテスト：
```bash
cd todo-study
npm install
npm run build
```

## 📋 デプロイ後の確認項目

### 1. 基本動作確認
- [ ] サイトが正常に表示される
- [ ] システム概要画面が表示される
- [ ] ログインボタンが機能する

### 2. 認証機能確認
- [ ] ログイン画面への遷移
- [ ] テストアカウントでのログイン
  - Email: `ikki_y0518@icloud.com` / Password: `Ikki0518`
  - User ID: `TC-0001` / Password: `Ikki0518`

### 3. メイン機能確認
- [ ] デイリープランナーの表示
- [ ] 参考書管理機能
- [ ] 学習計画生成機能

## 🔗 完成予定URL
https://todo-study-cramschool.vercel.app/

## 📞 サポート情報

### Vercelサポートドキュメント
- [Viteアプリのデプロイ](https://vercel.com/docs/frameworks/vite)
- [環境変数の設定](https://vercel.com/docs/concepts/projects/environment-variables)
- [カスタムドメイン](https://vercel.com/docs/concepts/projects/domains)

### よくある問題
1. **ビルドが失敗する** → Node.jsバージョンとRoot Directoryを確認
2. **環境変数が読み込まれない** → `VITE_`プレフィックスを確認
3. **404エラー** → SPAルーティング設定を確認

## 🚨 重要な注意点

1. **Root Directory**は必ず `todo-study` に設定
2. **Framework Preset**は必ず `Vite` を選択
3. **環境変数**は `VITE_` プレフィックス必須
4. デプロイ後は必ず **「Redeploy」** で最新コードを反映