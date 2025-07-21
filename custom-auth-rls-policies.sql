-- カスタム認証システム用RLSポリシー
-- 注意: これは一時的な解決策です。セキュリティを強化するには Supabase 認証への移行を推奨します。

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can only access their own tasks" ON user_tasks;
DROP POLICY IF EXISTS "Users can only access their own study plans" ON user_study_plans;
DROP POLICY IF EXISTS "Users can only access their own exam dates" ON user_exam_dates;
DROP POLICY IF EXISTS "Require authentication for user tasks" ON user_tasks;
DROP POLICY IF EXISTS "Require authentication for study plans" ON user_study_plans;
DROP POLICY IF EXISTS "Require authentication for exam dates" ON user_exam_dates;

-- RLS を再有効化
ALTER TABLE user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_study_plans ENABLE ROW LEVEL SECURITY; 
ALTER TABLE user_exam_dates ENABLE ROW LEVEL SECURITY;

-- カスタム認証用の寛容なポリシーを作成
-- 注意: これはセキュリティレベルが低いため、将来的に Supabase 認証への移行が必要

-- user_tasks テーブル用
CREATE POLICY "Allow access to user_tasks with user_id" ON user_tasks
  FOR ALL 
  USING (true)  -- 一時的に全アクセスを許可
  WITH CHECK (true);

-- user_study_plans テーブル用
CREATE POLICY "Allow access to user_study_plans with user_id" ON user_study_plans
  FOR ALL
  USING (true)  -- 一時的に全アクセスを許可
  WITH CHECK (true);

-- user_exam_dates テーブル用
CREATE POLICY "Allow access to user_exam_dates with user_id" ON user_exam_dates
  FOR ALL
  USING (true)  -- 一時的に全アクセスを許可
  WITH CHECK (true);

-- 確認メッセージ
SELECT 'カスタム認証用RLSポリシーが適用されました。セキュリティ向上のため、将来的にSupabase認証への移行を検討してください。' as message;