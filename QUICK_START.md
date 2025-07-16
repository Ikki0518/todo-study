# 🚀 クイックスタートガイド - 5分でセットアップ

このガイドでは、最短でシステムを動作させるための手順を説明します。

## 📋 事前準備チェックリスト

- [ ] Supabaseアカウント作成済み
- [ ] Supabaseプロジェクト作成済み
- [ ] Node.js インストール済み
- [ ] プロジェクトをクローン済み

## ⚡ 5分セットアップ

### ステップ1: 環境変数設定 (1分)

1. Supabase Dashboard → Settings → API
2. 以下をコピー：
   ```
   Project URL: https://xxxxx.supabase.co
   anon public key: eyJhbGciOiJIUzI1NiIs...
   ```
3. `todo-study/.env` ファイルを作成：
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
   ```

### ステップ2: データベース作成 (2分)

1. Supabase Dashboard → SQL Editor
2. 「New query」をクリック
3. 以下をコピー&ペーストして実行：

```sql
-- 基本テーブル作成
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id VARCHAR(10) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20),
  role VARCHAR(20) NOT NULL CHECK (role IN ('TEACHER', 'STUDENT')),
  tenant_code VARCHAR(10) NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_auth_id ON profiles(auth_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_code ON profiles(tenant_code);

-- デフォルトテナント
INSERT INTO tenants (code, name, description) VALUES 
('PM', 'プライムメソッド', 'プライムメソッド学習塾'),
('TM', 'トップメソッド', 'トップメソッド学習塾')
ON CONFLICT (code) DO NOTHING;

-- RLS設定
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

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

### ステップ3: ヘルパー関数作成 (1分)

新しいクエリで以下を実行：

```sql
-- ID生成用関数
CREATE OR REPLACE FUNCTION get_next_user_id_number(tenant_code_param VARCHAR(10), role_param VARCHAR(20))
RETURNS INTEGER AS $$
DECLARE
  min_id INTEGER;
  max_id INTEGER;
  next_id INTEGER;
BEGIN
  IF role_param = 'TEACHER' THEN
    min_id := 1;
    max_id := 99;
  ELSE
    min_id := 100;
    max_id := 9999;
  END IF;
  
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

-- ロール判定関数
CREATE OR REPLACE FUNCTION get_role_from_user_id(user_id_param VARCHAR(10))
RETURNS VARCHAR(20) AS $$
DECLARE
  id_number INTEGER;
BEGIN
  id_number := CAST(SUBSTRING(user_id_param FROM '\-(\d{4})$') AS INTEGER);
  IF id_number >= 1 AND id_number <= 99 THEN
    RETURN 'TEACHER';
  ELSE
    RETURN 'STUDENT';
  END IF;
END;
$$ LANGUAGE plpgsql;
```

### ステップ4: アプリ起動 (1分)

```bash
cd todo-study
npm install
npm run dev
```

## ✅ 動作確認

### 新規登録テスト
1. ブラウザで `http://localhost:3000` にアクセス
2. 「新規登録」をクリック
3. 以下を入力：
   - メールアドレス: `teacher@test.com`
   - 名前: `テスト講師`
   - 電話番号: `090-1234-5678`
   - 塾コード: `PM`
   - ロール: `講師`
   - パスワード: `password123`
4. 登録完了後、`PM-0001` のようなIDが生成される

### ログインテスト
1. 「ログイン」→「ユーザーID」を選択
2. 生成されたID（例: `PM-0001`）とパスワードでログイン
3. 講師ダッシュボードが表示される

## 🔧 トラブルシューティング

### エラー: "relation 'profiles' does not exist"
→ ステップ2のSQL実行を確認

### エラー: "Invalid login credentials"
→ メールアドレスとパスワードが正しいか確認

### エラー: "ユーザーが見つかりません"
→ Supabase認証とプロファイルの紐付けを確認

## 📚 詳細ガイド

より詳しい設定については以下を参照：
- [`SETUP_GUIDE.md`](./SETUP_GUIDE.md) - 詳細なセットアップ手順
- [`README_USER_ID_SYSTEM.md`](./README_USER_ID_SYSTEM.md) - システム仕様書

## 🎯 次のステップ

1. **追加テナントの作成**:
   ```sql
   INSERT INTO tenants (code, name, description) VALUES 
   ('YOUR_CODE', 'あなたの塾名', '説明');
   ```

2. **カスタマイズ**:
   - ID番号帯の変更
   - 新しいロールの追加
   - UI/UXの調整

3. **本番環境展開**:
   - セキュリティ設定の確認
   - バックアップ設定
   - 監視設定

## 💡 ヒント

- **開発時**: サンプルデータを使用して動作確認
- **本番時**: 実際のユーザーデータで段階的に移行
- **監視**: 定期的にID使用率をチェック

---

🎉 **セットアップ完了！** 
これで講師・生徒ID自動生成システムが動作します。