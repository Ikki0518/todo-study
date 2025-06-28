# AI学習プランナー セットアップガイド

## 前提条件

- Node.js 18.0.0以上
- npm 9.0.0以上
- PostgreSQL 14以上
- Google Cloud Platformアカウント（Google Calendar API用）
- OpenAI APIキー

## セットアップ手順

### 1. 依存関係のインストール

```bash
# プロジェクトルートで実行
npm install
```

### 2. 環境変数の設定

#### バックエンド環境変数

1. `backend/.env.example`を`backend/.env`にコピー
2. 以下の環境変数を設定：

```bash
# データベース設定
DB_PASSWORD=your_database_password

# JWT設定
JWT_SECRET=your_secure_jwt_secret_key

# OpenAI API設定
OPENAI_API_KEY=your_openai_api_key

# Google Calendar API設定（オプション）
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 3. データベースのセットアップ

1. PostgreSQLデータベースを作成：

```sql
CREATE DATABASE ai_study_planner;
```

2. データベーススキーマを適用：

```bash
psql -U your_db_user -d ai_study_planner -f database/schema.sql
```

### 4. Google Calendar APIの設定（オプション）

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成
3. Google Calendar APIを有効化
4. OAuth 2.0クライアントIDを作成
5. 認証情報を`.env`ファイルに追加

### 5. 開発サーバーの起動

```bash
# プロジェクトルートで実行
npm run dev
```

これにより以下が起動します：
- バックエンドサーバー: http://localhost:3001
- フロントエンドサーバー: http://localhost:3000

## 開発ワークフロー

### コードの変更

- フロントエンド: `frontend/src/`配下のファイルを編集
- バックエンド: `backend/src/`配下のファイルを編集
- 共通型定義: `shared/src/`配下のファイルを編集

### ビルド

```bash
# 全体のビルド
npm run build

# 個別のビルド
npm run build:frontend
npm run build:backend
npm run build:shared
```

### テスト

```bash
# 全体のテスト
npm test
```

### リント

```bash
# 全体のリント
npm run lint
```

## トラブルシューティング

### 依存関係のエラー

```bash
# node_modulesを削除して再インストール
rm -rf node_modules package-lock.json
rm -rf frontend/node_modules backend/node_modules shared/node_modules
npm install
```

### データベース接続エラー

1. PostgreSQLサービスが起動していることを確認
2. `.env`ファイルのデータベース設定を確認
3. データベースユーザーの権限を確認

### TypeScriptエラー

```bash
# 共有モジュールをビルド
npm run build:shared
```

## 本番環境へのデプロイ

1. 環境変数を本番環境用に設定
2. データベースを本番環境にセットアップ
3. ビルドを実行
4. 静的ファイルをホスティングサービスにデプロイ
5. バックエンドをサーバーにデプロイ

詳細なデプロイ手順は`DEPLOYMENT.md`を参照してください。