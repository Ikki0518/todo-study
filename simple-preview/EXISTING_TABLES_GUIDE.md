# 既存テーブル構造対応ガイド

既存のSupabaseテーブル構造に合わせて、simple-previewアプリケーションを動作させるためのガイドです。

## 📋 既存テーブル構造

以下のテーブルが既に存在していることを確認しました：

### 基本テーブル
- `users` - ユーザー情報
- `goals` - 学習目標
- `tasks` - タスク管理
- `comments` - コメント

### 学習管理テーブル
- `study_courses` - 学習コース
- `study_course_enrollments` - コース登録
- `study_lessons` - レッスン
- `study_chapters` - チャプター
- `study_materials` - 学習教材
- `study_schools` - 学校情報
- `study_subjects` - 科目
- `study_student_progress` - 学習進捗
- `study_user_profiles` - ユーザープロフィール

### その他
- `courses` - コース（ロック状態）
- `instructors` - 講師
- `lessons` - レッスン（ロック状態）
- `students` - 生徒
- `subjects` - 科目（ロック状態）

## 🔧 既存テーブル対応ファイル

### 1. Supabaseクライアント
**ファイル**: [`src/services/supabase-existing.js`](./src/services/supabase-existing.js)

既存のテーブル構造に合わせたデータベース操作関数を提供：

```javascript
// 使用例
import { supabase, auth, database } from './services/supabase-existing.js'

// ユーザープロフィール取得（usersまたはstudy_user_profilesから自動選択）
const profile = await database.getUserProfile(userId)

// 学習コース取得
const courses = await database.getStudyCourses(studentId)

// 学習進捗取得
const progress = await database.getStudentProgress(studentId)
```

### 2. 認証サービス
**ファイル**: [`src/services/authService-existing.js`](./src/services/authService-existing.js)

既存テーブル構造に対応した認証サービス：

```javascript
// 使用例
import authService from './services/authService-existing.js'

// ログイン
const result = await authService.login(email, password)

// プロフィール更新
const updateResult = await authService.updateProfile({ name: '新しい名前' })
```

## 🚀 既存テーブルでアプリを動作させる手順

### 1. ファイルの置き換え

現在のファイルを既存テーブル対応版に置き換えます：

```bash
# 既存ファイルをバックアップ
mv src/services/supabase.js src/services/supabase-original.js
mv src/services/authService.js src/services/authService-original.js

# 既存テーブル対応版を使用
cp src/services/supabase-existing.js src/services/supabase.js
cp src/services/authService-existing.js src/services/authService.js
```

### 2. 環境変数の設定

`.env`ファイルに既存のSupabaseプロジェクトの情報を設定：

```env
VITE_SUPABASE_URL=https://your-existing-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-existing-anon-key
```

### 3. Row Level Security (RLS) の確認

既存テーブルでRLSが適切に設定されているか確認：

```sql
-- usersテーブルのRLS確認
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('users', 'goals', 'tasks', 'study_user_profiles');

-- 必要に応じてRLSを有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_user_profiles ENABLE ROW LEVEL SECURITY;
```

### 4. ポリシーの設定

ユーザーが自分のデータのみアクセスできるようにポリシーを設定：

```sql
-- usersテーブルのポリシー
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- goalsテーブルのポリシー
CREATE POLICY "Users can manage own goals" ON goals
    FOR ALL USING (auth.uid() = student_id);

-- tasksテーブルのポリシー
CREATE POLICY "Users can manage own tasks" ON tasks
    FOR ALL USING (auth.uid() = student_id);

-- study_user_profilesテーブルのポリシー
CREATE POLICY "Users can manage own study profile" ON study_user_profiles
    FOR ALL USING (auth.uid() = user_id);
```

## 📊 テーブル構造の対応関係

| アプリの機能 | 使用テーブル | 説明 |
|-------------|-------------|------|
| ユーザー認証 | `users` または `study_user_profiles` | 自動的に適切なテーブルを選択 |
| 学習目標 | `goals` | 既存のgoalsテーブルを使用 |
| タスク管理 | `tasks` | 既存のtasksテーブルを使用 |
| 学習コース | `study_courses` | 学習コース情報 |
| 学習進捗 | `study_student_progress` | 進捗追跡 |
| 学習教材 | `study_materials` | 教材管理 |
| コメント | `comments` | コメント機能 |

## 🔍 データベース構造の確認

既存テーブルの構造を確認するSQL：

```sql
-- テーブル一覧
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 特定テーブルの列情報
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 外部キー制約の確認
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

## 🛠️ トラブルシューティング

### よくある問題と解決方法

#### 1. テーブルが見つからないエラー
```
error: relation "users" does not exist
```

**解決方法**: 
- テーブル名を確認
- `study_user_profiles`テーブルを使用するように変更

#### 2. RLSポリシーエラー
```
error: new row violates row-level security policy
```

**解決方法**:
- RLSポリシーが正しく設定されているか確認
- ユーザーが認証されているか確認

#### 3. 外部キー制約エラー
```
error: insert or update on table violates foreign key constraint
```

**解決方法**:
- 参照先のレコードが存在するか確認
- 外部キーの値が正しいか確認

## 📈 パフォーマンス最適化

既存テーブルでのパフォーマンス向上のためのインデックス：

```sql
-- よく使用される検索条件にインデックスを作成
CREATE INDEX IF NOT EXISTS idx_goals_student_id ON goals(student_id);
CREATE INDEX IF NOT EXISTS idx_tasks_student_id ON tasks(student_id);
CREATE INDEX IF NOT EXISTS idx_study_courses_student_id ON study_courses(student_id);
CREATE INDEX IF NOT EXISTS idx_study_student_progress_student_id ON study_student_progress(student_id);
```

## 🔄 データ移行

既存データがある場合の移行方法：

```sql
-- 既存のusersテーブルからstudy_user_profilesへのデータ移行例
INSERT INTO study_user_profiles (user_id, name, email, created_at)
SELECT id, name, email, created_at 
FROM users 
WHERE id NOT IN (SELECT user_id FROM study_user_profiles);
```

---

**注意**: 既存のテーブル構造を変更する前に、必ずデータベースのバックアップを取ってください。