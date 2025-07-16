# 講師・生徒ID自動生成システム

このドキュメントでは、React + Supabase で構成された学習管理アプリに導入した講師・生徒IDの自動生成と管理システムについて説明します。

## 概要

### システムの特徴
- **テナント制**: 各校舎（塾）を1つのテナントとして管理
- **自動ID生成**: ロールに応じて自動でユーザーIDを採番
- **ユーザーID認証**: メールアドレスの代わりにユーザーIDでログイン可能
- **ロール自動判定**: ユーザーIDの番号からロールを自動判定

### ID構成ルール
```
[塾コード]-[4桁番号]
例: PM-0042, TM-0001
```

### 番号帯の割り当て
- `0001〜0099`: 講師ID（最大99人）
- `0100〜9999`: 生徒ID（最大9900人）

## アーキテクチャ

### 主要コンポーネント

#### 1. UserIdGenerator (`src/services/userIdGenerator.js`)
- ユーザーIDの自動生成
- 最小未使用番号の採番
- ロール判定とテナントコード抽出
- 統計情報の取得

#### 2. Supabase認証サービス (`src/services/supabase.js`)
- ユーザーID認証 (`signInWithUserId`)
- テナント対応新規登録 (`signUpWithTenant`)
- プロファイル管理
- 従来システムとの互換性維持

#### 3. LoginScreen (`src/components/LoginScreen.jsx`)
- ユーザーID/メールアドレス切り替え可能なログイン
- テナントコード指定の新規登録
- ロール選択（講師/生徒）
- 自動生成されたユーザーIDの表示

### データベース構造

#### profiles テーブル
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  auth_id UUID REFERENCES auth.users(id),
  user_id VARCHAR(10) UNIQUE NOT NULL, -- PM-0001形式
  email VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20),
  role VARCHAR(20) CHECK (role IN ('TEACHER', 'STUDENT')),
  tenant_code VARCHAR(10) NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### tenants テーブル
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## セットアップ手順

### 1. データベースセットアップ

#### Supabaseでのテーブル作成
```bash
# SQLエディタで以下のファイルを実行
1. database/schema.sql - メインのテーブル構造
2. database/sample_data.sql - テスト用サンプルデータ（オプション）
```

#### 必要な権限設定
- Row Level Security (RLS) が自動で設定されます
- テナント内でのデータアクセス制限
- ロールベースのアクセス制御

### 2. 環境変数設定

`.env`ファイルに以下を追加：
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. アプリケーション起動

```bash
npm install
npm run dev
```

## 使用方法

### 新規登録フロー

1. **ログイン画面で「新規登録」を選択**
2. **必要情報を入力**:
   - メールアドレス
   - 名前
   - 電話番号
   - 塾コード（例: PM, TM）
   - ロール（講師/生徒）
   - パスワード

3. **自動ID生成**:
   - システムが自動でユーザーIDを生成
   - 例: 講師の場合 `PM-0001`、生徒の場合 `PM-0100`

4. **登録完了**:
   - 生成されたユーザーIDが表示される
   - 以降はこのIDでログイン可能

### ログインフロー

#### ユーザーIDでログイン（推奨）
1. ログイン画面で「ユーザーID」を選択
2. 生成されたユーザーID（例: `PM-0042`）を入力
3. パスワードを入力してログイン

#### メールアドレスでログイン（従来システム互換）
1. ログイン画面で「メールアドレス」を選択
2. 登録したメールアドレスを入力
3. パスワードを入力してログイン

## API仕様

### UserIdGenerator クラス

#### generateUserId(tenantCode, role)
```javascript
const result = await userIdGenerator.generateUserId('PM', 'TEACHER');
// 戻り値: { success: true, userId: 'PM-0001' }
```

#### getRoleFromUserId(userId)
```javascript
const role = userIdGenerator.getRoleFromUserId('PM-0042');
// 戻り値: 'TEACHER' または 'STUDENT'
```

#### getTenantCodeFromUserId(userId)
```javascript
const tenantCode = userIdGenerator.getTenantCodeFromUserId('PM-0042');
// 戻り値: 'PM'
```

#### getTenantStats(tenantCode)
```javascript
const stats = await userIdGenerator.getTenantStats('PM');
// 戻り値: { teachers: 3, students: 25, teacherCapacity: 99, studentCapacity: 9900 }
```

### 認証API

#### signInWithUserId(userId, password)
```javascript
const result = await auth.signInWithUserId('PM-0042', 'password123');
// ユーザーIDでのログイン
```

#### signUpWithTenant(email, password, userData)
```javascript
const result = await auth.signUpWithTenant('user@example.com', 'password123', {
  name: '田中太郎',
  phoneNumber: '090-1234-5678',
  role: 'TEACHER',
  tenantCode: 'PM'
});
// テナント対応新規登録
```

## セキュリティ

### Row Level Security (RLS)
- 各テーブルでRLSが有効
- ユーザーは同じテナント内のデータのみアクセス可能
- ロールに基づいた適切な権限制御

### データアクセス制限
- 講師: 同じテナント内の全データを閲覧可能
- 生徒: 自分のデータのみアクセス可能
- テナント間のデータ分離

## トラブルシューティング

### よくある問題

#### 1. ユーザーID生成エラー
```
エラー: "TEACHERの上限に達しました"
```
**解決策**: 講師の上限（99人）に達している。データベースで不要なプロファイルを削除するか、上限を変更。

#### 2. ログインエラー
```
エラー: "ユーザーが見つかりません"
```
**解決策**: 
- ユーザーIDの形式を確認（例: PM-0001）
- プロファイルテーブルにデータが存在するか確認
- Supabase認証ユーザーとプロファイルの紐付けを確認

#### 3. テナント分離の問題
```
エラー: "他のテナントのデータが見える"
```
**解決策**: RLSポリシーが正しく設定されているか確認。

### デバッグ用SQL

#### テナント統計の確認
```sql
SELECT * FROM tenant_statistics;
```

#### ユーザーID使用状況の確認
```sql
SELECT * FROM user_id_usage;
```

#### 特定ユーザーの情報確認
```sql
SELECT * FROM profiles WHERE user_id = 'PM-0001';
```

## 拡張可能性

### 新しいテナントの追加
```sql
INSERT INTO tenants (code, name, description) VALUES 
('NEW', '新しい塾', '新規開校した塾');
```

### ID番号帯の変更
`userIdGenerator.js`の定数を変更：
```javascript
this.TEACHER_MIN = 1
this.TEACHER_MAX = 199  // 講師を199人まで拡張
this.STUDENT_MIN = 200
this.STUDENT_MAX = 9999
```

### カスタムロールの追加
1. データベースのCHECK制約を更新
2. `userIdGenerator.js`のロール判定ロジックを更新
3. 新しい番号帯を定義

## パフォーマンス最適化

### インデックス
主要なクエリパフォーマンス向上のため、以下のインデックスが設定済み：
- `profiles(user_id)` - ユーザーID検索
- `profiles(tenant_code, role)` - テナント内ロール検索
- `profiles(auth_id)` - 認証ID検索

### クエリ最適化
- テナント内検索の最適化
- ロール判定の高速化
- 統計情報取得の効率化

## 今後の改善点

1. **バッチ処理**: 大量ユーザー登録時の最適化
2. **監査ログ**: ユーザーID生成・変更の履歴管理
3. **自動バックアップ**: 重要データの定期バックアップ
4. **モニタリング**: システム使用状況の監視
5. **API制限**: レート制限の実装

## サポート

問題が発生した場合は、以下の情報を含めて報告してください：
- エラーメッセージ
- 実行した操作
- ユーザーID（該当する場合）
- テナントコード
- ブラウザのコンソールログ