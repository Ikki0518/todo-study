-- ユーザーデータテーブル用のRLSポリシー修正

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can only access their own tasks" ON user_tasks;
DROP POLICY IF EXISTS "Users can only access their own study plans" ON user_study_plans;
DROP POLICY IF EXISTS "Users can only access their own exam dates" ON user_exam_dates;

-- 正しいSupabase認証ベースのRLSポリシーを作成

-- user_tasksテーブル用ポリシー
CREATE POLICY "Users can only access their own tasks" ON user_tasks
  FOR ALL 
  USING (user_id = (auth.jwt() ->> 'sub')::text OR user_id = auth.uid()::text)
  WITH CHECK (user_id = (auth.jwt() ->> 'sub')::text OR user_id = auth.uid()::text);

-- user_study_plansテーブル用ポリシー  
CREATE POLICY "Users can only access their own study plans" ON user_study_plans
  FOR ALL
  USING (user_id = (auth.jwt() ->> 'sub')::text OR user_id = auth.uid()::text)
  WITH CHECK (user_id = (auth.jwt() ->> 'sub')::text OR user_id = auth.uid()::text);

-- user_exam_datesテーブル用ポリシー
CREATE POLICY "Users can only access their own exam dates" ON user_exam_dates
  FOR ALL
  USING (user_id = (auth.jwt() ->> 'sub')::text OR user_id = auth.uid()::text)
  WITH CHECK (user_id = (auth.jwt() ->> 'sub')::text OR user_id = auth.uid()::text);

-- 認証されていないユーザーはアクセス不可のポリシーも追加
CREATE POLICY "Require authentication for user tasks" ON user_tasks
  FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Require authentication for study plans" ON user_study_plans
  FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Require authentication for exam dates" ON user_exam_dates
  FOR ALL
  USING (auth.role() = 'authenticated');