-- セットアップ確認用SQLスクリプト
-- このスクリプトを実行して、データベースが正しく設定されているかを確認できます

-- ========================================
-- 1. テーブル存在確認
-- ========================================

SELECT 'テーブル存在確認' as check_type;

SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('profiles', 'tenants') THEN '✅ 存在'
    ELSE '❌ 不存在'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'tenants')
ORDER BY table_name;

-- ========================================
-- 2. カラム構造確認
-- ========================================

SELECT 'profilesテーブル構造確認' as check_type;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ========================================
-- 3. インデックス確認
-- ========================================

SELECT 'インデックス確認' as check_type;

SELECT 
  indexname,
  tablename,
  CASE 
    WHEN indexname LIKE 'idx_profiles_%' THEN '✅ 正常'
    ELSE '⚠️ 確認要'
  END as status
FROM pg_indexes 
WHERE tablename = 'profiles'
AND schemaname = 'public';

-- ========================================
-- 4. RLS (Row Level Security) 確認
-- ========================================

SELECT 'RLS設定確認' as check_type;

SELECT 
  tablename,
  rowsecurity,
  CASE 
    WHEN rowsecurity = true THEN '✅ 有効'
    ELSE '❌ 無効'
  END as rls_status
FROM pg_tables 
WHERE tablename IN ('profiles', 'tenants')
AND schemaname = 'public';

-- ========================================
-- 5. ポリシー確認
-- ========================================

SELECT 'RLSポリシー確認' as check_type;

SELECT 
  policyname,
  tablename,
  cmd,
  CASE 
    WHEN policyname IS NOT NULL THEN '✅ 設定済み'
    ELSE '❌ 未設定'
  END as policy_status
FROM pg_policies 
WHERE tablename = 'profiles'
AND schemaname = 'public';

-- ========================================
-- 6. 関数確認
-- ========================================

SELECT '関数確認' as check_type;

SELECT 
  routine_name,
  routine_type,
  CASE 
    WHEN routine_name IN ('get_role_from_user_id', 'get_tenant_code_from_user_id', 'get_next_user_id_number') 
    THEN '✅ 存在'
    ELSE '⚠️ 確認要'
  END as function_status
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name LIKE 'get_%'
ORDER BY routine_name;

-- ========================================
-- 7. テナントデータ確認
-- ========================================

SELECT 'テナントデータ確認' as check_type;

SELECT 
  code,
  name,
  description,
  created_at,
  CASE 
    WHEN code IN ('PM', 'TM') THEN '✅ デフォルトテナント'
    ELSE '📝 カスタムテナント'
  END as tenant_type
FROM tenants
ORDER BY code;

-- ========================================
-- 8. 関数動作テスト
-- ========================================

SELECT '関数動作テスト' as check_type;

-- ロール判定テスト
SELECT 
  'get_role_from_user_id' as function_name,
  'PM-0001' as test_input,
  get_role_from_user_id('PM-0001') as result,
  CASE 
    WHEN get_role_from_user_id('PM-0001') = 'TEACHER' THEN '✅ 正常'
    ELSE '❌ 異常'
  END as test_status

UNION ALL

SELECT 
  'get_role_from_user_id' as function_name,
  'PM-0100' as test_input,
  get_role_from_user_id('PM-0100') as result,
  CASE 
    WHEN get_role_from_user_id('PM-0100') = 'STUDENT' THEN '✅ 正常'
    ELSE '❌ 異常'
  END as test_status

UNION ALL

-- テナントコード抽出テスト
SELECT 
  'get_tenant_code_from_user_id' as function_name,
  'PM-0042' as test_input,
  get_tenant_code_from_user_id('PM-0042') as result,
  CASE 
    WHEN get_tenant_code_from_user_id('PM-0042') = 'PM' THEN '✅ 正常'
    ELSE '❌ 異常'
  END as test_status

UNION ALL

-- 次のID番号取得テスト
SELECT 
  'get_next_user_id_number' as function_name,
  'PM, TEACHER' as test_input,
  get_next_user_id_number('PM', 'TEACHER')::text as result,
  CASE 
    WHEN get_next_user_id_number('PM', 'TEACHER') = 1 THEN '✅ 正常'
    ELSE '⚠️ データ依存'
  END as test_status

UNION ALL

SELECT 
  'get_next_user_id_number' as function_name,
  'PM, STUDENT' as test_input,
  get_next_user_id_number('PM', 'STUDENT')::text as result,
  CASE 
    WHEN get_next_user_id_number('PM', 'STUDENT') = 100 THEN '✅ 正常'
    ELSE '⚠️ データ依存'
  END as test_status;

-- ========================================
-- 9. 現在のデータ統計
-- ========================================

SELECT 'データ統計' as check_type;

SELECT 
  'profiles' as table_name,
  COUNT(*) as record_count,
  COUNT(DISTINCT tenant_code) as tenant_count,
  COUNT(CASE WHEN role = 'TEACHER' THEN 1 END) as teacher_count,
  COUNT(CASE WHEN role = 'STUDENT' THEN 1 END) as student_count
FROM profiles

UNION ALL

SELECT 
  'tenants' as table_name,
  COUNT(*) as record_count,
  NULL as tenant_count,
  NULL as teacher_count,
  NULL as student_count
FROM tenants;

-- ========================================
-- 10. セットアップ完了確認
-- ========================================

SELECT 'セットアップ完了確認' as check_type;

WITH setup_check AS (
  SELECT 
    -- テーブル存在確認
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'public' AND table_name IN ('profiles', 'tenants')) = 2 as tables_exist,
    
    -- RLS確認
    (SELECT COUNT(*) FROM pg_tables 
     WHERE tablename = 'profiles' AND schemaname = 'public' AND rowsecurity = true) = 1 as rls_enabled,
    
    -- 関数確認
    (SELECT COUNT(*) FROM information_schema.routines 
     WHERE routine_schema = 'public' 
     AND routine_name IN ('get_role_from_user_id', 'get_next_user_id_number')) = 2 as functions_exist,
    
    -- テナント確認
    (SELECT COUNT(*) FROM tenants WHERE code IN ('PM', 'TM')) >= 2 as default_tenants_exist
)
SELECT 
  CASE 
    WHEN tables_exist AND rls_enabled AND functions_exist AND default_tenants_exist 
    THEN '🎉 セットアップ完了！すべて正常です。'
    ELSE '⚠️ セットアップに問題があります。上記の結果を確認してください。'
  END as setup_status,
  tables_exist,
  rls_enabled,
  functions_exist,
  default_tenants_exist
FROM setup_check;

-- ========================================
-- 11. 次のステップ
-- ========================================

SELECT '次のステップ' as check_type;

SELECT 
  '1. アプリケーションを起動: npm run dev' as step
UNION ALL
SELECT 
  '2. ブラウザでアクセス: http://localhost:3000' as step
UNION ALL
SELECT 
  '3. 新規登録でテスト用ユーザーを作成' as step
UNION ALL
SELECT 
  '4. 生成されたユーザーIDでログインテスト' as step
UNION ALL
SELECT 
  '5. 問題があれば SETUP_GUIDE.md を参照' as step;