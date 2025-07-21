// ローカルストレージベースのタスクサービス
const LOCAL_STORAGE_KEYS = {
  TASKS: 'suna_user_tasks',
  STUDY_PLANS: 'suna_study_plans', 
  EXAM_DATES: 'suna_exam_dates'
};

export const localTaskService = {
  // ユーザーのタスクデータを保存
  async saveUserTasks(userId, tasksData) {
    try {
      console.log('💾 ローカルタスクデータを保存中:', { userId, tasksCount: Object.keys(tasksData).length });
      
      // ローカルストレージに保存
      const storageData = {
        userId,
        tasksData,
        updatedAt: new Date().toISOString()
      };
      
      localStorage.setItem(LOCAL_STORAGE_KEYS.TASKS, JSON.stringify(storageData));
      
      console.log('✅ ローカルタスクデータ保存完了');
      return storageData;
    } catch (error) {
      console.error('❌ ローカルタスクデータ保存失敗:', error);
      throw error;
    }
  },

  // ユーザーのタスクデータを読み込み
  async loadUserTasks(userId) {
    try {
      console.log('📖 ローカルタスクデータを読み込み中:', userId);
      
      const storedData = localStorage.getItem(LOCAL_STORAGE_KEYS.TASKS);
      
      if (!storedData) {
        console.log('📝 ローカルストレージにデータなし - 空のタスクデータを返します');
        return {};
      }
      
      const parsedData = JSON.parse(storedData);
      
      // ユーザーIDが一致するかチェック（将来的に複数ユーザー対応する場合）
      if (parsedData.userId !== userId) {
        console.log('📝 異なるユーザーID - 空のタスクデータを返します');
        return {};
      }
      
      console.log('✅ ローカルタスクデータ読み込み完了:', { 
        tasksCount: Object.keys(parsedData.tasksData || {}).length 
      });
      
      return parsedData.tasksData || {};
    } catch (error) {
      console.error('❌ ローカルタスクデータ読み込み失敗:', error);
      // エラーの場合は空のオブジェクトを返してアプリが動作するようにする
      return this.getSampleTasks();
    }
  },

  // サンプルタスクデータを返す（デモ用）
  getSampleTasks() {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    return {
      [today]: {
        '9': {
          id: `sample-1`,
          title: '数学の勉強',
          priority: 'high',
          duration: 2,
          subject: '数学'
        },
        '14': {
          id: `sample-2`,
          title: '英語のリスニング',
          priority: 'medium',
          duration: 1,
          subject: '英語'
        },
        '19': {
          id: `sample-3`,
          title: '歴史の復習',
          priority: 'low',
          duration: 1,
          subject: '歴史'
        },
        '22': {
          id: `sample-5`,
          title: '化学の宿題',
          priority: 'medium',
          duration: 1,
          subject: '化学'
        },
        '23': {
          id: `sample-6`,
          title: '読書タイム',
          priority: 'low',
          duration: 1,
          subject: 'その他'
        }
      },
      [tomorrow]: {
        '10': {
          id: `sample-4`,
          title: '物理の実験レポート',
          priority: 'high',
          duration: 3,
          subject: '物理'
        }
      }
    };
  },

  // ユーザーの学習計画データを保存
  async saveStudyPlans(userId, studyPlansData) {
    try {
      console.log('💾 ローカル学習計画データを保存中:', { userId, plansCount: studyPlansData.length });
      
      const storageData = {
        userId,
        studyPlansData,
        updatedAt: new Date().toISOString()
      };
      
      localStorage.setItem(LOCAL_STORAGE_KEYS.STUDY_PLANS, JSON.stringify(storageData));
      
      console.log('✅ ローカル学習計画データ保存完了');
      return storageData;
    } catch (error) {
      console.error('❌ ローカル学習計画データ保存失敗:', error);
      throw error;
    }
  },

  // ユーザーの学習計画データを読み込み
  async loadStudyPlans(userId) {
    try {
      console.log('📖 ローカル学習計画データを読み込み中:', userId);
      
      const storedData = localStorage.getItem(LOCAL_STORAGE_KEYS.STUDY_PLANS);
      
      if (!storedData) {
        console.log('📝 ローカルストレージにデータなし - 空の学習計画データを返します');
        return [];
      }
      
      const parsedData = JSON.parse(storedData);
      
      if (parsedData.userId !== userId) {
        console.log('📝 異なるユーザーID - 空の学習計画データを返します');
        return [];
      }
      
      console.log('✅ ローカル学習計画データ読み込み完了:', { 
        plansCount: (parsedData.studyPlansData || []).length 
      });
      
      return parsedData.studyPlansData || [];
    } catch (error) {
      console.error('❌ ローカル学習計画データ読み込み失敗:', error);
      return [];
    }
  },

  // ユーザーの受験日データを保存
  async saveExamDates(userId, examDatesData) {
    try {
      console.log('💾 ローカル受験日データを保存中:', { userId, examCount: examDatesData.length });
      
      const storageData = {
        userId,
        examDatesData,
        updatedAt: new Date().toISOString()
      };
      
      localStorage.setItem(LOCAL_STORAGE_KEYS.EXAM_DATES, JSON.stringify(storageData));
      
      console.log('✅ ローカル受験日データ保存完了');
      return storageData;
    } catch (error) {
      console.error('❌ ローカル受験日データ保存失敗:', error);
      throw error;
    }
  },

  // ユーザーの受験日データを読み込み
  async loadExamDates(userId) {
    try {
      console.log('📖 ローカル受験日データを読み込み中:', userId);
      
      const storedData = localStorage.getItem(LOCAL_STORAGE_KEYS.EXAM_DATES);
      
      if (!storedData) {
        console.log('📝 ローカルストレージにデータなし - 空の受験日データを返します');
        return [];
      }
      
      const parsedData = JSON.parse(storedData);
      
      if (parsedData.userId !== userId) {
        console.log('📝 異なるユーザーID - 空の受験日データを返します');
        return [];
      }
      
      console.log('✅ ローカル受験日データ読み込み完了:', { 
        examCount: (parsedData.examDatesData || []).length 
      });
      
      return parsedData.examDatesData || [];
    } catch (error) {
      console.error('❌ ローカル受験日データ読み込み失敗:', error);
      return [];
    }
  },

  // デバッグ用：全ローカルデータをクリア
  clearAllLocalData() {
    console.log('🧹 全ローカルデータをクリア中...');
    localStorage.removeItem(LOCAL_STORAGE_KEYS.TASKS);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.STUDY_PLANS);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.EXAM_DATES);
    console.log('✅ 全ローカルデータクリア完了');
  },

  // デバッグ用：現在のローカルデータを表示
  debugLocalData() {
    console.log('🔍 現在のローカルデータ:');
    console.log('Tasks:', localStorage.getItem(LOCAL_STORAGE_KEYS.TASKS));
    console.log('Study Plans:', localStorage.getItem(LOCAL_STORAGE_KEYS.STUDY_PLANS));
    console.log('Exam Dates:', localStorage.getItem(LOCAL_STORAGE_KEYS.EXAM_DATES));
  }
};

// デバッグ用グローバル関数をウィンドウに追加
if (typeof window !== 'undefined') {
  window.debugLocalTaskService = localTaskService.debugLocalData;
  window.clearLocalTaskService = localTaskService.clearAllLocalData;
}