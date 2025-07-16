-- TCテナント用サンプルデータ
-- TC学習塾での講師・生徒管理システムのデモ用データ

-- ========================================
-- 1. TCテナントの作成
-- ========================================

INSERT INTO tenants (code, name, description) VALUES 
('TC', 'TC学習塾', 'TC学習塾の管理システム - 講師と生徒の完全連動')
ON CONFLICT (code) DO NOTHING;

-- ========================================
-- 2. TC講師のプロファイル作成
-- ========================================

-- 注意: auth_idは実際のSupabase認証ユーザーのUUIDに置き換える必要があります
-- テスト用なので仮のUUIDを使用

INSERT INTO profiles (auth_id, user_id, email, name, phone_number, role, tenant_code) VALUES 
-- TC講師（TC-0001〜TC-0099の範囲）
('10000000-0000-0000-0000-000000000001', 'TC-0001', 'tanaka@tc.com', '田中先生（数学）', '090-1111-0001', 'TEACHER', 'TC'),
('10000000-0000-0000-0000-000000000002', 'TC-0002', 'sato@tc.com', '佐藤先生（英語）', '090-1111-0002', 'TEACHER', 'TC'),
('10000000-0000-0000-0000-000000000003', 'TC-0003', 'suzuki@tc.com', '鈴木先生（理科）', '090-1111-0003', 'TEACHER', 'TC')
ON CONFLICT (user_id) DO NOTHING;

-- ========================================
-- 3. TC生徒のプロファイル作成
-- ========================================

INSERT INTO profiles (auth_id, user_id, email, name, phone_number, role, tenant_code) VALUES 
-- TC生徒（TC-0100〜TC-9999の範囲）
('10000000-0000-0000-0000-000000000101', 'TC-0100', 'yamada@tc-student.com', '山田太郎（高1）', '090-2222-0100', 'STUDENT', 'TC'),
('10000000-0000-0000-0000-000000000102', 'TC-0101', 'tanaka.h@tc-student.com', '田中花子（高2）', '090-2222-0101', 'STUDENT', 'TC'),
('10000000-0000-0000-0000-000000000103', 'TC-0102', 'sato.j@tc-student.com', '佐藤次郎（高3）', '090-2222-0102', 'STUDENT', 'TC'),
('10000000-0000-0000-0000-000000000104', 'TC-0103', 'suzuki.s@tc-student.com', '鈴木三郎（中3）', '090-2222-0103', 'STUDENT', 'TC'),
('10000000-0000-0000-0000-000000000105', 'TC-0104', 'watanabe@tc-student.com', '渡辺四郎（高1）', '090-2222-0104', 'STUDENT', 'TC')
ON CONFLICT (user_id) DO NOTHING;

-- ========================================
-- 4. TC講師が作成した課題
-- ========================================

INSERT INTO assignments (tenant_code, teacher_user_id, title, description, due_date, status) VALUES 
-- 田中先生（数学）の課題
('TC', 'TC-0001', '数学 - 二次関数の基礎', '教科書P.45-50の問題を解いてください。グラフの描き方も含めて提出してください。', '2024-02-25 23:59:00+09', 'active'),
('TC', 'TC-0001', '数学 - 三角関数の応用', '三角関数を使った実生活の問題を3つ解いてください。', '2024-03-01 23:59:00+09', 'active'),

-- 佐藤先生（英語）の課題
('TC', 'TC-0002', '英語 - 長文読解練習', '配布したプリントの長文を読んで、設問に答えてください。', '2024-02-28 23:59:00+09', 'active'),
('TC', 'TC-0002', '英語 - エッセイ作成', '「私の将来の夢」について300語以上の英語エッセイを書いてください。', '2024-03-05 23:59:00+09', 'active'),

-- 鈴木先生（理科）の課題
('TC', 'TC-0003', '理科 - 化学実験レポート', '先週行った酸化還元実験の結果をまとめてレポートを作成してください。', '2024-02-26 23:59:00+09', 'active'),
('TC', 'TC-0003', '理科 - 物理計算問題', '運動方程式を使った計算問題10問を解いてください。', '2024-03-03 23:59:00+09', 'active');

-- ========================================
-- 5. TC生徒の課題提出状況
-- ========================================

INSERT INTO assignment_submissions (assignment_id, student_user_id, content, status, score, submitted_at, feedback) VALUES 
-- 山田太郎（TC-0100）の提出
((SELECT id FROM assignments WHERE title = '数学 - 二次関数の基礎' AND teacher_user_id = 'TC-0001' LIMIT 1), 
 'TC-0100', '問題1: y = x² + 2x + 1のグラフを描きました。頂点は(-1, 0)です。\n問題2: y = -x² + 4x - 3の最大値は1です。', 
 'graded', 88, '2024-02-24 20:30:00+09', '良くできています。グラフの描き方が正確です。次回は軸の対称性についても説明を加えてください。'),

((SELECT id FROM assignments WHERE title = '英語 - 長文読解練習' AND teacher_user_id = 'TC-0002' LIMIT 1), 
 'TC-0100', '1. The main idea is about environmental protection.\n2. The author suggests three solutions.\n3. I agree with the author because...', 
 'graded', 85, '2024-02-27 19:15:00+09', '読解力が向上しています。文法的なミスが少し見られるので注意してください。'),

-- 田中花子（TC-0101）の提出
((SELECT id FROM assignments WHERE title = '数学 - 二次関数の基礎' AND teacher_user_id = 'TC-0001' LIMIT 1), 
 'TC-0101', '問題1: グラフを描いて頂点と軸を求めました。\n問題2: 判別式を使って解の個数を調べました。', 
 'graded', 92, '2024-02-24 21:45:00+09', '素晴らしい解答です。判別式の使い方が完璧です。'),

((SELECT id FROM assignments WHERE title = '理科 - 化学実験レポート' AND teacher_user_id = 'TC-0003' LIMIT 1), 
 'TC-0101', '実験目的: 酸化還元反応の確認\n実験方法: ...\n結果: 銅イオンが還元されて銅が析出した\n考察: 電子の移動により...', 
 'graded', 95, '2024-02-25 22:00:00+09', '実験の理解が深く、考察も論理的です。優秀なレポートです。'),

-- 佐藤次郎（TC-0102）の提出
((SELECT id FROM assignments WHERE title = '英語 - 長文読解練習' AND teacher_user_id = 'TC-0002' LIMIT 1), 
 'TC-0102', '1. The passage discusses climate change.\n2. Three main causes are mentioned.\n3. My opinion is that we need immediate action.', 
 'submitted', NULL, '2024-02-28 18:30:00+09', NULL),

-- 鈴木三郎（TC-0103）の提出
((SELECT id FROM assignments WHERE title = '数学 - 二次関数の基礎' AND teacher_user_id = 'TC-0001' LIMIT 1), 
 'TC-0103', '問題1: y = x² + 2x + 1 = (x + 1)²なので頂点は(-1, 0)\n問題2: 最大値・最小値を求める問題を解きました。', 
 'graded', 78, '2024-02-24 19:00:00+09', '基本は理解できています。計算ミスに注意してください。');

-- ========================================
-- 6. TC生徒の学習記録
-- ========================================

INSERT INTO study_records (student_user_id, tenant_code, subject, topic, duration_minutes, score, study_date, notes) VALUES 
-- 山田太郎（TC-0100）の学習記録
('TC-0100', 'TC', '数学', '二次関数', 90, 88, '2024-02-24', '二次関数のグラフの描き方を理解した。頂点の求め方も覚えた。'),
('TC-0100', 'TC', '英語', '長文読解', 60, 85, '2024-02-27', '読解スピードが上がった。語彙力をもっと増やしたい。'),
('TC-0100', 'TC', '理科', '化学', 75, 82, '2024-02-26', '酸化還元反応の基本を学習。実験が楽しかった。'),

-- 田中花子（TC-0101）の学習記録
('TC-0101', 'TC', '数学', '二次関数', 120, 92, '2024-02-24', '判別式の応用問題まで解けるようになった。'),
('TC-0101', 'TC', '理科', '化学実験', 100, 95, '2024-02-25', '実験レポートの書き方が分かった。考察が重要。'),
('TC-0101', 'TC', '英語', '文法', 45, 89, '2024-02-28', '仮定法の使い方を復習した。'),

-- 佐藤次郎（TC-0102）の学習記録
('TC-0102', 'TC', '英語', '長文読解', 80, 78, '2024-02-28', '難しい単語が多かった。辞書を使って理解した。'),
('TC-0102', 'TC', '数学', '三角関数', 95, 85, '2024-03-01', '三角関数の基本公式を覚えた。グラフも描けるようになった。'),

-- 鈴木三郎（TC-0103）の学習記録
('TC-0103', 'TC', '数学', '二次関数', 70, 78, '2024-02-24', '計算ミスが多い。もっと練習が必要。'),
('TC-0103', 'TC', '理科', '物理', 85, 80, '2024-03-03', '運動方程式の基本を学習。応用問題は難しい。');

-- ========================================
-- 7. TCテナント内のメッセージ
-- ========================================

INSERT INTO messages (tenant_code, sender_user_id, recipient_user_id, subject, content, message_type, created_at) VALUES 
-- 田中先生から全体への連絡
('TC', 'TC-0001', NULL, '来週の数学テストについて', '来週火曜日に二次関数のテストを実施します。範囲は教科書P.40-60です。しっかり準備してください。', 'broadcast', '2024-02-20 09:00:00+09'),

-- 佐藤先生から全体への連絡
('TC', 'TC-0002', NULL, '英語検定の申し込みについて', '6月の英語検定の申し込みを開始します。希望者は来週金曜日までに申し出てください。', 'broadcast', '2024-02-21 14:30:00+09'),

-- 田中先生から山田太郎への個別メッセージ
('TC', 'TC-0001', 'TC-0100', '数学の課題について', '二次関数の課題、よくできていました。特にグラフの描き方が正確です。次回は軸の対称性についても説明を加えてもらえると良いですね。', 'direct', '2024-02-25 10:15:00+09'),

-- 山田太郎から田中先生への質問
('TC', 'TC-0100', 'TC-0001', '三角関数について質問', '先生、三角関数のsin, cos, tanの関係がよく分かりません。もう一度説明していただけませんか？', 'direct', '2024-02-26 20:30:00+09'),

-- 田中先生からの回答
('TC', 'TC-0001', 'TC-0100', 'Re: 三角関数について質問', '三角関数の関係について説明します。単位円を使って考えると理解しやすいです。明日の授業で詳しく説明しますね。', 'direct', '2024-02-27 08:45:00+09'),

-- 佐藤先生から田中花子への個別指導
('TC', 'TC-0002', 'TC-0101', '英語の学習方法について', '花子さんの英語力は順調に向上しています。次のステップとして、英字新聞の記事を読むことをお勧めします。', 'direct', '2024-02-28 16:20:00+09');

-- ========================================
-- 8. TCテナントの統計確認
-- ========================================

-- テナント統計の確認
SELECT 'TCテナント統計確認' as check_type;

SELECT 
  tenant_code,
  COUNT(CASE WHEN role = 'TEACHER' THEN 1 END) as teacher_count,
  COUNT(CASE WHEN role = 'STUDENT' THEN 1 END) as student_count,
  COUNT(*) as total_users
FROM profiles 
WHERE tenant_code = 'TC'
GROUP BY tenant_code;

-- 課題提出状況の確認
SELECT 'TC課題提出状況' as check_type;

SELECT 
  a.title,
  a.teacher_user_id,
  COUNT(s.id) as submission_count,
  COUNT(CASE WHEN s.status = 'graded' THEN 1 END) as graded_count,
  ROUND(AVG(s.score), 1) as average_score
FROM assignments a
LEFT JOIN assignment_submissions s ON a.id = s.assignment_id
WHERE a.tenant_code = 'TC'
GROUP BY a.id, a.title, a.teacher_user_id
ORDER BY a.teacher_user_id, a.title;

-- 学習時間統計
SELECT 'TC学習時間統計' as check_type;

SELECT 
  student_user_id,
  subject,
  COUNT(*) as study_sessions,
  SUM(duration_minutes) as total_minutes,
  ROUND(AVG(score), 1) as average_score
FROM study_records 
WHERE tenant_code = 'TC'
GROUP BY student_user_id, subject
ORDER BY student_user_id, subject;

-- ========================================
-- 9. 講師・生徒連動確認クエリ
-- ========================================

SELECT '講師・生徒連動確認' as check_type;

-- TC-0001（田中先生）が管理できる生徒一覧
SELECT 
  'TC-0001が管理できる生徒' as description,
  user_id,
  name,
  role
FROM profiles 
WHERE tenant_code = 'TC' AND role = 'STUDENT'
ORDER BY user_id;

-- TC-0100（山田太郎）が見ることができる課題
SELECT 
  'TC-0100が見ることができる課題' as description,
  a.title,
  a.teacher_user_id,
  a.due_date,
  CASE 
    WHEN s.id IS NOT NULL THEN '提出済み'
    ELSE '未提出'
  END as submission_status
FROM assignments a
LEFT JOIN assignment_submissions s ON a.id = s.assignment_id AND s.student_user_id = 'TC-0100'
WHERE a.tenant_code = 'TC'
ORDER BY a.due_date;

-- テナント分離の確認（他のテナントのデータは見えない）
SELECT 'テナント分離確認' as check_type;

SELECT 
  tenant_code,
  COUNT(*) as user_count
FROM profiles 
GROUP BY tenant_code
ORDER BY tenant_code;

-- ========================================
-- 10. 動作確認手順
-- ========================================

SELECT '動作確認手順' as check_type;

SELECT 
  '1. TC-0001でログイン → 講師ダッシュボード表示確認' as step
UNION ALL
SELECT 
  '2. 生徒管理でTC塾の生徒5名が表示されることを確認' as step
UNION ALL
SELECT 
  '3. 課題管理で作成した6つの課題が表示されることを確認' as step
UNION ALL
SELECT 
  '4. TC-0100でログイン → 生徒ダッシュボード表示確認' as step
UNION ALL
SELECT 
  '5. TC塾の課題のみ表示されることを確認' as step
UNION ALL
SELECT 
  '6. 他のテナント（PM塾など）のデータが見えないことを確認' as step;