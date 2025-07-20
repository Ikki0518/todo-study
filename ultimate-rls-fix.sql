-- 最終的なRLSポリシー修正スクリプト
-- このスクリプトは段階的にRLSポリシーを修正し、確実にエラーを解決します

-- ========================================
-- STEP 1: 現在の状況を診断
-- ========================================

-- 現在のポリシー一覧
SELECT 'Current Policies:' as step;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('user_tasks', 'user_study_plans', 'user_exam_dates')
ORDER BY tablename, policyname;

-- テーブルのRLS状態
SELECT 'RLS Status:' as step;
SELECT schemaname, tablename, rowsecurity, forcerowsecurity
FROM pg_tables 
WHERE tablename IN ('user_tasks', 'user_study_plans', 'user_exam_dates');

-- 権限状況
SELECT 'Current Privileges:' as step;
SELECT grantee, table_name, privilege_type
FROM information_schema.table_privileges
WHERE table_name IN ('user_tasks', 'user_study_plans', 'user_exam_dates')
AND grantee IN ('authenticated', 'anon', 'public')
ORDER BY table_name, grantee;

-- ========================================
-- STEP 2: 完全なクリーンアップ
-- ========================================

-- 全てのポリシーを削除
DROP POLICY IF EXISTS "Enable all operations for authenticated users on user_tasks" ON user_tasks;
DROP POLICY IF EXISTS "Enable all operations for authenticated users on user_study_plans" ON user_study_plans;
DROP POLICY IF EXISTS "Enable all operations for authenticated users on user_exam_dates" ON user_exam_dates;
DROP POLICY IF EXISTS "user_tasks_policy" ON user_tasks;
DROP POLICY IF EXISTS "user_study_plans_policy" ON user_study_plans;
DROP POLICY IF EXISTS "user_exam_dates_policy" ON user_exam_dates;

-- 他の可能性のあるポリシー名も削除
DROP POLICY IF EXISTS "Users can only access their own tasks" ON user_tasks;
DROP POLICY IF EXISTS "Users can only access their own study plans" ON user_study_plans;
DROP POLICY IF EXISTS "Users can only access their own exam dates" ON user_exam_dates;

SELECT 'All policies dropped' as step;

-- ========================================
-- STEP 3: RLSを一時的に無効化
-- ========================================

ALTER TABLE user_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_study_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_exam_dates DISABLE ROW LEVEL SECURITY;

SELECT 'RLS disabled on all tables' as step;

-- ========================================
-- STEP 4: 権限をリセット
-- ========================================

-- 既存の権限を取り消し
REVOKE ALL ON user_tasks FROM authenticated;
REVOKE ALL ON user_study_plans FROM authenticated;
REVOKE ALL ON user_exam_dates FROM authenticated;

-- 新しい権限を付与
GRANT ALL ON user_tasks TO authenticated;
GRANT ALL ON user_study_plans TO authenticated;
GRANT ALL ON user_exam_dates TO authenticated;

-- シーケンスの権限も確実に付与
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

SELECT 'Privileges reset and granted' as step;

-- ========================================
-- STEP 5: RLSを再有効化
-- ========================================

ALTER TABLE user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_exam_dates ENABLE ROW LEVEL SECURITY;

SELECT 'RLS re-enabled on all tables' as step;

-- ========================================
-- STEP 6: 新しいポリシーを作成（シンプルで確実な方法）
-- ========================================

-- user_tasksテーブル用ポリシー
CREATE POLICY "authenticated_user_tasks_access" ON user_tasks
  FOR ALL 
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- user_study_plansテーブル用ポリシー
CREATE POLICY "authenticated_user_study_plans_access" ON user_study_plans
  FOR ALL 
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- user_exam_datesテーブル用ポリシー
CREATE POLICY "authenticated_user_exam_dates_access" ON user_exam_dates
  FOR ALL 
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

SELECT 'New policies created' as step;

-- ========================================
-- STEP 7: 最終確認
-- ========================================

-- 新しいポリシーの確認
SELECT 'Final Policy Check:' as step;
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename IN ('user_tasks', 'user_study_plans', 'user_exam_dates')
ORDER BY tablename, policyname;

-- 権限の最終確認
SELECT 'Final Privilege Check:' as step;
SELECT grantee, table_name, privilege_type
FROM information_schema.table_privileges
WHERE table_name IN ('user_tasks', 'user_study_plans', 'user_exam_dates')
AND grantee = 'authenticated'
ORDER BY table_name;

-- 成功メッセージ
SELECT 'RLS policies have been completely rebuilt and should now work correctly!' as final_status;

-- ========================================
-- STEP 8: テスト用クエリ（オプション）
-- ========================================

-- 認証されたユーザーでのテストクエリ例
-- SELECT auth.uid() as current_user_id;
-- SELECT * FROM user_tasks WHERE user_id = auth.uid()::text LIMIT 1;