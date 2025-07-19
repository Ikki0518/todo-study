-- 簡略版: 教師プロファイルのみ追加するSQL
-- assignmentsテーブルが存在しない場合でも実行可能

-- TCテナントを追加（存在しない場合のみ）
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

-- 実行完了メッセージ
SELECT 'Teacher profiles created successfully!' as result;