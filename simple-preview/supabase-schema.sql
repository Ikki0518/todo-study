-- Supabase学習管理アプリケーション用SQLスキーマ
-- 実行順序: 1. RLS無効化 → 2. テーブル作成 → 3. RLS有効化とポリシー設定

-- ==================================================
-- 1. Row Level Security (RLS) の一時無効化
-- ==================================================

-- 既存のポリシーを削除（エラーを無視）
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view own goals" ON goals;
DROP POLICY IF EXISTS "Users can manage own goals" ON goals;
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can manage own tasks" ON tasks;

-- RLSを一時的に無効化
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tasks DISABLE ROW LEVEL SECURITY;

-- ==================================================
-- 2. テーブルの作成
-- ==================================================

-- ユーザープロフィールテーブル
CREATE TABLE IF NOT EXISTS users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'STUDENT' CHECK (role IN ('STUDENT', 'INSTRUCTOR')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_sign_in_at TIMESTAMP WITH TIME ZONE
);

-- 学習目標テーブル
CREATE TABLE IF NOT EXISTS goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'study' CHECK (category IN ('study', 'exam', 'skill', 'other')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
    target_date DATE,
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    total_pages INTEGER,
    exclude_days INTEGER[] DEFAULT '{}', -- 0=日曜日, 1=月曜日, ..., 6=土曜日
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 学習タスクテーブル
CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'study' CHECK (category IN ('study', 'review', 'practice', 'exam', 'other')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    scheduled_date DATE,
    scheduled_time TIME,
    duration_minutes INTEGER DEFAULT 60,
    start_page INTEGER,
    end_page INTEGER,
    pages_count INTEGER,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 参考書テーブル
CREATE TABLE IF NOT EXISTS study_books (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    author TEXT,
    publisher TEXT,
    isbn TEXT,
    total_pages INTEGER NOT NULL DEFAULT 0,
    category TEXT NOT NULL DEFAULT 'textbook' CHECK (category IN ('textbook', 'workbook', 'reference', 'novel', 'other')),
    subject TEXT,
    difficulty_level TEXT DEFAULT 'medium' CHECK (difficulty_level IN ('beginner', 'medium', 'advanced')),
    cover_image_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 学習記録テーブル
CREATE TABLE IF NOT EXISTS study_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
    book_id UUID REFERENCES study_books(id) ON DELETE SET NULL,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    pages_studied INTEGER DEFAULT 0,
    start_page INTEGER,
    end_page INTEGER,
    notes TEXT,
    mood TEXT CHECK (mood IN ('excellent', 'good', 'okay', 'poor', 'terrible')),
    focus_level INTEGER CHECK (focus_level >= 1 AND focus_level <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 学習統計テーブル（日次集計）
CREATE TABLE IF NOT EXISTS daily_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    stat_date DATE NOT NULL,
    total_study_minutes INTEGER DEFAULT 0,
    total_pages_studied INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    goals_achieved INTEGER DEFAULT 0,
    study_streak_days INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, stat_date)
);

-- ==================================================
-- 3. インデックスの作成
-- ==================================================

-- パフォーマンス向上のためのインデックス
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_goals_student_id ON goals(student_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_target_date ON goals(target_date);
CREATE INDEX IF NOT EXISTS idx_tasks_student_id ON tasks(student_id);
CREATE INDEX IF NOT EXISTS idx_tasks_goal_id ON tasks(goal_id);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_date ON tasks(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_study_books_student_id ON study_books(student_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_student_id ON study_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_date ON study_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_daily_stats_student_date ON daily_stats(student_id, stat_date);

-- ==================================================
-- 4. トリガー関数の作成
-- ==================================================

-- updated_at自動更新関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_atトリガーの作成
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_goals_updated_at ON goals;
CREATE TRIGGER update_goals_updated_at
    BEFORE UPDATE ON goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_study_books_updated_at ON study_books;
CREATE TRIGGER update_study_books_updated_at
    BEFORE UPDATE ON study_books
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_study_sessions_updated_at ON study_sessions;
CREATE TRIGGER update_study_sessions_updated_at
    BEFORE UPDATE ON study_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_stats_updated_at ON daily_stats;
CREATE TRIGGER update_daily_stats_updated_at
    BEFORE UPDATE ON daily_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==================================================
-- 5. Row Level Security (RLS) の設定
-- ==================================================

-- RLSを有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

-- ユーザーテーブルのポリシー
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 目標テーブルのポリシー
CREATE POLICY "Users can view own goals" ON goals
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Users can manage own goals" ON goals
    FOR ALL USING (auth.uid() = student_id);

-- タスクテーブルのポリシー
CREATE POLICY "Users can view own tasks" ON tasks
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Users can manage own tasks" ON tasks
    FOR ALL USING (auth.uid() = student_id);

-- 参考書テーブルのポリシー
CREATE POLICY "Users can view own books" ON study_books
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Users can manage own books" ON study_books
    FOR ALL USING (auth.uid() = student_id);

-- 学習記録テーブルのポリシー
CREATE POLICY "Users can view own sessions" ON study_sessions
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Users can manage own sessions" ON study_sessions
    FOR ALL USING (auth.uid() = student_id);

-- 統計テーブルのポリシー
CREATE POLICY "Users can view own stats" ON daily_stats
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Users can manage own stats" ON daily_stats
    FOR ALL USING (auth.uid() = student_id);

-- ==================================================
-- 6. 初期データの挿入（オプション）
-- ==================================================

-- サンプルユーザー（テスト用）
-- 注意: 実際の運用では、認証はSupabase Authで行うため、このデータは不要です

-- ==================================================
-- 7. 便利なビューの作成
-- ==================================================

-- 学習進捗ビュー
CREATE OR REPLACE VIEW user_study_progress AS
SELECT 
    u.id as user_id,
    u.name,
    u.email,
    COUNT(DISTINCT g.id) as total_goals,
    COUNT(DISTINCT CASE WHEN g.status = 'completed' THEN g.id END) as completed_goals,
    COUNT(DISTINCT t.id) as total_tasks,
    COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
    COALESCE(AVG(g.progress), 0) as avg_goal_progress,
    MAX(ss.session_date) as last_study_date,
    COALESCE(SUM(ds.total_study_minutes), 0) as total_study_minutes,
    COALESCE(SUM(ds.total_pages_studied), 0) as total_pages_studied,
    MAX(ds.study_streak_days) as current_streak
FROM users u
LEFT JOIN goals g ON u.id = g.student_id
LEFT JOIN tasks t ON u.id = t.student_id
LEFT JOIN study_sessions ss ON u.id = ss.student_id
LEFT JOIN daily_stats ds ON u.id = ds.student_id
GROUP BY u.id, u.name, u.email;

-- 今日のタスクビュー
CREATE OR REPLACE VIEW todays_tasks AS
SELECT 
    t.*,
    u.name as student_name,
    g.title as goal_title,
    sb.title as book_title
FROM tasks t
JOIN users u ON t.student_id = u.id
LEFT JOIN goals g ON t.goal_id = g.id
LEFT JOIN study_books sb ON g.id = sb.id
WHERE t.scheduled_date = CURRENT_DATE
ORDER BY t.priority DESC, t.scheduled_time ASC;

-- ==================================================
-- 8. スキーマ作成完了
-- ==================================================

-- スキーマ作成が完了しました
-- 以下のテーブルが作成されました:
-- - users (ユーザープロフィール)
-- - goals (学習目標)
-- - tasks (学習タスク)
-- - study_books (参考書)
-- - study_sessions (学習記録)
-- - daily_stats (日次統計)