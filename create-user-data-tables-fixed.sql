-- ユーザーのタスクデータを保存するテーブル
CREATE TABLE IF NOT EXISTS user_tasks (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  tasks_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ユーザーの学習計画データを保存するテーブル
CREATE TABLE IF NOT EXISTS user_study_plans (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  study_plans JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ユーザーの受験日データを保存するテーブル
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

-- Row Level Security (RLS) を有効化
ALTER TABLE user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_exam_dates ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Users can only access their own tasks" ON user_tasks;
DROP POLICY IF EXISTS "Users can only access their own study plans" ON user_study_plans;
DROP POLICY IF EXISTS "Users can only access their own exam dates" ON user_exam_dates;

-- RLSポリシーを作成（ユーザーは自分のデータのみアクセス可能）
CREATE POLICY "Users can only access their own tasks" ON user_tasks
  FOR ALL USING (user_id = current_user::text);

CREATE POLICY "Users can only access their own study plans" ON user_study_plans
  FOR ALL USING (user_id = current_user::text);

CREATE POLICY "Users can only access their own exam dates" ON user_exam_dates
  FOR ALL USING (user_id = current_user::text);

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