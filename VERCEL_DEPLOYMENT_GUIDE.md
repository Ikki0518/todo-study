# Vercel新規デプロイメントガイド

## 🚀 新しいVercelプロジェクトへのデプロイ手順

### 対象URL
https://todo-study-cramschool.vercel.app/

### 1. Vercelダッシュボードでの設定

#### 新規プロジェクト作成
1. Vercelダッシュボード (https://vercel.com/dashboard) にアクセス
2. 「New Project」をクリック
3. GitHubリポジトリ「Ikki0518/todo-study」を選択
4. プロジェクト名を「todo-study-cramschool」に設定
5. Framework Preset: **Vite** を選択
6. Root Directory: **todo-study** を指定

#### 環境変数の設定
**必須環境変数:**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**設定手順:**
1. プロジェクト設定 → Environment Variables
2. 上記2つの変数を追加
3. Environment: **Production**, **Preview**, **Development** すべてにチェック

### 2. ビルド設定

#### Build Command
```bash
npm run build
```

#### Output Directory
```
dist
```

#### Install Command
```bash
npm install
```

### 3. カスタムドメイン設定

#### ドメイン追加
1. プロジェクト設定 → Domains
2. 「todo-study-cramschool.vercel.app」を追加
3. DNS設定が自動で完了

### 4. デプロイメント確認

#### 自動デプロイ
- GitHubのmainブランチへのプッシュで自動デプロイ
- 現在の最新コミット: `4009484`

#### 手動デプロイ
1. Vercelダッシュボード → Deployments
2. 「Redeploy」ボタンをクリック

### 5. 動作確認項目

#### 基本機能
- [ ] システム概要画面の表示
- [ ] ログイン画面への遷移
- [ ] 新規登録画面への遷移

#### 認証機能
- [ ] メールアドレスログイン（ikki_y0518@icloud.com / Ikki0518）
- [ ] ユーザーIDログイン（TC-0001 / Ikki0518）
- [ ] ローカルフォールバック認証

#### メイン機能
- [ ] デイリープランナーの表示
- [ ] 参考書管理機能
- [ ] 学習計画生成機能

### 6. トラブルシューティング

#### ビルドエラー
```bash
# ローカルでビルドテスト
npm run build
```

#### 環境変数エラー
- Supabase接続情報の確認
- 環境変数名の確認（VITE_プレフィックス必須）

#### 404エラー
- ルーティング設定の確認
- SPA設定の確認

### 7. 現在のプロジェクト状態

#### 実装済み機能
- ✅ デュアルロール認証システム
- ✅ データベース永続化
- ✅ 参考書管理機能
- ✅ 学習計画生成機能
- ✅ デイリープランナー
- ✅ 包括的なデバッグ機能

#### 最新の変更
- 本番環境認証デバッグ機能
- Vercel環境変数デバッグガイド
- 自動テストスクリプト

### 8. デプロイ後の確認コマンド

```bash
# 新しいURLでの動作確認
curl -I https://todo-study-cramschool.vercel.app/

# 自動テストスクリプト実行（URLを更新後）
node test-production.cjs