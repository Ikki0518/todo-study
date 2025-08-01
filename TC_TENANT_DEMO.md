# 🏫 TCテナント管理システム デモ

## 📋 TCテナントの構成例

### **講師（管理者）**
- `TC-0001` - 田中先生（数学担当）
- `TC-0002` - 佐藤先生（英語担当）
- `TC-0003` - 鈴木先生（理科担当）

### **生徒**
- `TC-0100` - 山田太郎（高校1年）
- `TC-0101` - 田中花子（高校2年）
- `TC-0102` - 佐藤次郎（高校3年）
- `TC-0103` - 鈴木三郎（中学3年）

## 🔗 講師・生徒の連動システム

### **1. 講師ダッシュボード（TC-0001でログイン）**

#### **生徒管理画面**
```
📊 TC塾 - 生徒管理

👥 担当生徒一覧（4名）
┌─────────────────────────────────────┐
│ TC-0100 山田太郎 [高1] 📈 進捗: 85%   │
│ TC-0101 田中花子 [高2] 📈 進捗: 92%   │
│ TC-0102 佐藤次郎 [高3] 📈 進捗: 78%   │
│ TC-0103 鈴木三郎 [中3] 📈 進捗: 88%   │
└─────────────────────────────────────┘

📝 最近の提出物
• TC-0100: 数学課題 - 提出済み (85点)
• TC-0101: 英語エッセイ - 未提出
• TC-0102: 物理レポート - 提出済み (92点)
```

#### **課題管理画面**
```
📚 課題管理

📝 作成した課題
┌─────────────────────────────────────┐
│ 数学 - 二次関数の応用                  │
│ 対象: TC-0100, TC-0103              │
│ 期限: 2024-02-20                    │
│ 提出状況: 1/2 完了                   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 英語 - 長文読解練習                   │
│ 対象: 全生徒                         │
│ 期限: 2024-02-25                    │
│ 提出状況: 2/4 完了                   │
└─────────────────────────────────────┘
```

### **2. 生徒ダッシュボード（TC-0100でログイン）**

#### **課題一覧**
```
📋 TC-0100 山田太郎 - 課題一覧

📝 提出待ち課題
┌─────────────────────────────────────┐
│ 数学 - 二次関数の応用                  │
│ 担当: TC-0001 田中先生               │
│ 期限: 2024-02-20 (あと3日)          │
│ [提出する]                          │
└─────────────────────────────────────┘

✅ 完了済み課題
┌─────────────────────────────────────┐
│ 英語 - 長文読解練習                   │
│ 担当: TC-0002 佐藤先生               │
│ 提出日: 2024-02-15                  │
│ 評価: 85点 💬 フィードバックあり      │
└─────────────────────────────────────┘
```

## 🔄 実際のデータ連動フロー

### **講師が課題を作成**
```javascript
// TC-0001（田中先生）が課題作成
const assignment = {
  teacher_user_id: 'TC-0001',
  tenant_code: 'TC',
  title: '数学 - 二次関数の応用',
  target_students: ['TC-0100', 'TC-0103'],
  due_date: '2024-02-20'
};

// データベースに保存
await database.createAssignment(assignment);
```

### **生徒が課題を確認**
```javascript
// TC-0100（山田太郎）がログイン時
const assignments = await database.getStudentAssignments('TC-0100');
// → TC塾の講師が作成した課題のみ表示
// → 他のテナント（PM塾など）の課題は見えない
```

### **講師が生徒の進捗を確認**
```javascript
// TC-0001（田中先生）が生徒管理画面を開く
const students = await database.getTeacherStudents('TC-0001');
// → TC塾の生徒のみ表示（TC-0100〜TC-9999）
// → 他のテナントの生徒は見えない

const progress = await database.getStudentProgress('TC-0100');
// → 山田太郎の詳細な学習進捗を確認
```

## 🛡️ セキュリティ・分離機能

### **テナント分離**
```sql
-- TC-0001（講師）がアクセスできるデータ
SELECT * FROM profiles 
WHERE tenant_code = 'TC' 
AND role = 'STUDENT';
-- → TC塾の生徒のみ表示

-- TC-0100（生徒）がアクセスできるデータ
SELECT * FROM assignments 
WHERE tenant_code = 'TC';
-- → TC塾の課題のみ表示
```

### **ロール制限**
```sql
-- 講師のみ実行可能
CREATE POLICY "Teachers can manage assignments" ON assignments
  FOR ALL USING (
    teacher_user_id = (
      SELECT user_id FROM profiles 
      WHERE auth_id = auth.uid() AND role = 'TEACHER'
    )
  );

-- 生徒は自分の提出物のみアクセス可能
CREATE POLICY "Students can manage own submissions" ON submissions
  FOR ALL USING (
    student_user_id = (
      SELECT user_id FROM profiles 
      WHERE auth_id = auth.uid() AND role = 'STUDENT'
    )
  );
```

## 📊 実際の管理機能

### **講師ができること（TC-0001〜TC-0099）**

#### **生徒管理**
- TC塾の全生徒の一覧表示
- 個別の学習進捗確認
- 成績・評価の管理
- 出席状況の確認

#### **課題管理**
- 課題の作成・編集・削除
- 提出状況の一覧確認
- 採点・フィードバック
- 期限管理

#### **分析機能**
- クラス全体の成績分析
- 個別生徒の学習傾向
- 課題の難易度分析
- 進捗レポート生成

#### **コミュニケーション**
- 生徒への個別メッセージ
- 全体への連絡事項
- 保護者への進捗報告

### **生徒ができること（TC-0100〜TC-9999）**

#### **学習管理**
- 自分の課題一覧確認
- 課題の提出
- 成績・評価の確認
- 学習計画の作成

#### **進捗確認**
- 自分の学習進捗
- 目標達成状況
- 過去の成績推移
- 弱点分析

#### **コミュニケーション**
- 講師への質問
- 課題に関する相談
- 学習相談

## 🎯 TCテナントでの実際の使用例

### **シナリオ1: 新しい課題作成**
```
1. TC-0001（田中先生）がログイン
2. 「課題管理」→「新しい課題を作成」
3. 課題詳細を入力:
   - タイトル: 「三角関数の基礎」
   - 対象生徒: TC-0100, TC-0101を選択
   - 期限: 2024-03-01
4. 「作成」ボタンをクリック
5. システムが自動でTC塾の対象生徒に通知
```

### **シナリオ2: 生徒の課題提出**
```
1. TC-0100（山田太郎）がログイン
2. ダッシュボードに新しい課題が表示
3. 「三角関数の基礎」をクリック
4. 課題内容を確認して解答を入力
5. 「提出」ボタンをクリック
6. TC-0001（田中先生）に自動で提出通知
```

### **シナリオ3: 講師の進捗確認**
```
1. TC-0001（田中先生）がログイン
2. 「生徒管理」をクリック
3. TC-0100（山田太郎）の詳細を確認:
   - 今週の学習時間: 12時間
   - 課題提出率: 95%
   - 平均点: 87点
   - 弱点: 三角関数の応用
4. 個別指導計画を作成
```

## ✅ 連動確認チェックリスト

### **講師側（TC-0001）**
- [ ] TC塾の生徒のみ表示される
- [ ] 他のテナント（PM塾など）の生徒は見えない
- [ ] 課題作成時にTC塾の生徒のみ選択可能
- [ ] TC塾の生徒の進捗のみ確認可能
- [ ] TC塾内でのメッセージ送受信

### **生徒側（TC-0100）**
- [ ] TC塾の講師からの課題のみ表示
- [ ] TC塾の講師とのみメッセージ交換可能
- [ ] 自分の学習データのみアクセス可能
- [ ] TC塾の統計情報のみ表示

### **データ分離**
- [ ] テナント間でのデータ漏洩なし
- [ ] 適切なロール制限
- [ ] セキュリティポリシーの動作確認

## 🚀 TCテナントのセットアップ

### **1. テナント追加**
```sql
INSERT INTO tenants (code, name, description) VALUES 
('TC', 'TC学習塾', 'TC学習塾の管理システム');
```

### **2. テスト用ユーザー作成**
```sql
-- 講師
INSERT INTO profiles (auth_id, user_id, email, name, role, tenant_code) VALUES 
('uuid-tc-teacher-1', 'TC-0001', 'teacher@tc.com', '田中先生', 'TEACHER', 'TC');

-- 生徒
INSERT INTO profiles (auth_id, user_id, email, name, role, tenant_code) VALUES 
('uuid-tc-student-1', 'TC-0100', 'student1@tc.com', '山田太郎', 'STUDENT', 'TC'),
('uuid-tc-student-2', 'TC-0101', 'student2@tc.com', '田中花子', 'STUDENT', 'TC');
```

### **3. 動作確認**
1. TC-0001でログイン → 講師ダッシュボード表示
2. 生徒管理でTC塾の生徒のみ表示確認
3. TC-0100でログイン → 生徒ダッシュボード表示
4. TC塾の課題のみ表示確認

**これで、TCテナントの講師（TC-0001〜TC-0099）が生徒（TC-0100〜TC-9999）を完全に管理できるシステムが動作します！** 🎉