# 認証問題の修正手順

## 問題
- 新規登録後に「メールアドレスが確認されていません」エラー
- usersテーブルにユーザーデータが作成されない

## 修正手順

### 1. Supabase Dashboard設定変更

1. **Supabase Dashboard** にログイン
2. **Authentication** → **Settings** に移動
3. 以下の設定を変更：
   - **Enable email confirmations**: `OFF`に設定
   - **Enable phone confirmations**: `OFF`に設定（使用している場合）

### 2. SQLスクリプト実行

1. **SQL Editor** に移動
2. `fix-auth-issues.sql` の内容をコピー＆ペースト
3. 実行

このスクリプトで以下が設定されます：
- 新規ユーザー登録時の自動プロフィール作成トリガー
- 既存認証ユーザーのusersテーブルへの追加
- RLSポリシーの修正

### 3. 確認方法

#### 認証ユーザーの確認
```sql
-- auth.usersテーブルの確認
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
ORDER BY created_at DESC;
```

#### usersテーブルの確認
```sql
-- public.usersテーブルの確認
SELECT id, name, email, created_at 
FROM public.users 
ORDER BY created_at DESC;
```

### 4. テスト手順

1. 新しいメールアドレスで新規登録
2. 登録後すぐにログインできることを確認
3. usersテーブルにプロフィールが作成されることを確認

### 5. トラブルシューティング

#### まだメール確認エラーが出る場合
1. Supabase Dashboard → Authentication → Settings
2. **Email templates** セクションで **Confirm signup** を確認
3. 必要に応じて無効化

#### usersテーブルにデータが入らない場合
```sql
-- トリガーが正しく作成されているか確認
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 手動でユーザーを追加
INSERT INTO public.users (id, name, email)
VALUES (
  'auth_user_id_here',
  'ユーザー名',
  'email@example.com'
);
```

### 6. 本番環境での注意

開発完了後は以下を再有効化することを推奨：
- Email confirmations
- 適切なセキュリティポリシー