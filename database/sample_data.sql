-- サンプルデータ挿入スクリプト
-- 注意: このスクリプトは開発・テスト環境でのみ使用してください

-- テスト用プロファイルデータ
-- 注意: auth_idは実際のSupabase認証ユーザーのUUIDに置き換える必要があります

-- PMテナントの講師
INSERT INTO profiles (auth_id, user_id, email, name, phone_number, role, tenant_code) VALUES 
('00000000-0000-0000-0000-000000000001', 'PM-0001', 'teacher1@pm.com', '田中先生', '090-1111-1111', 'TEACHER', 'PM'),
('00000000-0000-0000-0000-000000000002', 'PM-0002', 'teacher2@pm.com', '佐藤先生', '090-1111-2222', 'TEACHER', 'PM'),
('00000000-0000-0000-0000-000000000003', 'PM-0003', 'teacher3@pm.com', '鈴木先生', '090-1111-3333', 'TEACHER', 'PM')
ON CONFLICT (user_id) DO NOTHING;

-- PMテナントの生徒
INSERT INTO profiles (auth_id, user_id, email, name, phone_number, role, tenant_code) VALUES 
('00000000-0000-0000-0000-000000000101', 'PM-0100', 'student1@pm.com', '山田太郎', '090-2222-1111', 'STUDENT', 'PM'),
('00000000-0000-0000-0000-000000000102', 'PM-0101', 'student2@pm.com', '田中花子', '090-2222-2222', 'STUDENT', 'PM'),
('00000000-0000-0000-0000-000000000103', 'PM-0102', 'student3@pm.com', '佐藤次郎', '090-2222-3333', 'STUDENT', 'PM'),
('00000000-0000-0000-0000-000000000104', 'PM-0103', 'student4@pm.com', '鈴木三郎', '090-2222-4444', 'STUDENT', 'PM'),
('00000000-0000-0000-0000-000000000105', 'PM-0104', 'student5@pm.com', '高橋四郎', '090-2222-5555', 'STUDENT', 'PM')
ON CONFLICT (user_id) DO NOTHING;

-- TMテナントの講師
INSERT INTO profiles (auth_id, user_id, email, name, phone_number, role, tenant_code) VALUES 
('00000000-0000-0000-0000-000000000201', 'TM-0001', 'teacher1@tm.com', '伊藤先生', '090-3333-1111', 'TEACHER', 'TM'),
('00000000-0000-0000-0000-000000000202', 'TM-0002', 'teacher2@tm.com', '渡辺先生', '090-3333-2222', 'TEACHER', 'TM')
ON CONFLICT (user_id) DO NOTHING;

-- TMテナントの生徒
INSERT INTO profiles (auth_id, user_id, email, name, phone_number, role, tenant_code) VALUES 
('00000000-0000-0000-0000-000000000301', 'TM-0100', 'student1@tm.com', '中村五郎', '090-4444-1111', 'STUDENT', 'TM'),
('00000000-0000-0000-0000-000000000302', 'TM-0101', 'student2@tm.com', '小林六郎', '090-4444-2222', 'STUDENT', 'TM'),
('00000000-0000-0000-0000-000000000303', 'TM-0102', 'student3@tm.com', '加藤七子', '090-4444-3333', 'STUDENT', 'TM')
ON CONFLICT (user_id) DO NOTHING;

-- サンプル課題データ
INSERT INTO assignments (tenant_code, teacher_user_id, title, description, due_date, status) VALUES 
('PM', 'PM-0001', '数学 第1章 練習問題', '基本的な計算問題を解いてください。教科書のP.10-15を参考にしてください。', '2024-02-15 23:59:00+09', 'active'),
('PM', 'PM-0001', '英語 単語テスト準備', '今週学習した単語50個のテストを行います。しっかり復習してください。', '2024-02-20 23:59:00+09', 'active'),
('PM', 'PM-0002', '理科 実験レポート', '先週行った実験の結果をまとめてレポートを作成してください。', '2024-02-18 23:59:00+09', 'active'),
('TM', 'TM-0001', '国語 読解問題', '配布したプリントの読解問題を解いてください。', '2024-02-16 23:59:00+09', 'active'),
('TM', 'TM-0002', '社会 歴史まとめ', '江戸時代についてA4用紙1枚にまとめてください。', '2024-02-22 23:59:00+09', 'active');

-- サンプル課題提出データ
INSERT INTO assignment_submissions (assignment_id, student_user_id, content, status, score, submitted_at) VALUES 
((SELECT id FROM assignments WHERE title = '数学 第1章 練習問題' LIMIT 1), 'PM-0100', '問題1: 答え 25\n問題2: 答え 48\n問題3: 答え 72', 'graded', 85, '2024-02-14 20:30:00+09'),
((SELECT id FROM assignments WHERE title = '数学 第1章 練習問題' LIMIT 1), 'PM-0101', '問題1: 答え 25\n問題2: 答え 50\n問題3: 答え 70', 'graded', 78, '2024-02-14 21:15:00+09'),
((SELECT id FROM assignments WHERE title = '英語 単語テスト準備' LIMIT 1), 'PM-0100', '単語リストを確認しました。復習完了です。', 'submitted', NULL, '2024-02-19 19:00:00+09'),
((SELECT id FROM assignments WHERE title = '理科 実験レポート' LIMIT 1), 'PM-0102', '実験結果：水の沸点は100度でした。詳細は添付ファイルを参照してください。', 'submitted', NULL, '2024-02-17 22:00:00+09');

-- サンプル学習記録データ
INSERT INTO study_records (student_user_id, tenant_code, subject, topic, duration_minutes, score, study_date, notes) VALUES 
('PM-0100', 'PM', '数学', '一次方程式', 60, 85, '2024-02-10', '基本問題は理解できた。応用問題をもう少し練習したい。'),
('PM-0100', 'PM', '英語', '現在完了形', 45, 78, '2024-02-10', 'have/hasの使い分けが少し難しい。'),
('PM-0100', 'PM', '理科', '化学反応', 90, 92, '2024-02-11', '実験が楽しかった。結果もよく理解できた。'),
('PM-0101', 'PM', '数学', '一次方程式', 75, 72, '2024-02-10', '計算ミスが多い。もう少し慎重に解く必要がある。'),
('PM-0101', 'PM', '国語', '古文読解', 50, 68, '2024-02-11', '古語の意味を覚えるのが大変。'),
('PM-0102', 'PM', '社会', '江戸時代', 40, 80, '2024-02-12', '歴史の流れは理解できた。年号を覚えたい。'),
('TM-0100', 'TM', '数学', '二次方程式', 80, 88, '2024-02-10', '解の公式をしっかり覚えた。'),
('TM-0101', 'TM', '英語', '関係代名詞', 55, 75, '2024-02-11', 'which/thatの使い分けを復習したい。');

-- サンプルメッセージデータ
INSERT INTO messages (tenant_code, sender_user_id, recipient_user_id, subject, content, message_type) VALUES 
('PM', 'PM-0001', NULL, '来週のテストについて', '来週火曜日に数学のテストを実施します。範囲は第1章から第3章までです。しっかり準備してください。', 'broadcast'),
('PM', 'PM-0001', 'PM-0100', '課題の提出について', '数学の課題、よくできていました。次回はもう少し詳しい解説を書いてもらえると良いですね。', 'direct'),
('PM', 'PM-0100', 'PM-0001', '質問があります', '昨日の授業で説明された二次方程式の解法について、もう一度教えていただけませんか？', 'direct'),
('PM', 'PM-0002', NULL, '実験室の使用について', '来週の理科の実験では実験室を使用します。白衣を忘れずに持参してください。', 'broadcast'),
('TM', 'TM-0001', 'TM-0100', '成績について', '今月の成績が向上していますね。この調子で頑張ってください。', 'direct'),
('TM', 'TM-0100', 'TM-0001', 'ありがとうございます', '先生のおかげで理解が深まりました。引き続きよろしくお願いします。', 'direct');

-- 統計確認用のビュー作成
CREATE OR REPLACE VIEW tenant_statistics AS
SELECT 
  t.code as tenant_code,
  t.name as tenant_name,
  COUNT(CASE WHEN p.role = 'TEACHER' THEN 1 END) as teacher_count,
  COUNT(CASE WHEN p.role = 'STUDENT' THEN 1 END) as student_count,
  COUNT(p.id) as total_users
FROM tenants t
LEFT JOIN profiles p ON t.code = p.tenant_code
GROUP BY t.code, t.name
ORDER BY t.code;

-- ユーザーID生成状況確認用のビュー
CREATE OR REPLACE VIEW user_id_usage AS
SELECT 
  tenant_code,
  role,
  COUNT(*) as used_count,
  CASE 
    WHEN role = 'TEACHER' THEN 99
    ELSE 9900
  END as max_capacity,
  ROUND(
    COUNT(*) * 100.0 / 
    CASE 
      WHEN role = 'TEACHER' THEN 99
      ELSE 9900
    END, 2
  ) as usage_percentage
FROM profiles
GROUP BY tenant_code, role
ORDER BY tenant_code, role;

-- 課題提出状況確認用のビュー
CREATE OR REPLACE VIEW assignment_status AS
SELECT 
  a.tenant_code,
  a.title,
  a.teacher_user_id,
  COUNT(s.id) as submission_count,
  COUNT(CASE WHEN s.status = 'graded' THEN 1 END) as graded_count,
  AVG(s.score) as average_score
FROM assignments a
LEFT JOIN assignment_submissions s ON a.id = s.assignment_id
GROUP BY a.id, a.tenant_code, a.title, a.teacher_user_id
ORDER BY a.tenant_code, a.title;