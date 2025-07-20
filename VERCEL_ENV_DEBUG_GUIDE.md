# Vercel環境変数デバッグガイド

## 🔍 本番環境認証問題の診断手順

### 1. Vercelダッシュボードでの環境変数確認

**必要な環境変数:**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**確認手順:**
1. Vercelダッシュボード → プロジェクト選択
2. Settings → Environment Variables
3. 上記2つの変数が設定されているか確認
4. 値が正しいSupabaseプロジェクトのものか確認

### 2. 本番環境でのデバッグログ確認

**テスト用アカウント:**
- **メールアドレス**: `ikki_y0518@icloud.com`
- **パスワード**: `Ikki0518`

**確認すべきコンソールログ:**
```
🔐 ログイン開始: ikki_y0518@icloud.com
🌍 環境: production
🔗 Supabase URL: https://your-project.supabase.co
🔑 Supabase Key存在: true
📧 メールアドレス判定: true
🆔 ユーザーID判定: false
📧 メールアドレスログイン開始
🔗 Supabase認証を試行中...
🔗 Supabase認証結果: {success: false/true, ...}
```

### 3. 問題パターンと解決策

#### パターン1: 環境変数が未設定
**症状:**
```
🔗 Supabase URL: undefined
🔑 Supabase Key存在: false
```
**解決策:** Vercelで環境変数を設定し、再デプロイ

#### パターン2: Supabase認証エラー
**症状:**
```
🔗 Supabase認証結果: {success: false, error: "..."}
⚠️ Supabase認証失敗、ローカルテストアカウントでの認証を試行
```
**解決策:** Supabaseプロジェクト設定確認、RLSポリシー確認

#### パターン3: ローカルフォールバック認証失敗
**症状:**
```
⚠️ Supabase認証失敗、ローカルテストアカウントでの認証を試行
// その後、認証成功ログが出ない
```
**解決策:** ローカル認証ロジックの修正が必要

### 4. 緊急時の対処法

**一時的な解決策:**
1. ユーザーID `TC-0001` / パスワード `Ikki0518` でログイン試行
2. ブラウザの開発者ツールでlocalStorageを直接設定:
```javascript
localStorage.setItem('currentUser', JSON.stringify({
  id: 'student-ikki-001',
  email: 'ikki_y0518@icloud.com',
  name: 'Ikki Student',
  userRole: 'STUDENT'
}));
```

### 5. デプロイメント後の確認

**再デプロイ手順:**
1. 環境変数設定後、Vercelで「Redeploy」実行
2. デプロイ完了後、本番環境でテスト
3. コンソールログで環境変数が正しく読み込まれているか確認

### 6. トラブルシューティング

**よくある問題:**
- 環境変数名の間違い（`VITE_`プレフィックス必須）
- Supabase URLの末尾スラッシュ
- 匿名キーの間違い
- RLSポリシーによるアクセス拒否

**確認コマンド（ローカル）:**
```bash
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY