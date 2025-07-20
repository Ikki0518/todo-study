-- 緊急RLSポリシー無効化スクリプト
-- 一時的にRLSを完全に無効化してテストする

-- ========================================
-- STEP 1: 現在の状況確認
-- ========================================

SELECT 'Current RLS Status:' as step;
SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE tablename IN ('user_tasks', 'user_study_plans', 'user_exam_dates');

-- ========================================
-- STEP 2: 全てのRLSポリシーを削除
-- ========================================

-- user_tasksテーブルの全ポリシー削除
DO $$ 
DECLARE 
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'user_tasks'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON user_tasks';
    END LOOP;
END $$;

-- user_study_plansテーブルの全ポリシー削除
DO $$ 
DECLARE 
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'user_study_plans'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON user_study_plans';
    END LOOP;
END $$;

-- user_exam_datesテーブルの全ポリシー削除
DO $$ 
DECLARE 
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'user_exam_dates'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON user_exam_dates';
    END LOOP;
END $$;

SELECT 'All policies dropped' as step;

-- ========================================
-- STEP 3: RLSを完全に無効化
-- ========================================

ALTER TABLE user_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_study_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_exam_dates DISABLE ROW LEVEL SECURITY;

SELECT 'RLS completely disabled' as step;

-- ========================================
-- STEP 4: 権限を最大限に付与
-- ========================================

-- authenticatedロールに全権限を付与
GRANT ALL PRIVILEGES ON user_tasks TO authenticated;
GRANT ALL PRIVILEGES ON user_study_plans TO authenticated;
GRANT ALL PRIVILEGES ON user_exam_dates TO authenticated;

-- anonロールにも権限を付与（テスト用）
GRANT ALL PRIVILEGES ON user_tasks TO anon;
GRANT ALL PRIVILEGES ON user_study_plans TO anon;
GRANT ALL PRIVILEGES ON user_exam_dates TO anon;

-- publicロールにも権限を付与
GRANT ALL PRIVILEGES ON user_tasks TO public;
GRANT ALL PRIVILEGES ON user_study_plans TO public;
GRANT ALL PRIVILEGES ON user_exam_dates TO public;

-- シーケンスの権限も付与
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO public;

SELECT 'Maximum privileges granted' as step;

-- ========================================
-- STEP 5: 最終確認
-- ========================================

SELECT 'Final Status Check:' as step;

-- RLS状態確認
SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE tablename IN ('user_tasks', 'user_study_plans', 'user_exam_dates');

-- ポリシー確認（空であることを確認）
SELECT COUNT(*) as remaining_policies
FROM pg_policies 
WHERE tablename IN ('user_tasks', 'user_study_plans', 'user_exam_dates');

-- 権限確認
SELECT grantee, table_name, privilege_type
FROM information_schema.table_privileges
WHERE table_name IN ('user_tasks', 'user_study_plans', 'user_exam_dates')
ORDER BY table_name, grantee;

SELECT 'RLS has been completely disabled for testing. This should resolve all permission issues.' as final_status;