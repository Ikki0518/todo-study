# AI学習プランナー v7.0

## 概要

学習者が設定した長期目標からAIが日々の学習タスクを自動生成するシステム。生徒と講師間のコミュニケーションを円滑にし、既存のカレンダーツールとのリアルタイム連携によって、学習計画を日常生活に統合します。

## 主要機能

1. **AI逆算エンジン & 目標設定** - 長期目標から日々のタスクを自動生成
2. **デイリープランナー画面** - タスクプールとタイムライン管理
3. **モチベーション維持機能** - ストリーク表示と講師からのコメント
4. **講師用ダッシュボード** - 生徒の進捗リアルタイム閲覧
5. **Googleカレンダー同期** - リアルタイム片方向同期

## 技術スタック

- **フロントエンド**: React + TypeScript + Tailwind CSS
- **バックエンド**: Node.js + Express + TypeScript
- **データベース**: PostgreSQL
- **AI**: OpenAI API
- **認証**: JWT
- **リアルタイム通信**: Socket.io
- **カレンダー連携**: Google Calendar API

## 🚀 管理者用ユーザー管理システム

### 新機能: 塾管理者によるユーザーID発行システム

このシステムでは、塾の管理者が講師・生徒のユーザーIDを発行・管理できます。

#### 主要機能
- **自動ユーザーID生成**: `TC-0001`形式での自動採番
- **テナント分離**: 塾ごとのデータ完全分離
- **管理者ダッシュボード**: ユーザー作成・削除・統計表示
- **簡素化ログイン**: 新規登録不要、配布されたIDでログイン

## 開発環境のセットアップ

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 環境変数の設定
`.env`ファイルを作成し、以下を設定：
```bash
# Supabase設定
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# 管理者作成用（重要！）
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. データベースセットアップ
```bash
# スキーマ作成
psql -h your_db_host -U postgres -d postgres -f database/schema.sql
```

### 4. 管理者アカウント作成
```bash
# 対話式で管理者アカウントを作成
npm run create-admin
```

### 5. 開発サーバーの起動
```bash
npm run dev
```

## 📋 管理者アカウント作成ガイド

### クイックセットアップ
```bash
# 依存関係インストール + 管理者作成
npm run setup
```

### 詳細ガイド
管理者アカウントの作成方法については、[ADMIN_SETUP_GUIDE.md](./ADMIN_SETUP_GUIDE.md) を参照してください。

### ログイン方法
```bash
# 作成した管理者アカウント
ユーザーID: admin@your-juku.com または TC-0001
パスワード: (設定したパスワード)

# テストアカウント（開発用）
講師: instructor@test.com / password123
生徒: student@test.com / password123
```

## ⚙️ ユーザー管理

### 管理者の操作手順
1. 管理者でログイン
2. 「⚙️ ユーザー管理」タブをクリック
3. 新規ユーザー作成フォームに入力
4. 生成されたユーザーIDを配布

### ユーザーID形式
- **講師**: `TC-0001` ～ `TC-0099` (最大99名)
- **生徒**: `TC-0100` ～ `TC-9999` (最大9900名)

詳細は [ADMIN_USER_MANAGEMENT_GUIDE.md](./ADMIN_USER_MANAGEMENT_GUIDE.md) を参照してください。

## プロジェクト構造

```
ai-study-planner/
├── frontend/          # Reactフロントエンド
├── backend/           # Express APIサーバー
├── shared/            # 共通の型定義など
└── database/          # データベーススキーマ