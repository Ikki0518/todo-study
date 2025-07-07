# Supabaseメール確認設定の無効化手順

## 問題
新規登録後、メール確認が完了するまでログインできない問題が発生しています。

## 解決方法
Supabaseダッシュボードでメール確認設定を無効化します。

## 手順

### 1. Supabaseダッシュボードにアクセス
- https://supabase.com/dashboard にアクセス
- プロジェクト `wjpcfsjtjgxvhijczxnj` を選択

### 2. Authentication設定を開く
- 左サイドバーから「Authentication」をクリック
- 「Settings」タブをクリック

### 3. メール確認設定を無効化
以下の設定を変更してください：

#### ✅ 変更が必要な設定
- **Enable email confirmations**: `OFF`に変更
- **Enable secure email change**: `OFF`に変更（推奨）

#### 📝 設定場所
```
Authentication > Settings > Email Auth
```

### 4. 設定を保存
- 「Save」ボタンをクリックして設定を保存

### 5. 変更の確認
設定変更後、以下が可能になります：
- 新規登録後、即座にログイン可能
- メール確認なしでアカウント利用開始
- 開発環境での迅速なテスト

## 注意事項
- 本番環境では、セキュリティのためメール確認を有効にすることを推奨
- 開発環境でのみこの設定を使用してください

## 設定完了後のテスト
1. https://simple-preview-theta.vercel.app/ にアクセス
2. 既存のアカウント（testuser@example.com / testpassword123）でログイン
3. ログインが成功することを確認

## トラブルシューティング
設定変更後もログインできない場合：
1. ブラウザのキャッシュをクリア
2. 新しいメールアドレスで新規登録を試行
3. コンソールログでエラー詳細を確認