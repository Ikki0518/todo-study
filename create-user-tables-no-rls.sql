-- ユーザーのタスクデータを保存するテーブル（RLS無効版）
CREATE TABLE IF NOT EXISTS user_tasks (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  tasks_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ユーザーの学習計画データを保存するテーブル（RLS無効版）
CREATE TABLE IF NOT EXISTS user_study_plans (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  study_plans JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ユーザーの受験日データを保存するテーブル（RLS無効版）
CREATE TABLE IF NOT EXISTS user_exam_dates (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  exam_dates JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスを作成してパフォーマンスを向上
CREATE INDEX IF NOT EXISTS idx_user_tasks_user_id ON user_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_study_plans_user_id ON user_study_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_exam_dates_user_id ON user_exam_dates(user_id);

-- RLSを無効化（開発・テスト用）
ALTER TABLE user_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_study_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_exam_dates DISABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can only access their own tasks" ON user_tasks;
DROP POLICY IF EXISTS "Users can only access their own study plans" ON user_study_plans;
DROP POLICY IF EXISTS "Users can only access their own exam dates" ON user_exam_dates;

-- 更新時刻を自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 既存のトリガーを削除（存在する場合）
DROP TRIGGER IF EXISTS update_user_tasks_updated_at ON user_tasks;
DROP TRIGGER IF EXISTS update_user_study_plans_updated_at ON user_study_plans;
DROP TRIGGER IF EXISTS update_user_exam_dates_updated_at ON user_exam_dates;

-- 各テーブルに更新時刻トリガーを設定
CREATE TRIGGER update_user_tasks_updated_at 
  BEFORE UPDATE ON user_tasks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_study_plans_updated_at 
  BEFORE UPDATE ON user_study_plans 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_exam_dates_updated_at 
  BEFORE UPDATE ON user_exam_dates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- テーブル作成完了メッセージ
SELECT 'ユーザーデータテーブル作成完了（RLS無効版）' as status;