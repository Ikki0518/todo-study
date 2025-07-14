-- ユーザープロファイルテーブル（新システム）
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id VARCHAR(10) UNIQUE NOT NULL, -- PM-0001 形式のユーザーID
  email VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20),
  role VARCHAR(20) NOT NULL CHECK (role IN ('TEACHER', 'STUDENT')),
  tenant_code VARCHAR(10) NOT NULL, -- 塾コード (PM, TM など)
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_auth_id ON profiles(auth_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_code ON profiles(tenant_code);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_role ON profiles(tenant_code, role);

-- テナント情報テーブル
CREATE TABLE IF NOT EXISTS tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL, -- PM, TM など
  name VARCHAR(100) NOT NULL, -- 塾名
  description TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- デフォルトテナントを挿入
INSERT INTO tenants (code, name, description) VALUES 
('PM', 'プライムメソッド', 'プライムメソッド学習塾'),
('TM', 'トップメソッド', 'トップメソッド学習塾')
ON CONFLICT (code) DO NOTHING;

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
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- プロファイルのRLSポリシー
CREATE POLICY "Users can view profiles in same tenant" ON profiles
  FOR SELECT USING (
    tenant_code = (
      SELECT tenant_code FROM profiles 
      WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth_id = auth.uid());

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

-- 関数: ユーザーIDからロールを取得
CREATE OR REPLACE FUNCTION get_role_from_user_id(user_id_param VARCHAR(10))
RETURNS VARCHAR(20) AS $$
DECLARE
  id_number INTEGER;
BEGIN
  -- ユーザーIDから番号部分を抽出 (例: PM-0042 -> 42)
  id_number := CAST(SUBSTRING(user_id_param FROM '\-(\d{4})$') AS INTEGER);
  
  -- 番号に基づいてロールを判定
  IF id_number >= 1 AND id_number <= 99 THEN
    RETURN 'TEACHER';
  ELSE
    RETURN 'STUDENT';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 関数: テナントコードをユーザーIDから抽出
CREATE OR REPLACE FUNCTION get_tenant_code_from_user_id(user_id_param VARCHAR(10))
RETURNS VARCHAR(10) AS $$
BEGIN
  -- ユーザーIDからテナントコード部分を抽出 (例: PM-0042 -> PM)
  RETURN SUBSTRING(user_id_param FROM '^([A-Z]+)\-');
END;
$$ LANGUAGE plpgsql;

-- 関数: 次に利用可能なユーザーID番号を取得
CREATE OR REPLACE FUNCTION get_next_user_id_number(tenant_code_param VARCHAR(10), role_param VARCHAR(20))
RETURNS INTEGER AS $$
DECLARE
  min_id INTEGER;
  max_id INTEGER;
  next_id INTEGER;
BEGIN
  -- ロールに基づいて範囲を設定
  IF role_param = 'TEACHER' THEN
    min_id := 1;
    max_id := 99;
  ELSE
    min_id := 100;
    max_id := 9999;
  END IF;
  
  -- 既存のIDから次に利用可能な番号を見つける
  SELECT COALESCE(MIN(t.id), min_id) INTO next_id
  FROM (
    SELECT generate_series(min_id, max_id) AS id
    EXCEPT
    SELECT CAST(SUBSTRING(user_id FROM '\-(\d{4})$') AS INTEGER)
    FROM profiles
    WHERE tenant_code = tenant_code_param
    AND user_id ~ ('^' || tenant_code_param || '\-\d{4}$')
    AND CAST(SUBSTRING(user_id FROM '\-(\d{4})$') AS INTEGER) BETWEEN min_id AND max_id
  ) t;
  
  RETURN next_id;
END;
$$ LANGUAGE plpgsql;

-- トリガー関数: プロファイル更新時にupdated_atを自動更新
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー作成
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignment_submissions_updated_at BEFORE UPDATE ON assignment_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_records_updated_at BEFORE UPDATE ON study_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();