# 本番環境修正ガイド

## 問題の概要

### 現在の状況
- **本番環境URL**: https://todo-study-three.vercel.app/
- **問題**: 参考書名入力フィールドが正常に動作しない
- **根本原因**: 認証システムの環境変数設定不備

### 技術的分析
本問題は参考書名入力フィールド固有の問題ではなく、**認証システムの設定不備**が根本原因です。

## 確認済み事項

### ✅ ローカル環境
- 環境変数: 正しく設定済み
- 認証機能: 正常動作
- 参考書名入力フィールド: 正常動作
- データベース接続: 正常

### ❌ 本番環境
- 認証失敗によりログイン画面に戻る現象
- 参考書名入力フィールドが使用不可（認証失敗の副次的症状）

## 修正手順

### Step 1: Vercel環境変数の設定

1. **Vercelダッシュボードにアクセス**
   ```
   https://vercel.com/dashboard
   ```

2. **プロジェクト選択**
   - `todo-study-three` プロジェクトを選択

3. **環境変数設定**
   - Settings → Environment Variables
   - 以下の環境変数を追加:

   ```bash
   VITE_SUPABASE_URL=https://wjpcfsjtjgxvhijczxnj.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcGNmc2p0amd4dmhpamN6eG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMDYxOTcsImV4cCI6MjA2NTg4MjE5N30.TRMV3BrHkCKH-7RYFD6rGLdYq1kxUqZYQr3uD-WaPy0
   ```

4. **環境設定**
   - Environment: `Production`, `Preview`, `Development` すべてにチェック

### Step 2: 再デプロイ

1. **自動再デプロイ**
   - 環境変数設定後、Vercelが自動的に再デプロイを実行

2. **手動再デプロイ（必要に応じて）**
   - Deployments タブ → 最新デプロイメントの「...」→ Redeploy

### Step 3: 動作確認

1. **認証テスト**
   ```
   URL: https://todo-study-three.vercel.app/
   テストアカウント: ikki_y0518@icloud.com / ikki0518
   ```

2. **確認項目**
   - ログイン成功
   - ダッシュボード表示
   - 参考書管理画面アクセス
   - 参考書名入力フィールドの動作

## トラブルシューティング

### 問題: 環境変数設定後も認証が失敗する

**解決策1: キャッシュクリア**
```bash
# ブラウザのキャッシュとCookieをクリア
# または、シークレット/プライベートモードでテスト
```

**解決策2: 環境変数の再確認**
```bash
# Vercelダッシュボードで環境変数が正しく設定されているか確認
# 特に VITE_ プレフィックスが正しいか確認
```

**解決策3: 強制再デプロイ**
```bash
# GitHubリポジトリに空のコミットをプッシュ
git commit --allow-empty -m "Force redeploy"
git push origin main
```

### 問題: 参考書名入力フィールドがまだ動作しない

**確認事項**
1. 認証が正常に完了しているか
2. ブラウザの開発者ツールでエラーが出ていないか
3. ネットワークタブでSupabase APIへのリクエストが成功しているか

## 技術的詳細

### 環境変数の役割
```javascript
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 認証フローの確認
```javascript
// 認証状態の確認
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  // 認証失敗 → ログイン画面に戻る
  return
}
```

### RLSポリシー
```sql
-- user_study_books テーブルのRLSポリシー
CREATE POLICY "Users can manage their own study books" ON user_study_books
FOR ALL USING (auth.uid() = user_id);
```

## 期待される結果

### 修正後の動作
1. **認証成功**: ログイン後、ダッシュボードが正常表示
2. **参考書管理**: 参考書管理画面にアクセス可能
3. **入力フィールド**: 参考書名入力フィールドが正常に動作
4. **データ保存**: 入力したデータがSupabaseに正常保存

### 成功指標
- ログイン成功率: 100%
- 参考書名入力フィールドの応答性: 正常
- データベース保存: 正常
- セッション維持: 正常

## 追加の最適化

### パフォーマンス改善
```javascript
// 認証状態のキャッシュ
const [user, setUser] = useState(null)
const [loading, setLoading] = useState(true)

useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    setUser(session?.user ?? null)
    setLoading(false)
  })
}, [])
```

### エラーハンドリング
```javascript
// 認証エラーの適切な処理
try {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  if (error) throw error
} catch (error) {
  console.error('Authentication error:', error.message)
  // ユーザーにエラーメッセージを表示
}
```

## まとめ

この修正により、本番環境での参考書名入力フィールド問題が完全に解決されます。問題の根本原因は認証システムの環境変数設定不備であり、Vercelでの適切な環境変数設定により解決可能です。

修正完了後は、ローカル環境と同様の完全な機能が本番環境でも利用可能になります。