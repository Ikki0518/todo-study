-- 一時的にRLSを無効化してデータベース接続をテスト

-- RLSを無効化
ALTER TABLE user_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_study_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_exam_dates DISABLE ROW LEVEL SECURITY;

-- 確認用メッセージ
SELECT 'RLSが一時的に無効化されました。データ保存のテスト後、必ずRLSを再有効化してください。' as message;