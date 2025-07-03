# Supabase接続トラブルシューティングガイド

## 現在の問題
ログイン処理に時間がかかる、またはタイムアウトする問題

## 診断手順

### 1. 環境変数確認
```bash
node scripts/check-env.js
```

### 2. ブラウザコンソールでの確認
開発者ツール → Console で以下を確認:
- `Supabase設定確認:` のログ
- `ログイン開始:` のログ
- エラーメッセージ

### 3. Supabase Dashboard確認

#### 3.1 プロジェクト設定
- **Settings** → **API**
  - Project URL が正しい
  - anon/public key が正しい
  - Service role key は使用しない（セキュリティリスク）

#### 3.2 認証設定
- **Authentication** → **Settings**
  - Enable email confirmations: **OFF**
  - Enable phone confirmations: **OFF**

#### 3.3 データベース設定
- **SQL Editor** で以下を実行:
```sql
-- ユーザー確認済み状態に変更
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;
```

### 4. Vercel環境変数設定

#### 4.1 Vercel Dashboard
1. Project → **Settings** → **Environment Variables**
2. 以下を追加/更新:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
3. **All Environments** を選択
4. **Save** → **Redeploy**

#### 4.2 環境変数の確認
```bash
# ローカルで確認
cat .env

# Vercelで確認（デプロイ後）
# ブラウザコンソールで: console.log(import.meta.env)
```

## よくある問題と解決策

### 問題1: "Email not confirmed" エラー
**解決策:**
1. Supabase Dashboard → Authentication → Settings
2. "Enable email confirmations" を **OFF**
3. SQL Editor で既存ユーザーを確認済みに変更

### 問題2: ログインタイムアウト
**解決策:**
1. ネットワーク接続確認
2. Supabaseプロジェクトの地域確認（近い地域を選択）
3. 環境変数の再設定

### 問題3: RLS (Row Level Security) エラー
**解決策:**
1. SQL Editor で RLS ポリシーを確認:
```sql
SELECT * FROM pg_policies WHERE schemaname = 'public';
```
2. 必要に応じてポリシーを再作成

### 問題4: 環境変数が反映されない
**解決策:**
1. Vercel Dashboard で環境変数を確認
2. **Redeploy** を実行
3. ブラウザキャッシュをクリア

## 緊急時の対応

### デモモードへの切り替え
一時的にデモモードで動作させる場合:

```javascript
// src/services/supabase.js
const isValidConfig = false // 強制的にデモモード
```

### 最小限の認証設定
認証のみ動作させる場合:

```javascript
// src/services/authService.js
// データベース処理をスキップして認証のみ
```

## パフォーマンス最適化

### 1. 接続プール設定
```javascript
const client = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public'
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
})
```

### 2. タイムアウト設定
```javascript
// 8秒でタイムアウト
const authResult = await Promise.race([
  auth.signIn(email, password),
  new Promise((_, reject) => 
    setTimeout(() => reject(new Error('タイムアウト')), 8000)
  )
])
```

### 3. エラーハンドリング
```javascript
try {
  // Supabase処理
} catch (error) {
  if (error.message.includes('timeout')) {
    // タイムアウト処理
  } else if (error.message.includes('network')) {
    // ネットワークエラー処理
  }
}
```

## 監視とログ

### 1. 接続状態監視
```javascript
// 定期的な接続テスト
setInterval(async () => {
  const { data, error } = await supabase.from('users').select('count').limit(1)
  console.log('Supabase接続状態:', error ? 'エラー' : 'OK')
}, 30000)
```

### 2. パフォーマンス測定
```javascript
const startTime = performance.now()
await auth.signIn(email, password)
const endTime = performance.now()
console.log(`ログイン時間: ${endTime - startTime}ms`)
```

## 本番環境での推奨設定

1. **Supabase地域**: ユーザーに近い地域を選択
2. **RLS**: 適切なセキュリティポリシーを設定
3. **監視**: Supabase Dashboard でメトリクスを確認
4. **バックアップ**: 定期的なデータベースバックアップ
5. **CDN**: 静的アセットのキャッシュ設定

## サポート連絡先

- Supabase公式ドキュメント: https://supabase.com/docs
- Vercel公式ドキュメント: https://vercel.com/docs
- GitHub Issues: プロジェクトのIssuesページ