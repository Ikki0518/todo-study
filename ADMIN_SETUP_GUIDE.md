# 管理者アカウント作成ガイド

## 概要

このガイドでは、塾の管理者アカウントを作成する方法を説明します。管理者アカウントは各塾（テナント）の最初のユーザーとして作成され、その後の講師・生徒ユーザーを管理する権限を持ちます。

## 前提条件

### 1. 環境変数の設定

`.env`ファイルに以下の環境変数を設定してください：

```bash
# Supabase設定
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# 管理者作成用（重要！）
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 2. Supabaseサービスロールキーの取得

1. [Supabase Dashboard](https://app.supabase.com) にアクセス
2. プロジェクトを選択
3. 「Settings」→「API」に移動
4. 「service_role」キーをコピー
5. `.env`ファイルに`SUPABASE_SERVICE_ROLE_KEY`として追加

⚠️ **重要**: サービスロールキーは強力な権限を持つため、本番環境では適切に管理してください。

### 3. データベースセットアップ

管理者作成前に、データベーススキーマが正しく設定されていることを確認してください：

```bash
# スキーマ作成
psql -h your_db_host -U postgres -d postgres -f database/schema.sql
```

## 管理者アカウント作成手順

### 方法1: NPMスクリプトを使用（推奨）

```bash
# 依存関係インストール + 管理者作成
npm run setup

# または管理者作成のみ
npm run create-admin
```

### 方法2: 直接スクリプト実行

```bash
node scripts/create-admin.js
```

## 作成プロセス

スクリプトを実行すると、以下の情報を入力するよう求められます：

### 1. テナント情報
```
テナントコード (例: TC): TC
テナント名 (例: 東京塾): 東京進学塾
```

### 2. 管理者情報
```
メールアドレス: admin@tokyo-juku.com
名前: 田中太郎
電話番号 (例: 090-1234-5678): 090-1111-2222
パスワード: ********
パスワード確認: ********
```

### 3. 確認
```
📝 入力内容確認:
   テナント: 東京進学塾 (TC)
   管理者: 田中太郎 (admin@tokyo-juku.com)
   電話番号: 090-1111-2222
   ユーザーID: TC-0001

この内容で作成しますか？ (y/N): y
```

## 作成される内容

### 1. テナント（塾）
- **テナントコード**: TC
- **テナント名**: 東京進学塾
- **作成日時**: 自動設定

### 2. 管理者ユーザー
- **ユーザーID**: `TC-0001` (常に0001)
- **メールアドレス**: admin@tokyo-juku.com
- **名前**: 田中太郎
- **役割**: INSTRUCTOR（講師）
- **権限**: 管理者権限

### 3. 認証アカウント
- Supabase Authに認証アカウントが作成されます
- メール確認は自動的にスキップされます

## ログイン方法

作成完了後、以下の方法でログインできます：

### 方法1: メールアドレス
```
ユーザーID: admin@tokyo-juku.com
パスワード: (設定したパスワード)
```

### 方法2: ユーザーID
```
ユーザーID: TC-0001
パスワード: (設定したパスワード)
```

## 管理者の初期設定

### 1. ログイン確認
1. アプリケーションにアクセス
2. 作成した認証情報でログイン
3. 講師ダッシュボードが表示されることを確認

### 2. ユーザー管理機能の確認
1. 「⚙️ ユーザー管理」タブをクリック
2. ユーザー管理画面が表示されることを確認
3. 統計情報が正しく表示されることを確認

### 3. 最初の講師・生徒作成
1. 新規ユーザー作成フォームに入力
2. 講師または生徒を選択
3. ユーザー作成ボタンをクリック
4. 生成されたユーザーIDを確認

## トラブルシューティング

### エラー: 環境変数が設定されていません
```
❌ 環境変数が設定されていません:
   VITE_SUPABASE_URL
   SUPABASE_SERVICE_ROLE_KEY
```

**解決方法**: `.env`ファイルに必要な環境変数を追加してください。

### エラー: テナント作成エラー
```
❌ テナント作成エラー: duplicate key value violates unique constraint
```

**解決方法**: 同じテナントコードが既に存在します。別のコードを使用してください。

### エラー: 認証ユーザー作成エラー
```
❌ 認証ユーザー作成エラー: User already registered
```

**解決方法**: 同じメールアドレスが既に登録されています。別のメールアドレスを使用してください。

### エラー: プロファイル作成エラー
```
❌ プロファイル作成エラー: duplicate key value violates unique constraint "profiles_user_id_key"
```

**解決方法**: 同じユーザーIDが既に存在します。データベースを確認してください。

## セキュリティ考慮事項

### 1. サービスロールキーの管理
- `.env`ファイルをGitにコミットしない
- 本番環境では環境変数として設定
- 定期的にキーをローテーション

### 2. 管理者パスワード
- 強力なパスワードを設定
- 定期的にパスワードを変更
- 多要素認証の検討（将来実装予定）

### 3. アクセス制御
- 管理者アカウントは必要最小限の人数に制限
- 操作ログの監視（将来実装予定）

## 複数テナントの管理

### 新しい塾の追加
各塾ごとに管理者アカウントを作成する必要があります：

```bash
# 1つ目の塾
npm run create-admin
# テナントコード: TC, 管理者: TC-0001

# 2つ目の塾  
npm run create-admin
# テナントコード: PM, 管理者: PM-0001
```

### テナント分離
- 各塾のデータは完全に分離されます
- 管理者は自分のテナント内のユーザーのみ管理可能
- データベースレベルでアクセス制御が適用されます

## 次のステップ

管理者アカウント作成後：

1. **講師ユーザーの作成**: 追加の講師が必要な場合
2. **生徒ユーザーの作成**: 生徒アカウントの一括作成
3. **権限設定の確認**: 各ユーザーの権限が正しく設定されているか確認
4. **バックアップ設定**: 定期的なデータバックアップの設定

## サポート

問題が発生した場合：

1. **ログ確認**: スクリプト実行時のエラーメッセージを確認
2. **データベース確認**: Supabaseダッシュボードでデータを確認
3. **環境変数確認**: 必要な環境変数が正しく設定されているか確認

---

**作成日**: 2025年1月10日  
**更新日**: 2025年1月10日  
**バージョン**: 1.0.0