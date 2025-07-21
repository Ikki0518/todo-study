-- 緊急修正：RLSを完全に無効化してカスタム認証システムでのデータアクセスを許可

-- 1. 全てのRLSポリシーを削除
DROP POLICY IF EXISTS "Users can only access their own tasks" ON user_tasks;
DROP POLICY IF EXISTS "Users can only access their own study plans" ON user_study_plans;
DROP POLICY IF EXISTS "Users can only access their own exam dates" ON user_exam_dates;
DROP POLICY IF EXISTS "Require authentication for user tasks" ON user_tasks;
DROP POLICY IF EXISTS "Require authentication for study plans" ON user_study_plans;
DROP POLICY IF EXISTS "Require authentication for exam dates" ON user_exam_dates;
DROP POLICY IF EXISTS "Allow access to user_tasks with user_id" ON user_tasks;
DROP POLICY IF EXISTS "Allow access to user_study_plans with user_id" ON user_study_plans;
DROP POLICY IF EXISTS "Allow access to user_exam_dates with user_id" ON user_exam_dates;

-- 2. RLSを完全に無効化
ALTER TABLE user_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_study_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_exam_dates DISABLE ROW LEVEL SECURITY;

-- 3. テスト用データ挿入（動作確認用）
INSERT INTO user_tasks (user_id, tasks_data) 
VALUES ('test-user-rls-disabled', '{"test": "RLS disabled successfully"}')
ON CONFLICT (user_id) DO UPDATE SET 
    tasks_data = '{"test": "RLS disabled successfully"}',
    updated_at = NOW();

-- 4. 動作確認用クエリ
SELECT 
    'RLS無効化完了' as status,
    count(*) as user_tasks_count
FROM user_tasks;

-- 5. 確認メッセージ
SELECT 'カスタム認証システム用にRLSが完全に無効化されました。これでデータの保存・読み込みが可能になります。' as message;