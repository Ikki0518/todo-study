# 🚨 緊急修正手順 - メール確認エラー解決

## 問題
「Email not confirmed」エラーでログインできない

## 即座に実行する手順

### 1. Supabase Dashboard設定変更（最重要）

1. **Supabase Dashboard** を開く
2. **Authentication** をクリック
3. **「Emails」** をクリック
4. **「Confirm signup」** セクションで：
   - ✅ **Enable email confirmations** を **OFF** にする
   - または **「Disable」** ボタンをクリック
5. **Save** をクリック

**代替方法（Emailsで設定が見つからない場合）：**
1. **Authentication** → **「Policies」** をクリック
2. または **「Sign In / Providers」** をクリック
3. Email provider の設定で確認を無効化

### 2. SQLで直接修正（最も確実）

Supabase Dashboard → **SQL Editor** で以下を実行：

```sql
-- 1. 既存の未確認ユーザーを確認済みにする
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 2. 新規ユーザーも自動的に確認済みにするトリガー作成
CREATE OR REPLACE FUNCTION auto_confirm_users()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_confirmed_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. トリガーを設定
DROP TRIGGER IF EXISTS auto_confirm_trigger ON auth.users;
CREATE TRIGGER auto_confirm_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION auto_confirm_users();
```

### 3. テスト

1. アプリをリロード
2. 既存のアカウントでログインを試行
3. 新規登録も試行

## 確認方法

### 設定確認
```sql
-- 認証設定の確認
SELECT * FROM auth.config;
```

### ユーザー状態確認
```sql
-- ユーザーの確認状態をチェック
SELECT 
  email, 
  email_confirmed_at,
  created_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '確認済み'
    ELSE '未確認'
  END as status
FROM auth.users 
ORDER BY created_at DESC;
```

## 注意事項

- この設定は開発環境用です
- 本番環境では適切なメール確認を設定してください
- 設定変更後、数分待ってからテストしてください

## まだエラーが出る場合

1. ブラウザのキャッシュをクリア
2. アプリを完全にリロード
3. 新しいメールアドレスで新規登録を試行