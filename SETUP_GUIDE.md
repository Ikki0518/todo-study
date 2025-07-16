# 講師・生徒ID自動生成システム セットアップガイド

このガイドでは、実際にSupabaseでデータベースを設定し、システムを動作させるための具体的な手順を説明します。

## 前提条件

- Supabaseアカウントが作成済み
- プロジェクトが作成済み
- `.env`ファイルにSupabaseの設定が記載済み

## ステップ1: Supabaseプロジェクトの確認

### 1.1 プロジェクト情報の確認
1. [Supabase Dashboard](https://app.supabase.com) にログイン
2. 対象のプロジェクトを選択
3. 左サイドバーの「Settings」→「API」をクリック
4. 以下の情報をメモ：
   - **Project URL** (例: `https://xxxxx.supabase.co`)
   - **anon public key** (例: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### 1.2 環境変数の設定確認
`todo-study/.env`ファイルを確認：
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## ステップ2: データベーステーブルの作成

### 2.1 SQLエディタでのテーブル作成
1. Supabase Dashboardで左サイドバーの「SQL Editor」をクリック
2. 「New query」をクリック
3. 以下のSQLを実行：

#### 基本テーブルの作成
```sql
-- ユーザープロファイルテーブル（新システム）
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id VARCHAR(10) UNIQUE NOT NULL, -- PM-0001 形式のユーザーID
  email VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20),
  role VARCHAR(20) NOT NULL CHECK (role IN ('TEACHER', 'STUDENT')),
  tenant_code VARCHAR(10) NOT NULL, -- 塾コード (PM, TM など)
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_auth_id ON profiles(auth_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_code ON profiles(tenant_code);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_role ON profiles(tenant_code, role);

-- テナント情報テーブル
CREATE TABLE IF NOT EXISTS tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL, -- PM, TM など
  name VARCHAR(100) NOT NULL, -- 塾名
  description TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- デフォルトテナントを挿入
INSERT INTO tenants (code, name, description) VALUES 
('PM', 'プライムメソッド', 'プライムメソッド学習塾'),
('TM', 'トップメソッド', 'トップメソッド学習塾')
ON CONFLICT (code) DO NOTHING;
```

4. 「RUN」ボタンをクリックして実行

### 2.2 Row Level Security (RLS) の設定
新しいクエリで以下を実行：

```sql
-- RLS (Row Level Security) ポリシー設定
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- プロファイルのRLSポリシー
CREATE POLICY "Users can view profiles in same tenant" ON profiles
  FOR SELECT USING (
    tenant_code = (
      SELECT tenant_code FROM profiles 
      WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth_id = auth.uid());

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth_id = auth.uid());
```

### 2.3 ヘルパー関数の作成
新しいクエリで以下を実行：

```sql
-- 関数: ユーザーIDからロールを取得
CREATE OR REPLACE FUNCTION get_role_from_user_id(user_id_param VARCHAR(10))
RETURNS VARCHAR(20) AS $$
DECLARE
  id_number INTEGER;
BEGIN
  -- ユーザーIDから番号部分を抽出 (例: PM-0042 -> 42)
  id_number := CAST(SUBSTRING(user_id_param FROM '\-(\d{4})$') AS INTEGER);
  
  -- 番号に基づいてロールを判定
  IF id_number >= 1 AND id_number <= 99 THEN
    RETURN 'TEACHER';
  ELSE
    RETURN 'STUDENT';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 関数: テナントコードをユーザーIDから抽出
CREATE OR REPLACE FUNCTION get_tenant_code_from_user_id(user_id_param VARCHAR(10))
RETURNS VARCHAR(10) AS $$
BEGIN
  -- ユーザーIDからテナントコード部分を抽出 (例: PM-0042 -> PM)
  RETURN SUBSTRING(user_id_param FROM '^([A-Z]+)\-');
END;
$$ LANGUAGE plpgsql;

-- 関数: 次に利用可能なユーザーID番号を取得
CREATE OR REPLACE FUNCTION get_next_user_id_number(tenant_code_param VARCHAR(10), role_param VARCHAR(20))
RETURNS INTEGER AS $$
DECLARE
  min_id INTEGER;
  max_id INTEGER;
  next_id INTEGER;
BEGIN
  -- ロールに基づいて範囲を設定
  IF role_param = 'TEACHER' THEN
    min_id := 1;
    max_id := 99;
  ELSE
    min_id := 100;
    max_id := 9999;
  END IF;
  
  -- 既存のIDから次に利用可能な番号を見つける
  SELECT COALESCE(MIN(t.id), min_id) INTO next_id
  FROM (
    SELECT generate_series(min_id, max_id) AS id
    EXCEPT
    SELECT CAST(SUBSTRING(user_id FROM '\-(\d{4})$') AS INTEGER)
    FROM profiles
    WHERE tenant_code = tenant_code_param
    AND user_id ~ ('^' || tenant_code_param || '\-\d{4}$')
    AND CAST(SUBSTRING(user_id FROM '\-(\d{4})$') AS INTEGER) BETWEEN min_id AND max_id
  ) t;
  
  RETURN next_id;
END;
$$ LANGUAGE plpgsql;
```

## ステップ3: テスト用データの投入（オプション）

### 3.1 サンプルデータの作成
開発・テスト用にサンプルデータを投入する場合：

```sql
-- 注意: auth_idは実際のSupabase認証ユーザーのUUIDに置き換える必要があります
-- テスト用なので仮のUUIDを使用

-- PMテナントの講師（テスト用）
INSERT INTO profiles (auth_id, user_id, email, name, phone_number, role, tenant_code) VALUES 
('00000000-0000-0000-0000-000000000001', 'PM-0001', 'teacher1@pm.com', '田中先生', '090-1111-1111', 'TEACHER', 'PM')
ON CONFLICT (user_id) DO NOTHING;

-- PMテナントの生徒（テスト用）
INSERT INTO profiles (auth_id, user_id, email, name, phone_number, role, tenant_code) VALUES 
('00000000-0000-0000-0000-000000000101', 'PM-0100', 'student1@pm.com', '山田太郎', '090-2222-1111', 'STUDENT', 'PM')
ON CONFLICT (user_id) DO NOTHING;
```

### 3.2 統計確認用ビューの作成
```sql
-- 統計確認用のビュー作成
CREATE OR REPLACE VIEW tenant_statistics AS
SELECT 
  t.code as tenant_code,
  t.name as tenant_name,
  COUNT(CASE WHEN p.role = 'TEACHER' THEN 1 END) as teacher_count,
  COUNT(CASE WHEN p.role = 'STUDENT' THEN 1 END) as student_count,
  COUNT(p.id) as total_users
FROM tenants t
LEFT JOIN profiles p ON t.code = p.tenant_code
GROUP BY t.code, t.name
ORDER BY t.code;

-- ユーザーID生成状況確認用のビュー
CREATE OR REPLACE VIEW user_id_usage AS
SELECT 
  tenant_code,
  role,
  COUNT(*) as used_count,
  CASE 
    WHEN role = 'TEACHER' THEN 99
    ELSE 9900
  END as max_capacity,
  ROUND(
    COUNT(*) * 100.0 / 
    CASE 
      WHEN role = 'TEACHER' THEN 99
      ELSE 9900
    END, 2
  ) as usage_percentage
FROM profiles
GROUP BY tenant_code, role
ORDER BY tenant_code, role;
```

## ステップ4: 動作確認

### 4.1 テーブル作成の確認
1. Supabase Dashboardで「Table Editor」をクリック
2. 以下のテーブルが作成されていることを確認：
   - `profiles`
   - `tenants`

### 4.2 データの確認
```sql
-- テナント一覧の確認
SELECT * FROM tenants;

-- 統計情報の確認
SELECT * FROM tenant_statistics;

-- ユーザーID使用状況の確認
SELECT * FROM user_id_usage;
```

### 4.3 関数の動作確認
```sql
-- ロール判定のテスト
SELECT get_role_from_user_id('PM-0001'); -- TEACHER が返される
SELECT get_role_from_user_id('PM-0100'); -- STUDENT が返される

-- テナントコード抽出のテスト
SELECT get_tenant_code_from_user_id('PM-0042'); -- PM が返される

-- 次のID番号取得のテスト
SELECT get_next_user_id_number('PM', 'TEACHER'); -- 1 が返される（データがない場合）
SELECT get_next_user_id_number('PM', 'STUDENT'); -- 100 が返される（データがない場合）
```

## ステップ5: アプリケーションでのテスト

### 5.1 新規登録のテスト
1. ブラウザで `http://localhost:3000` にアクセス
2. 「新規登録」をクリック
3. 以下の情報を入力：
   - メールアドレス: `test@example.com`
   - 名前: `テストユーザー`
   - 電話番号: `090-1234-5678`
   - 塾コード: `PM`
   - ロール: `講師` または `生徒`
   - パスワード: `password123`
   - パスワード確認: `password123`
4. 「新規登録」をクリック
5. 生成されたユーザーIDが表示されることを確認

### 5.2 ログインのテスト
1. 生成されたユーザーIDでログインを試行
2. 正しいダッシュボード（講師用/生徒用）が表示されることを確認

## ステップ6: トラブルシューティング

### 6.1 よくあるエラーと解決方法

#### エラー: "relation 'profiles' does not exist"
**原因**: テーブルが作成されていない  
**解決策**: ステップ2.1を再実行

#### エラー: "permission denied for table profiles"
**原因**: RLSポリシーが正しく設定されていない  
**解決策**: ステップ2.2を再実行

#### エラー: "function get_next_user_id_number does not exist"
**原因**: ヘルパー関数が作成されていない  
**解決策**: ステップ2.3を再実行

#### エラー: "Invalid login credentials"
**原因**: Supabase認証ユーザーとプロファイルの紐付けが正しくない  
**解決策**: 
1. Supabase Dashboardの「Authentication」→「Users」で認証ユーザーを確認
2. `profiles`テーブルの`auth_id`が正しく設定されているか確認

### 6.2 デバッグ用SQL

#### 現在のユーザー情報確認
```sql
-- 現在ログイン中のユーザーのauth.uid()を確認
SELECT auth.uid();

-- 特定のauth_idのプロファイル確認
SELECT * FROM profiles WHERE auth_id = 'ここにauth.uid()の値を入力';
```

#### データ整合性チェック
```sql
-- auth.usersとprofilesの整合性確認
SELECT 
  au.id as auth_id,
  au.email as auth_email,
  p.user_id,
  p.email as profile_email,
  p.role,
  p.tenant_code
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.auth_id
ORDER BY au.created_at DESC;
```

## ステップ7: 本番環境への展開

### 7.1 セキュリティチェック
- [ ] RLSポリシーが全テーブルで有効
- [ ] 適切なインデックスが設定済み
- [ ] 不要なサンプルデータが削除済み
- [ ] 環境変数が正しく設定済み

### 7.2 パフォーマンス最適化
- [ ] 頻繁に使用されるクエリのインデックス確認
- [ ] 統計情報の更新
- [ ] 不要なデータの削除

### 7.3 バックアップ設定
- [ ] 定期バックアップの設定
- [ ] 重要データの冗長化
- [ ] 災害復旧計画の策定

## 追加リソース

- [Supabase公式ドキュメント](https://supabase.com/docs)
- [PostgreSQL関数リファレンス](https://www.postgresql.org/docs/current/functions.html)
- [Row Level Security ガイド](https://supabase.com/docs/guides/auth/row-level-security)

## サポート

問題が発生した場合は、以下の情報を含めて報告してください：
- 実行したSQL文
- エラーメッセージの全文
- Supabaseプロジェクトの設定情報
- ブラウザのコンソールログ