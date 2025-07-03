-- データベースセットアップの確認クエリ

-- 1. 作成されたテーブル一覧
SELECT 'Tables created:' as check_type, table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. 各テーブルの列数確認
SELECT 
    'Column counts:' as check_type,
    table_name,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_schema = 'public' 
GROUP BY table_name
ORDER BY table_name;

-- 3. RLSポリシー確認
SELECT 
    'RLS policies:' as check_type,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 4. インデックス確認
SELECT 
    'Indexes:' as check_type,
    indexname
FROM pg_indexes 
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY indexname;