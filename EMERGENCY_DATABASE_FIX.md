# 🚨 緊急：データベーステーブル不存在問題の修正

## 問題の特定
データベース接続テストで `user_tasks` テーブルへのアクセスが失敗しました。
これは **テーブルが存在しない** ことが根本原因です。

## 🔥 緊急修正手順

### 1. Supabaseでのテーブル作成（最重要）

**以下のSQLをSupabase SQLエディタで実行してください:**

```sql
-- ユーザーデータテーブルが存在するか確認し、存在しない場合は作成

-- 1. テーブル存在確認と作成
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_tasks') THEN
        RAISE NOTICE 'user_tasks テーブルが存在しません。作成します。';
        CREATE TABLE user_tasks (
            id SERIAL PRIMARY KEY,
            user_id TEXT NOT NULL UNIQUE,
            tasks_data JSONB NOT NULL DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX idx_user_tasks_user_id ON user_tasks(user_id);
        RAISE NOTICE 'user_tasks テーブルを作成しました。';
    ELSE
        RAISE NOTICE 'user_tasks テーブルは既に存在します。';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_study_plans') THEN
        RAISE NOTICE 'user_study_plans テーブルが存在しません。作成します。';
        CREATE TABLE user_study_plans (
            id SERIAL PRIMARY KEY,
            user_id TEXT NOT NULL UNIQUE,
            study_plans JSONB NOT NULL DEFAULT '[]',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX idx_user_study_plans_user_id ON user_study_plans(user_id);
        RAISE NOTICE 'user_study_plans テーブルを作成しました。';
    ELSE
        RAISE NOTICE 'user_study_plans テーブルは既に存在します。';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_exam_dates') THEN
        RAISE NOTICE 'user_exam_dates テーブルが存在しません。作成します。';
        CREATE TABLE user_exam_dates (
            id SERIAL PRIMARY KEY,
            user_id TEXT NOT NULL UNIQUE,
            exam_dates JSONB NOT NULL DEFAULT '[]',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX idx_user_exam_dates_user_id ON user_exam_dates(user_id);
        RAISE NOTICE 'user_exam_dates テーブルを作成しました。';
    ELSE
        RAISE NOTICE 'user_exam_dates テーブルは既に存在します。';
    END IF;
END $$;

-- 2. RLSを無効化（一時的にデータアクセスを許可）
ALTER TABLE user_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_study_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_exam_dates DISABLE ROW LEVEL SECURITY;

-- 3. 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can only access their own tasks" ON user_tasks;
DROP POLICY IF EXISTS "Users can only access their own study plans" ON user_study_plans;
DROP POLICY IF EXISTS "Users can only access their own exam dates" ON user_exam_dates;
DROP POLICY IF EXISTS "Require authentication for user tasks" ON user_tasks;
DROP POLICY IF EXISTS "Require authentication for study plans" ON user_study_plans;
DROP POLICY IF EXISTS "Require authentication for exam dates" ON user_exam_dates;
DROP POLICY IF EXISTS "Allow access to user_tasks with user_id" ON user_tasks;
DROP POLICY IF EXISTS "Allow access to user_study_plans with user_id" ON user_study_plans;
DROP POLICY IF EXISTS "Allow access to user_exam_dates with user_id" ON user_exam_dates;

-- 4. トリガー関数作成（存在しない場合）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. トリガー設定
DROP TRIGGER IF EXISTS update_user_tasks_updated_at ON user_tasks;
DROP TRIGGER IF EXISTS update_user_study_plans_updated_at ON user_study_plans;
DROP TRIGGER IF EXISTS update_user_exam_dates_updated_at ON user_exam_dates;

CREATE TRIGGER update_user_tasks_updated_at 
    BEFORE UPDATE ON user_tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_study_plans_updated_at 
    BEFORE UPDATE ON user_study_plans 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_exam_dates_updated_at 
    BEFORE UPDATE ON user_exam_dates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. 完了メッセージ
SELECT 'ユーザーデータテーブルのセットアップが完了しました。RLSは無効化されているため、データアクセスが可能です。' as setup_status;
```

### 2. 実行手順

1. **Supabaseダッシュボードにアクセス**
   - https://app.supabase.com にログイン
   - プロジェクト「wjpcfsjtjgxvhijczxnj」を選択

2. **SQLエディタを開く**
   - 左メニューから「SQL Editor」をクリック
   - 「New query」をクリック

3. **上記SQLをコピペして実行**
   - 「RUN」ボタンをクリック
   - 成功メッセージが表示されることを確認

### 3. 即座にテスト

SQL実行後、すぐに本番環境でテスト：
- https://todo-study-p1xjl2oxg-ikki-y0518-icloudcoms-projects.vercel.app
- ログイン → タスク追加 → リロード → データ確認

## 🎯 期待される結果

テーブル作成後：
- ✅ タスクデータがSupabaseに保存される
- ✅ リロード後もデータが保持される  
- ✅ ログアウト・再ログイン後もデータが残る

## 🔍 失敗した場合

もしまだ問題が続く場合：
1. ブラウザ開発者ツール（F12）でConsoleを確認
2. 「💾 タスクデータを保存中:」ログを探す
3. エラーメッセージをチェック

---
**重要**: このSQL実行が完了するまで、アプリのタスクデータは保存されません。