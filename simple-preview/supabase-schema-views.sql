-- ==================================================
-- AI学習プランナー - ビューの作成
-- ==================================================
-- 注意: このファイルは supabase-schema-tables.sql の実行後に実行してください

-- ==================================================
-- 便利なビューの作成
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
LEFT JOIN study_books sb ON g.id = sb.goal_id
WHERE t.scheduled_date = CURRENT_DATE
ORDER BY t.priority DESC, t.scheduled_time ASC;

-- 週間学習統計ビュー
CREATE OR REPLACE VIEW weekly_study_stats AS
SELECT 
    u.id as user_id,
    u.name,
    DATE_TRUNC('week', ds.date) as week_start,
    SUM(ds.total_study_minutes) as weekly_minutes,
    SUM(ds.total_pages_studied) as weekly_pages,
    SUM(ds.tasks_completed) as weekly_tasks,
    AVG(ds.mood_average) as avg_mood,
    AVG(ds.focus_average) as avg_focus,
    COUNT(DISTINCT ds.date) as study_days
FROM users u
LEFT JOIN daily_stats ds ON u.id = ds.student_id
WHERE ds.date >= CURRENT_DATE - INTERVAL '4 weeks'
GROUP BY u.id, u.name, DATE_TRUNC('week', ds.date)
ORDER BY week_start DESC;

-- 目標達成率ビュー
CREATE OR REPLACE VIEW goal_achievement_stats AS
SELECT 
    u.id as user_id,
    u.name,
    g.category,
    COUNT(*) as total_goals,
    COUNT(CASE WHEN g.status = 'completed' THEN 1 END) as completed_goals,
    COUNT(CASE WHEN g.status = 'active' THEN 1 END) as active_goals,
    ROUND(AVG(g.progress), 2) as avg_progress,
    COUNT(CASE WHEN g.target_date < CURRENT_DATE AND g.status != 'completed' THEN 1 END) as overdue_goals
FROM users u
LEFT JOIN goals g ON u.id = g.student_id
GROUP BY u.id, u.name, g.category;

-- 最近の学習活動ビュー
CREATE OR REPLACE VIEW recent_study_activity AS
SELECT 
    'session' as activity_type,
    ss.id as activity_id,
    ss.student_id,
    u.name as student_name,
    g.title as goal_title,
    ss.session_date as activity_date,
    ss.duration_minutes,
    ss.pages_studied,
    ss.notes as description,
    ss.created_at
FROM study_sessions ss
JOIN users u ON ss.student_id = u.id
LEFT JOIN goals g ON ss.goal_id = g.id
WHERE ss.session_date >= CURRENT_DATE - INTERVAL '7 days'

UNION ALL

SELECT 
    'task_completed' as activity_type,
    t.id as activity_id,
    t.student_id,
    u.name as student_name,
    g.title as goal_title,
    t.completed_at::date as activity_date,
    t.actual_minutes as duration_minutes,
    NULL as pages_studied,
    t.description,
    t.completed_at as created_at
FROM tasks t
JOIN users u ON t.student_id = u.id
LEFT JOIN goals g ON t.goal_id = g.id
WHERE t.status = 'completed' 
AND t.completed_at >= CURRENT_DATE - INTERVAL '7 days'

ORDER BY created_at DESC;

-- RLS設定をビューにも適用
ALTER VIEW user_study_progress OWNER TO postgres;
ALTER VIEW todays_tasks OWNER TO postgres;
ALTER VIEW weekly_study_stats OWNER TO postgres;
ALTER VIEW goal_achievement_stats OWNER TO postgres;
ALTER VIEW recent_study_activity OWNER TO postgres;