-- RLSポリシーを修正（Supabase認証システムに対応）

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can only access their own tasks" ON user_tasks;
DROP POLICY IF EXISTS "Users can only access their own study plans" ON user_study_plans;
DROP POLICY IF EXISTS "Users can only access their own exam dates" ON user_exam_dates;

-- 修正されたRLSポリシーを作成（auth.uid()を使用）
CREATE POLICY "Users can only access their own tasks" ON user_tasks
  FOR ALL USING (user_id = auth.uid()::text);

CREATE POLICY "Users can only access their own study plans" ON user_study_plans
  FOR ALL USING (user_id = auth.uid()::text);

CREATE POLICY "Users can only access their own exam dates" ON user_exam_dates
  FOR ALL USING (user_id = auth.uid()::text);

-- INSERTポリシーも追加（新規データ作成用）
CREATE POLICY "Users can insert their own tasks" ON user_tasks
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can insert their own study plans" ON user_study_plans
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can insert their own exam dates" ON user_exam_dates
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);