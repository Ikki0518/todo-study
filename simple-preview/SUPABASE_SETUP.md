# Supabase セットアップガイド

このガイドでは、学習管理アプリケーション「suna」でSupabaseを使用するためのセットアップ手順を説明します。

## 📋 前提条件

- Supabaseアカウント（[supabase.com](https://supabase.com)で無料作成可能）
- Node.js 16以上
- Git

## 🚀 セットアップ手順

### 1. Supabaseプロジェクトの作成

1. [Supabase Dashboard](https://app.supabase.com)にログイン
2. 「New Project」をクリック
3. プロジェクト名を入力（例: `suna-learning-app`）
4. データベースパスワードを設定
5. リージョンを選択（日本の場合は `Northeast Asia (Tokyo)`）
6. 「Create new project」をクリック

### 2. データベーススキーマの作成

1. Supabase Dashboardで作成したプロジェクトを開く
2. 左サイドバーの「SQL Editor」をクリック
3. 「New query」をクリック
4. [`supabase-schema.sql`](./supabase-schema.sql)の内容をコピー&ペースト
5. 「Run」ボタンをクリックしてスキーマを実行

### 3. 認証設定

1. 左サイドバーの「Authentication」をクリック
2. 「Settings」タブを選択
3. 以下の設定を確認/変更：
   - **Enable email confirmations**: ON（メール確認を有効化）
   - **Enable phone confirmations**: OFF（電話確認は無効）
   - **Site URL**: `http://localhost:3009`（開発時）
   - **Redirect URLs**: `http://localhost:3009`を追加

### 4. Row Level Security (RLS) の確認

1. 左サイドバーの「Table Editor」をクリック
2. 各テーブル（users, goals, tasks等）でRLSが有効になっていることを確認
3. 「Policies」タブでセキュリティポリシーが適用されていることを確認

### 5. 環境変数の設定

1. Supabase Dashboardの「Settings」→「API」を開く
2. 以下の値をコピー：
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public key**: `eyJ...`（長いトークン）

3. プロジェクトルートの`.env`ファイルを編集：

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 本番環境の場合は以下も設定
# VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 6. アプリケーションの起動

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

## 📊 作成されるテーブル

| テーブル名 | 説明 |
|-----------|------|
| `users` | ユーザープロフィール情報 |
| `goals` | 学習目標 |
| `tasks` | 学習タスク |
| `study_books` | 参考書情報 |
| `study_sessions` | 学習記録 |
| `daily_stats` | 日次学習統計 |

## 🔒 セキュリティ機能

- **Row Level Security (RLS)**: ユーザーは自分のデータのみアクセス可能
- **認証**: Supabase Authによる安全な認証
- **データ暗号化**: 保存時および転送時の暗号化
- **アクセス制御**: 適切な権限管理

## 📈 便利なビュー

- `user_study_progress`: ユーザーの学習進捗サマリー
- `todays_tasks`: 今日のタスク一覧

## 🛠️ トラブルシューティング

### よくある問題と解決方法

#### 1. 「Invalid URL」エラー
- `.env`ファイルの`VITE_SUPABASE_URL`が正しく設定されているか確認
- URLに`https://`が含まれているか確認

#### 2. 認証エラー
- `VITE_SUPABASE_ANON_KEY`が正しく設定されているか確認
- Supabase Dashboardで認証設定を確認

#### 3. データベース接続エラー
- Supabaseプロジェクトが正常に作成されているか確認
- SQLスキーマが正しく実行されているか確認

#### 4. RLSエラー
- テーブルのRLSポリシーが正しく設定されているか確認
- ユーザーが認証されているか確認

### デバッグ方法

1. **ブラウザの開発者ツール**でコンソールエラーを確認
2. **Supabase Dashboard**の「Logs」でデータベースログを確認
3. **Network**タブでAPI呼び出しを確認

## 📚 参考資料

- [Supabase公式ドキュメント](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## 🔄 データベース更新

スキーマを更新する場合：

1. [`supabase-schema.sql`](./supabase-schema.sql)を編集
2. Supabase DashboardのSQL Editorで実行
3. 必要に応じてデータ移行を実行

## 🚀 本番環境デプロイ

本番環境では以下を設定：

1. **Site URL**を本番URLに変更
2. **Redirect URLs**に本番URLを追加
3. 環境変数を本番環境に設定
4. HTTPS証明書の設定
5. ドメインの設定

## 💡 ヒント

- 開発時は`console.log`でSupabaseレスポンスを確認
- RLSポリシーのテストは慎重に行う
- 定期的にデータベースのバックアップを取る
- パフォーマンス監視を行う

---

**注意**: このアプリケーションは学習目的で作成されています。本番環境で使用する場合は、追加のセキュリティ対策を検討してください。