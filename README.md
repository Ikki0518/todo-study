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

## 開発環境のセットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

## プロジェクト構造

```
ai-study-planner/
├── frontend/          # Reactフロントエンド
├── backend/           # Express APIサーバー
├── shared/            # 共通の型定義など
└── database/          # データベーススキーマ