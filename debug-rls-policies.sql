-- RLSポリシーの診断と修正スクリプト

-- 1. 現在のRLSポリシーの状態を確認
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('user_tasks', 'user_study_plans', 'user_exam_dates');

-- 2. テーブルのRLS有効状態を確認
SELECT schemaname, tablename, rowsecurity, forcerowsecurity
FROM pg_tables 
WHERE tablename IN ('user_tasks', 'user_study_plans', 'user_exam_dates');

-- 3. 現在のユーザー権限を確認
SELECT grantee, table_name, privilege_type
FROM information_schema.table_privileges
WHERE table_name IN ('user_tasks', 'user_study_plans', 'user_exam_dates')
AND grantee = 'authenticated';

-- 4. 全てのポリシーを削除して再作成
DROP POLICY IF EXISTS "Enable all operations for authenticated users on user_tasks" ON user_tasks;
DROP POLICY IF EXISTS "Enable all operations for authenticated users on user_study_plans" ON user_study_plans;
DROP POLICY IF EXISTS "Enable all operations for authenticated users on user_exam_dates" ON user_exam_dates;

-- 5. RLSを無効化してから再有効化
ALTER TABLE user_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_study_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_exam_dates DISABLE ROW LEVEL SECURITY;

ALTER TABLE user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_exam_dates ENABLE ROW LEVEL SECURITY;

-- 6. 新しいポリシーを作成（より具体的に）
CREATE POLICY "user_tasks_policy" ON user_tasks
  FOR ALL 
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "user_study_plans_policy" ON user_study_plans
  FOR ALL 
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "user_exam_dates_policy" ON user_exam_dates
  FOR ALL 
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- 7. 権限を明示的に付与
GRANT ALL ON user_tasks TO authenticated;
GRANT ALL ON user_study_plans TO authenticated;
GRANT ALL ON user_exam_dates TO authenticated;

-- 8. シーケンスへの権限も付与
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 9. 最終確認
SELECT 'RLS policies recreated successfully' as status;