# 管理者用ユーザー管理システム実装ガイド

## 概要

塾の管理側でユーザーIDを発行・管理するシステムを実装しました。これにより、生徒や講師は自分で新規登録する必要がなく、管理者が発行したユーザーIDとパスワードでログインできます。

## 実装された機能

### 1. ログイン画面の簡素化
- **ファイル**: `src/components/LoginScreen.jsx`
- **変更内容**:
  - 新規登録フォームを削除
  - ユーザーIDまたはメールアドレスの統一入力フィールド
  - 自動判定機能（ユーザーID形式 vs メールアドレス形式）
  - 従来のテストアカウントとの互換性維持

### 2. 管理者用ユーザー管理画面
- **ファイル**: `src/components/AdminUserManagement.jsx`
- **機能**:
  - ユーザー作成（講師・生徒の選択可能）
  - ユーザー一覧表示（テナント別）
  - ユーザー削除
  - 統計情報表示（講師数、生徒数、容量制限）
  - 自動ユーザーID生成

### 3. Supabase認証サービスの拡張
- **ファイル**: `src/services/supabase.js`
- **追加機能**:
  - `getUsersByTenant()`: テナント内のユーザー一覧取得
  - `deleteUser()`: ユーザー削除
  - 管理者権限での操作

### 4. 講師ダッシュボードへの統合
- **ファイル**: `src/components/InstructorView.jsx`
- **変更内容**:
  - ナビゲーションに「⚙️ ユーザー管理」タブを追加
  - AdminUserManagementコンポーネントの統合

## ユーザーID生成ルール

### ID形式
- **講師**: `[テナントコード]-0001` ～ `[テナントコード]-0099` (最大99名)
- **生徒**: `[テナントコード]-0100` ～ `[テナントコード]-9999` (最大9900名)

### 例
- TC塾の講師: `TC-0001`, `TC-0002`, ...
- TC塾の生徒: `TC-0100`, `TC-0101`, ...

## 使用方法

### 1. 管理者としてログイン
```
ユーザーID: instructor@test.com
パスワード: password123
```

### 2. ユーザー管理画面へアクセス
1. 講師ダッシュボードにログイン
2. 「⚙️ ユーザー管理」タブをクリック

### 3. 新規ユーザー作成
1. 新規ユーザー作成フォームに入力:
   - 名前
   - メールアドレス
   - 電話番号
   - 役割（講師/生徒）
   - 塾コード
2. 「ユーザーを作成」ボタンをクリック
3. 生成されたユーザーIDと初期パスワードをメモ

### 4. ユーザーIDの配布
- 生成されたユーザーIDと初期パスワード（`password123`）を対象者に配布
- ユーザーは配布されたIDでログイン可能

## データベース要件

### テーブル構造
```sql
-- profiles テーブル
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  user_id TEXT UNIQUE,           -- 自動生成されるユーザーID (TC-0001など)
  email TEXT UNIQUE,
  name TEXT,
  phone_number TEXT,
  role TEXT CHECK (role IN ('INSTRUCTOR', 'STUDENT')),
  tenant_code TEXT,              -- テナント識別子
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- tenants テーブル
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  code TEXT UNIQUE,              -- テナントコード (TC, PM など)
  name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### RLS (Row Level Security) ポリシー
```sql
-- テナント別データ分離
CREATE POLICY "Users can only see same tenant data" ON profiles
  FOR ALL USING (tenant_code = current_setting('app.current_tenant'));
```

## セキュリティ考慮事項

### 1. テナント分離
- 各塾（テナント）のデータは完全に分離
- RLSポリシーによる自動的なデータアクセス制御

### 2. 権限管理
- 管理者のみがユーザー作成・削除可能
- 講師は自分のテナント内のユーザーのみ管理可能

### 3. 初期パスワード
- デフォルト: `password123`
- ユーザーは初回ログイン後にパスワード変更を推奨

## トラブルシューティング

### よくある問題

#### 1. ユーザーが見つからない
- **原因**: テナントコードの不一致
- **解決**: 正しいテナントコードでユーザーが作成されているか確認

#### 2. ユーザーID生成エラー
- **原因**: 容量制限に達している
- **解決**: 講師は99名、生徒は9900名まで

#### 3. ログインできない
- **原因**: ユーザーIDの形式間違い
- **解決**: `TC-0001`のような正確な形式で入力

## 今後の拡張予定

### 1. パスワードリセット機能
- 管理者によるパスワードリセット
- ユーザー自身でのパスワード変更

### 2. 一括ユーザー作成
- CSVファイルからの一括インポート
- テンプレートベースの作成

### 3. 詳細な権限管理
- 講師の権限レベル設定
- 機能別アクセス制御

## デプロイメント手順

### 1. 環境変数設定
```bash
# Supabase設定
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. データベースセットアップ
```bash
# スキーマ作成
psql -f database/schema.sql

# サンプルデータ挿入（オプション）
psql -f database/tc_tenant_sample.sql
```

### 3. アプリケーションビルド
```bash
npm run build
```

### 4. デプロイ
```bash
# Vercel例
vercel --prod

# Railway例
railway up
```

## サポート

問題が発生した場合は、以下を確認してください：

1. **ログ確認**: ブラウザの開発者ツールでエラーログを確認
2. **データベース状態**: Supabaseダッシュボードでデータを確認
3. **環境変数**: 正しい設定値が使用されているか確認

---

**実装完了日**: 2025年1月10日  
**バージョン**: 1.0.0  
**担当**: DevOps Team