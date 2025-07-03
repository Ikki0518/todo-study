-- メール確認を無効化するSQL（最も確実な方法）

-- 1. 既存の未確認ユーザーをすべて確認済みにする
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- 2. 新規ユーザーも自動的に確認済みにするトリガー
CREATE OR REPLACE FUNCTION auto_confirm_users()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_confirmed_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. 既存のトリガーを削除してから新しいトリガーを作成
DROP TRIGGER IF EXISTS auto_confirm_trigger ON auth.users;
CREATE TRIGGER auto_confirm_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION auto_confirm_users();

-- 4. 確認：すべてのユーザーが確認済みになっているかチェック
SELECT 
  email, 
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ 確認済み'
    ELSE '❌ 未確認'
  END as status
FROM auth.users 
ORDER BY created_at DESC;