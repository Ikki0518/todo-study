-- AI学習プランナー データベーススキーマ
-- PostgreSQL

-- 拡張機能
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ユーザーテーブル
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('STUDENT', 'INSTRUCTOR')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 生徒情報テーブル
CREATE TABLE students (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    instructor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    current_streak INTEGER DEFAULT 0,
    last_studied_at TIMESTAMP WITH TIME ZONE
);

-- 講師情報テーブル
CREATE TABLE instructors (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE
);

-- 講師と生徒の関係テーブル（多対多）
CREATE TABLE instructor_students (
    instructor_id UUID REFERENCES instructors(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (instructor_id, student_id)
);

-- 長期目標テーブル
CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 学習教材テーブル
CREATE TABLE study_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    estimated_hours DECIMAL(5,2) NOT NULL CHECK (estimated_hours > 0),
    order_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(goal_id, order_number)
);

-- タスクテーブル
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    material_id UUID REFERENCES study_materials(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('AI_GENERATED', 'MANUAL')),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE')),
    estimated_minutes INTEGER NOT NULL CHECK (estimated_minutes > 0),
    actual_minutes INTEGER CHECK (actual_minutes >= 0),
    scheduled_date DATE NOT NULL,
    scheduled_start_time TIMESTAMP WITH TIME ZONE,
    scheduled_end_time TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_overdue BOOLEAN DEFAULT FALSE,
    google_calendar_event_id VARCHAR(255),
    CHECK (scheduled_end_time IS NULL OR scheduled_start_time IS NULL OR scheduled_end_time > scheduled_start_time)
);

-- コメントテーブル
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 通知テーブル
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('OVERDUE_TASKS_THRESHOLD', 'STREAK_MILESTONE', 'GOAL_DEADLINE_APPROACHING')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Googleカレンダー認証トークンテーブル
CREATE TABLE google_calendar_tokens (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_type VARCHAR(50) NOT NULL,
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- インデックス
CREATE INDEX idx_tasks_student_id ON tasks(student_id);
CREATE INDEX idx_tasks_goal_id ON tasks(goal_id);
CREATE INDEX idx_tasks_scheduled_date ON tasks(scheduled_date);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_is_overdue ON tasks(is_overdue);
CREATE INDEX idx_goals_student_id ON goals(student_id);
CREATE INDEX idx_goals_target_date ON goals(target_date);
CREATE INDEX idx_study_materials_goal_id ON study_materials(goal_id);
CREATE INDEX idx_comments_task_id ON comments(task_id);
CREATE INDEX idx_comments_student_id ON comments(student_id);
CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- トリガー: updated_atの自動更新
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_materials_updated_at BEFORE UPDATE ON study_materials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_google_calendar_tokens_updated_at BEFORE UPDATE ON google_calendar_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();