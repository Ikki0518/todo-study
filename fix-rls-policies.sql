-- RLSポリシーを匿名アクセス対応に修正

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can only access their own tasks" ON user_tasks;
DROP POLICY IF EXISTS "Users can only access their own study plans" ON user_study_plans;
DROP POLICY IF EXISTS "Users can only access their own exam dates" ON user_exam_dates;

-- 匿名アクセス対応のポリシーを作成
-- user_tasksテーブル用
CREATE POLICY "Allow anonymous access to user_tasks" ON user_tasks
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- user_study_plansテーブル用
CREATE POLICY "Allow anonymous access to user_study_plans" ON user_study_plans
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- user_exam_datesテーブル用
CREATE POLICY "Allow anonymous access to user_exam_dates" ON user_exam_dates
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- 匿名ユーザーに対してテーブルへのアクセス権限を付与
GRANT ALL ON user_tasks TO anon;
GRANT ALL ON user_study_plans TO anon;
GRANT ALL ON user_exam_dates TO anon;

-- シーケンスへのアクセス権限も付与
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;