-- 特定ユーザーに教師権限を追加するSQL

-- 新しいテナント「TC」を追加
INSERT INTO tenants (code, name, description) VALUES 
('TC', 'テストセンター', 'テスト用教師アカウント管理センター')
ON CONFLICT (code) DO NOTHING;

-- 教師プロファイルを追加（既存の学生プロファイルとは別に）
-- TC-0001: ikki_y0518@icloud.com
INSERT INTO profiles (user_id, email, name, role, tenant_code) VALUES 
('TC-0001', 'ikki_y0518@icloud.com', 'Ikki Teacher', 'TEACHER', 'TC')
ON CONFLICT (user_id) DO NOTHING;

-- TC-0002: minnanoakogare777@gmail.com  
INSERT INTO profiles (user_id, email, name, role, tenant_code) VALUES 
('TC-0002', 'minnanoakogare777@gmail.com', 'Minna Teacher', 'TEACHER', 'TC')
ON CONFLICT (user_id) DO NOTHING;

-- TC-0003: shishanxintai20@gmail.com
INSERT INTO profiles (user_id, email, name, role, tenant_code) VALUES 
('TC-0003', 'shishanxintai20@gmail.com', 'Shishan Teacher', 'TEACHER', 'TC')
ON CONFLICT (user_id) DO NOTHING;

-- 既存の学生プロファイルの名前を更新（メールアドレスが一致する場合）
UPDATE profiles 
SET name = 'Ikki Student'
WHERE email = 'ikki_y0518@icloud.com' AND role = 'STUDENT';

UPDATE profiles 
SET name = 'Minna Student'
WHERE email = 'minnanoakogare777@gmail.com' AND role = 'STUDENT';

UPDATE profiles 
SET name = 'Shishan Student'
WHERE email = 'shishanxintai20@gmail.com' AND role = 'STUDENT';

-- 教師用のサンプル課題を追加
INSERT INTO assignments (tenant_code, teacher_user_id, title, description, due_date, status) VALUES 
('TC', 'TC-0001', 'プログラミング基礎', 'JavaScript の基本文法を学習してください。', '2025-02-15 23:59:59+09', 'active'),
('TC', 'TC-0002', 'データベース設計', 'リレーショナルデータベースの設計原則について学習してください。', '2025-02-20 23:59:59+09', 'active'),
('TC', 'TC-0003', 'ウェブ開発', 'React を使ったフロントエンド開発について学習してください。', '2025-02-25 23:59:59+09', 'active')
ON CONFLICT DO NOTHING;

-- 教師用のサンプルメッセージを追加
INSERT INTO messages (tenant_code, sender_user_id, recipient_user_id, subject, content, message_type) VALUES 
('TC', 'TC-0001', NULL, '新学期のお知らせ', '新学期が始まります。皆さん頑張りましょう！', 'broadcast'),
('TC', 'TC-0002', NULL, 'システム更新', 'システムが更新されました。新機能をお試しください。', 'system')
ON CONFLICT DO NOTHING;