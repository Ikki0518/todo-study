# 本番環境タスクデータ永続化修正 - 完了ガイド

## 🎯 修正完了状況

### ✅ 完了済み
1. **taskService の認証機能強化** - 認証トークンを適切にSupabaseクライアントに設定
2. **Supabaseクライアント設定修正** - セッション永続化を有効化 
3. **エラーハンドリング強化** - 詳細なデバッグ情報を追加
4. **本番環境デプロイ完了** - https://todo-study-x7yejwnl5-ikki-y0518-icloudcoms-projects.vercel.app

### 🔧 残り作業（重要）
**Supabaseデータベースでの RLSポリシー修正が必要です**

## 📋 Supabase SQLエディタで実行が必要なSQL

```sql
-- ユーザーデータテーブル用のRLSポリシー修正

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can only access their own tasks" ON user_tasks;
DROP POLICY IF EXISTS "Users can only access their own study plans" ON user_study_plans;
DROP POLICY IF EXISTS "Users can only access their own exam dates" ON user_exam_dates;

-- 正しいSupabase認証ベースのRLSポリシーを作成

-- user_tasksテーブル用ポリシー
CREATE POLICY "Users can only access their own tasks" ON user_tasks
  FOR ALL 
  USING (user_id = (auth.jwt() ->> 'sub')::text OR user_id = auth.uid()::text)
  WITH CHECK (user_id = (auth.jwt() ->> 'sub')::text OR user_id = auth.uid()::text);

-- user_study_plansテーブル用ポリシー  
CREATE POLICY "Users can only access their own study plans" ON user_study_plans
  FOR ALL
  USING (user_id = (auth.jwt() ->> 'sub')::text OR user_id = auth.uid()::text)
  WITH CHECK (user_id = (auth.jwt() ->> 'sub')::text OR user_id = auth.uid()::text);

-- user_exam_datesテーブル用ポリシー
CREATE POLICY "Users can only access their own exam dates" ON user_exam_dates
  FOR ALL
  USING (user_id = (auth.jwt() ->> 'sub')::text OR user_id = auth.uid()::text)
  WITH CHECK (user_id = (auth.jwt() ->> 'sub')::text OR user_id = auth.uid()::text);

-- 認証されていないユーザーはアクセス不可のポリシーも追加
CREATE POLICY "Require authentication for user tasks" ON user_tasks
  FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Require authentication for study plans" ON user_study_plans
  FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Require authentication for exam dates" ON user_exam_dates
  FOR ALL
  USING (auth.role() = 'authenticated');
```

## 🔗 実行手順

1. **Supabaseダッシュボードにアクセス**
   - https://app.supabase.com にログイン
   - プロジェクト「wjpcfsjtjgxvhijczxnj」を選択

2. **SQLエディタを開く**
   - 左メニューから「SQL Editor」をクリック
   - 「New query」をクリック

3. **SQLを実行**
   - 上記のSQL文をコピーして貼り付け
   - 「RUN」ボタンをクリックして実行

4. **実行結果確認**
   - エラーが表示されないことを確認
   - "Success. No rows returned." と表示されればOK

## 🧪 テスト方法

RLSポリシー適用後、本番環境でタスクデータ永続化をテスト：

1. **アプリケーションにアクセス**
   - https://todo-study-x7yejwnl5-ikki-y0518-icloudcoms-projects.vercel.app

2. **ログイン**
   - テストユーザーでログイン

3. **タスク追加テスト**
   - 新しいタスクを追加
   - 週間プランナーにタスクを配置

4. **永続化確認**
   - ページをリロード（F5）
   - 追加したタスクが残っていることを確認

## 🚨 修正された問題

### 根本原因
- **RLSポリシー設定ミス**: `current_user::text` を使用していたが、Supabaseでは `auth.uid()` を使用する必要があった
- **認証セッション問題**: `persistSession: false` によりSupabaseセッションが維持されていなかった
- **認証トークン未設定**: データベースアクセス時にSupabaseクライアントに認証情報が設定されていなかった

### 修正内容
- ✅ RLSポリシーをSupabase認証に対応
- ✅ セッション永続化を有効化
- ✅ 認証トークンの適切な設定
- ✅ 詳細なエラーハンドリング追加

## 📊 期待される結果

RLSポリシー修正完了後：
- ✅ タスク追加後、リロードしてもデータが保持される
- ✅ 週間プランナーの配置が永続化される
- ✅ すべてのユーザーデータがSupabaseに保存される
- ✅ 認証エラーが解消される

---

**重要**: 上記のSQL実行が完了したら、本番環境でのタスクデータ永続化テストを実行してください。