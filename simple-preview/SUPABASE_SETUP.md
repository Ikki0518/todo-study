# Supabase データベースセットアップ手順

## 概要
AI学習プランナーアプリケーションのSupabaseデータベースを設定するための手順です。

## 前提条件
- Supabaseプロジェクトが作成済み
- Supabase Dashboard にアクセス可能
- 環境変数（VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY）が設定済み

## 推奨セットアップ手順

### オプション1: 最小限スキーマ（推奨）

1. Supabase Dashboard にログイン
2. 左サイドバーから「SQL Editor」を選択
3. 「New query」をクリック
4. `supabase-minimal-schema.sql` の内容をコピー＆ペースト
5. 「Run」ボタンをクリックして実行

このファイルには以下が含まれています：
- 必要最小限のテーブル（users, goals, tasks, study_sessions, daily_stats）
- 基本インデックス
- Row Level Security (RLS) ポリシー
- トリガー関数
- エラー回避のためのDROP IF EXISTS文

### オプション2: 段階的セットアップ

エラーが発生した場合の代替手順：

1. **テーブル確認**：
   - `check-tables.sql` を実行して現在のテーブル状況を確認

2. **基本テーブル作成**：
   - `supabase-schema-tables.sql` を実行

3. **ビュー作成**（オプション）：
   - `supabase-schema-views.sql` を実行

## 確認方法

### 1. テーブル作成の確認
```sql
-- check-tables.sql を使用するか、以下を実行
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

期待される結果：
- users
- goals
- tasks
- study_sessions
- daily_stats

### 2. RLSポリシーの確認
```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## トラブルシューティング

### よくあるエラーと解決方法

1. **"relation does not exist" エラー**
   - 原因: テーブルが作成されていない
   - 解決: `supabase-minimal-schema.sql` を実行

2. **"column does not exist" エラー**
   - 原因: テーブル構造の不一致
   - 解決: 既存テーブルを削除してから再作成

3. **既存テーブルとの競合**
   - 原因: 以前の不完全なスキーマが残っている
   - 解決: 以下のクリーンアップクエリを実行
   ```sql
   DROP TABLE IF EXISTS daily_stats CASCADE;
   DROP TABLE IF EXISTS study_sessions CASCADE;
   DROP TABLE IF EXISTS tasks CASCADE;
   DROP TABLE IF EXISTS goals CASCADE;
   DROP TABLE IF EXISTS users CASCADE;
   ```
   その後、`supabase-minimal-schema.sql` を実行

### デバッグ用クエリ

```sql
-- 特定のテーブルの構造を確認
\d+ table_name

-- 特定のユーザーのデータを確認
SELECT * FROM users WHERE id = 'user_uuid';

-- RLSが有効になっているか確認
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

## 次のステップ

データベースセットアップが完了したら：

1. アプリケーションを起動
2. 新規ユーザー登録をテスト
3. ログイン機能をテスト
4. データの保存・取得をテスト

## 注意事項

- 本番環境では、サンプルデータの挿入は行わないでください
- RLSポリシーにより、ユーザーは自分のデータのみアクセス可能です
- 定期的にデータベースのバックアップを取ることを推奨します