import { supabase } from './supabase';

// 講師用データベースサービス
export const instructorService = {
  // 講師の担当生徒一覧を取得
  async getStudents(teacherId) {
    try {
      console.log('📚 講師の担当生徒を取得中:', teacherId);
      
      // profilesテーブルから学生データを取得
      const { data: students, error } = await supabase
        .from('profiles')
        .select(`
          user_id,
          email,
          name,
          role,
          tenant_code,
          created_at,
          updated_at
        `)
        .eq('role', 'STUDENT')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ 生徒データ取得エラー:', error);
        throw error;
      }

      console.log('✅ 生徒データ取得成功:', students?.length || 0, '件');
      
      // データを講師ページ用の形式に変換
      const formattedStudents = students?.map(student => ({
        id: student.user_id,
        name: student.name || 'Unknown Student',
        email: student.email,
        grade: '高校生', // デフォルト値
        subjects: ['数学', '英語'], // デフォルト値
        lastLogin: new Date(student.updated_at).toLocaleString('ja-JP'),
        studyStreak: Math.floor(Math.random() * 15) + 1, // 仮の値
        totalStudyTime: Math.floor(Math.random() * 50) + 10, // 仮の値
        weeklyGoal: 30 + Math.floor(Math.random() * 20), // 仮の値
        avatar: '👨‍🎓',
        status: 'active',
        tenantCode: student.tenant_code,
        createdAt: student.created_at
      })) || [];

      return formattedStudents;
    } catch (error) {
      console.error('❌ 講師サービス - 生徒取得エラー:', error);
      return [];
    }
  },

  // 講師の課題一覧を取得
  async getAssignments(teacherId) {
    try {
      console.log('📋 講師の課題一覧を取得中:', teacherId);
      
      // assignmentsテーブルが存在する場合の処理
      // 現在はテーブルが存在しないため、モックデータを返す
      const mockAssignments = [
        {
          id: 1,
          title: 'プログラミング基礎',
          description: 'JavaScript の基本文法を学習してください。',
          dueDate: '2025-02-15',
          status: 'active',
          studentCount: 5,
          submissionCount: 3,
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          title: 'データベース設計',
          description: 'リレーショナルデータベースの設計原則について学習してください。',
          dueDate: '2025-02-20',
          status: 'active',
          studentCount: 8,
          submissionCount: 2,
          createdAt: new Date().toISOString()
        }
      ];

      console.log('✅ 課題データ取得成功:', mockAssignments.length, '件');
      return mockAssignments;
    } catch (error) {
      console.error('❌ 講師サービス - 課題取得エラー:', error);
      return [];
    }
  },

  // 講師のメッセージ一覧を取得
  async getMessages(teacherId) {
    try {
      console.log('💬 講師のメッセージを取得中:', teacherId);
      
      // messagesテーブルが存在する場合の処理
      // 現在はテーブルが存在しないため、モックデータを返す
      const mockMessages = [
        {
          id: 1,
          subject: '新学期のお知らせ',
          content: '新学期が始まります。皆さん頑張りましょう！',
          messageType: 'broadcast',
          recipientCount: 10,
          readCount: 7,
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          subject: 'システム更新',
          content: 'システムが更新されました。新機能をお試しください。',
          messageType: 'system',
          recipientCount: 15,
          readCount: 12,
          createdAt: new Date().toISOString()
        }
      ];

      console.log('✅ メッセージデータ取得成功:', mockMessages.length, '件');
      return mockMessages;
    } catch (error) {
      console.error('❌ 講師サービス - メッセージ取得エラー:', error);
      return [];
    }
  },

  // 講師の統計情報を取得
  async getAnalytics(teacherId) {
    try {
      console.log('📊 講師の統計情報を取得中:', teacherId);
      
      // 実際の生徒数を取得
      const students = await this.getStudents(teacherId);
      const studentCount = students.length;
      
      // 統計情報を計算
      const analytics = {
        totalStudents: studentCount,
        activeStudents: students.filter(s => s.status === 'active').length,
        averageStudyTime: studentCount > 0 
          ? students.reduce((sum, s) => sum + s.totalStudyTime, 0) / studentCount 
          : 0,
        completionRate: Math.floor(Math.random() * 30) + 70, // 仮の値
        weeklyProgress: Math.floor(Math.random() * 20) + 80, // 仮の値
        lastUpdated: new Date().toISOString()
      };

      console.log('✅ 統計情報取得成功:', analytics);
      return analytics;
    } catch (error) {
      console.error('❌ 講師サービス - 統計情報取得エラー:', error);
      return {
        totalStudents: 0,
        activeStudents: 0,
        averageStudyTime: 0,
        completionRate: 0,
        weeklyProgress: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  },

  // 新しい課題を作成
  async createAssignment(teacherId, assignmentData) {
    try {
      console.log('📝 新しい課題を作成中:', assignmentData);
      
      // 実際の実装では assignmentsテーブルに挿入
      // 現在はモックレスポンスを返す
      const newAssignment = {
        id: Date.now(),
        ...assignmentData,
        teacherId,
        status: 'active',
        studentCount: 0,
        submissionCount: 0,
        createdAt: new Date().toISOString()
      };

      console.log('✅ 課題作成成功:', newAssignment);
      return newAssignment;
    } catch (error) {
      console.error('❌ 講師サービス - 課題作成エラー:', error);
      throw error;
    }
  },

  // メッセージを送信
  async sendMessage(teacherId, messageData) {
    try {
      console.log('📤 メッセージ送信中:', messageData);
      
      // 実際の実装では messagesテーブルに挿入
      // 現在はモックレスポンスを返す
      const newMessage = {
        id: Date.now(),
        ...messageData,
        senderId: teacherId,
        recipientCount: messageData.recipients?.length || 0,
        readCount: 0,
        createdAt: new Date().toISOString()
      };

      console.log('✅ メッセージ送信成功:', newMessage);
      return newMessage;
    } catch (error) {
      console.error('❌ 講師サービス - メッセージ送信エラー:', error);
      throw error;
    }
  }
};

export default instructorService;