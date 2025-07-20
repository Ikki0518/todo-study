-- 完全なRLSポリシー修正スクリプト

-- 既存のポリシーを全て削除
DROP POLICY IF EXISTS "Users can only access their own tasks" ON user_tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON user_tasks;
DROP POLICY IF EXISTS "Users can only access their own study plans" ON user_study_plans;
DROP POLICY IF EXISTS "Users can insert their own study plans" ON user_study_plans;
DROP POLICY IF EXISTS "Users can only access their own exam dates" ON user_exam_dates;
DROP POLICY IF EXISTS "Users can insert their own exam dates" ON user_exam_dates;

-- RLSを一時的に無効化してテーブルをクリア（オプション）
-- DELETE FROM user_tasks;
-- DELETE FROM user_study_plans;
-- DELETE FROM user_exam_dates;

-- 新しいRLSポリシーを作成（より柔軟なアプローチ）

-- user_tasks テーブル用ポリシー
CREATE POLICY "Enable all operations for authenticated users on user_tasks" ON user_tasks
  FOR ALL 
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- user_study_plans テーブル用ポリシー
CREATE POLICY "Enable all operations for authenticated users on user_study_plans" ON user_study_plans
  FOR ALL 
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- user_exam_dates テーブル用ポリシー
CREATE POLICY "Enable all operations for authenticated users on user_exam_dates" ON user_exam_dates
  FOR ALL 
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- 認証されたユーザーに対してテーブルへのアクセス権限を付与
GRANT ALL ON user_tasks TO authenticated;
GRANT ALL ON user_study_plans TO authenticated;
GRANT ALL ON user_exam_dates TO authenticated;

-- シーケンスへのアクセス権限も付与
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;