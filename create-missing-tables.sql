-- 不足しているテーブルを作成するSQL

-- 課題テーブル
CREATE TABLE IF NOT EXISTS assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_code VARCHAR(10) NOT NULL REFERENCES tenants(code),
  teacher_user_id VARCHAR(10) NOT NULL, -- 作成した講師のユーザーID
  title VARCHAR(200) NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 課題提出テーブル
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_user_id VARCHAR(10) NOT NULL, -- 提出した生徒のユーザーID
  content TEXT,
  files JSONB DEFAULT '[]', -- ファイル情報の配列
  status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'graded')),
  score INTEGER,
  feedback TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  graded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 学習記録テーブル
CREATE TABLE IF NOT EXISTS study_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_user_id VARCHAR(10) NOT NULL, -- 学習した生徒のユーザーID
  tenant_code VARCHAR(10) NOT NULL,
  subject VARCHAR(50),
  topic VARCHAR(100),
  duration_minutes INTEGER NOT NULL,
  score INTEGER,
  notes TEXT,
  study_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- メッセージテーブル
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_code VARCHAR(10) NOT NULL,
  sender_user_id VARCHAR(10) NOT NULL, -- 送信者のユーザーID
  recipient_user_id VARCHAR(10), -- 受信者のユーザーID（NULLの場合は全体メッセージ）
  subject VARCHAR(200),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  message_type VARCHAR(20) DEFAULT 'direct' CHECK (message_type IN ('direct', 'broadcast', 'system')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_assignments_tenant_code ON assignments(tenant_code);
CREATE INDEX IF NOT EXISTS idx_assignments_teacher ON assignments(teacher_user_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student ON assignment_submissions(student_user_id);
CREATE INDEX IF NOT EXISTS idx_study_records_student ON study_records(student_user_id);
CREATE INDEX IF NOT EXISTS idx_study_records_date ON study_records(study_date);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_tenant ON messages(tenant_code);

-- RLS (Row Level Security) ポリシー設定
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 課題のRLSポリシー
CREATE POLICY "Teachers can manage assignments in their tenant" ON assignments
  FOR ALL USING (
    tenant_code = (
      SELECT tenant_code FROM profiles 
      WHERE auth_id = auth.uid() AND role = 'TEACHER'
    )
  );

CREATE POLICY "Students can view assignments in their tenant" ON assignments
  FOR SELECT USING (
    tenant_code = (
      SELECT tenant_code FROM profiles 
      WHERE auth_id = auth.uid()
    )
  );

-- 課題提出のRLSポリシー
CREATE POLICY "Students can manage own submissions" ON assignment_submissions
  FOR ALL USING (
    student_user_id = (
      SELECT user_id FROM profiles 
      WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can view submissions in their tenant" ON assignment_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assignments a
      JOIN profiles p ON p.auth_id = auth.uid()
      WHERE a.id = assignment_submissions.assignment_id
      AND a.tenant_code = p.tenant_code
      AND p.role = 'TEACHER'
    )
  );

-- 学習記録のRLSポリシー
CREATE POLICY "Students can manage own study records" ON study_records
  FOR ALL USING (
    student_user_id = (
      SELECT user_id FROM profiles 
      WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can view study records in their tenant" ON study_records
  FOR SELECT USING (
    tenant_code = (
      SELECT tenant_code FROM profiles 
      WHERE auth_id = auth.uid() AND role = 'TEACHER'
    )
  );

-- メッセージのRLSポリシー
CREATE POLICY "Users can view messages in their tenant" ON messages
  FOR SELECT USING (
    tenant_code = (
      SELECT tenant_code FROM profiles 
      WHERE auth_id = auth.uid()
    )
    AND (
      recipient_user_id = (
        SELECT user_id FROM profiles 
        WHERE auth_id = auth.uid()
      )
      OR recipient_user_id IS NULL -- 全体メッセージ
      OR sender_user_id = (
        SELECT user_id FROM profiles 
        WHERE auth_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can send messages in their tenant" ON messages
  FOR INSERT WITH CHECK (
    tenant_code = (
      SELECT tenant_code FROM profiles 
      WHERE auth_id = auth.uid()
    )
    AND sender_user_id = (
      SELECT user_id FROM profiles 
      WHERE auth_id = auth.uid()
    )
  );

-- トリガー関数: プロファイル更新時にupdated_atを自動更新
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー作成
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignment_submissions_updated_at BEFORE UPDATE ON assignment_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_records_updated_at BEFORE UPDATE ON study_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- サンプルデータの挿入
-- 課題のサンプルデータ
INSERT INTO assignments (tenant_code, teacher_user_id, title, description, due_date, status) VALUES 
('PM', 'PM-0001', '数学 - 二次関数の基礎', '二次関数のグラフの描き方と性質について学習してください。', '2025-01-31 23:59:59+09', 'active'),
('PM', 'PM-0001', '英語 - 現在完了形', '現在完了形の用法と例文を覚えてください。', '2025-02-05 23:59:59+09', 'active'),
('TM', 'TM-0001', '物理 - 力学の基礎', 'ニュートンの運動法則について理解してください。', '2025-02-10 23:59:59+09', 'active')
ON CONFLICT DO NOTHING;

-- 学習記録のサンプルデータ
INSERT INTO study_records (student_user_id, tenant_code, subject, topic, duration_minutes, score, study_date) VALUES 
('PM-0100', 'PM', '数学', '二次関数', 60, 85, '2025-01-15'),
('PM-0100', 'PM', '英語', '現在完了形', 45, 78, '2025-01-16'),
('PM-0101', 'PM', '数学', '二次関数', 90, 92, '2025-01-15'),
('PM-0102', 'PM', '英語', '現在完了形', 30, 65, '2025-01-17')
ON CONFLICT DO NOTHING;

-- メッセージのサンプルデータ
INSERT INTO messages (tenant_code, sender_user_id, recipient_user_id, subject, content, message_type) VALUES 
('PM', 'PM-0001', 'PM-0100', '課題について', '二次関数の課題、よくできていました。次回はもう少し応用問題にも挑戦してみてください。', 'direct'),
('PM', 'PM-0001', NULL, '今週の予定', '今週は期末テスト対策を重点的に行います。', 'broadcast'),
('TM', 'TM-0001', NULL, 'システムメンテナンス', 'システムメンテナンスのため、明日の午後2時から4時まで利用できません。', 'system')
ON CONFLICT DO NOTHING;