// ローカルストレージベースのタスクサービス
import { useState, useEffect } from 'react';
import {
  sanitizeObjectForJSON,
  handleJSONError
} from '../utils/stringUtils.js';

// ローカルストレージキー
const LOCAL_STORAGE_KEYS = {
  TASKS: 'tasks',
  FALLBACK: 'tasks_fallback'
};

// Overloadedエラー検出関数
const isOverloadedError = (error) => {
  if (!error || !error.message) return false;
  
  const overloadedKeywords = [
    'overloaded',
    'Overloaded',
    'rate limit',
    'too many requests',
    'retry attempt'
  ];
  
  return overloadedKeywords.some(keyword => 
    error.message.includes(keyword)
  );
};

export const localTaskService = {
  // ユーザーのタスクデータを保存（Overloadedエラー対応強化）
  async saveUserTasks(userId, tasksData) {
    try {
      console.log('💾 ローカルタスクデータを保存中:', userId);
      
      // データのサニタイズ
      const sanitizedUserId = String(userId).replace(/[^\x00-\x7F]/g, '');
      const sanitizedTasksData = JSON.parse(
        JSON.stringify(tasksData).replace(/[^\x00-\x7F]/g, '')
      );
      
      // フォールバックデータも保存
      const fallbackData = {
        userId: sanitizedUserId,
        tasksData: sanitizedTasksData,
        updatedAt: new Date().toISOString(),
        source: 'local_task_service',
        version: '1.0'
      };
      
      // メインデータとフォールバックデータの両方を保存
      localStorage.setItem(LOCAL_STORAGE_KEYS.TASKS, JSON.stringify(sanitizedTasksData));
      localStorage.setItem(`${LOCAL_STORAGE_KEYS.FALLBACK}_${sanitizedUserId}`, JSON.stringify(fallbackData));
      
      console.log('✅ ローカルタスクデータ保存完了');
      return { success: true, source: 'local_storage' };
      
    } catch (error) {
      console.error('❌ ローカルタスクデータ保存失敗:', error);
      
      // サロゲートペアエラーの場合の特別処理
      if (handleJSONError(error, tasksData, 'localTaskService.saveUserTasks')) {
        // エラーをログに記録し、フォールバックデータで再試行
        const fallbackData = {
          userId: String(userId).replace(/[^\x00-\x7F]/g, ''),
          tasksData: {},
          updatedAt: new Date().toISOString(),
          error: 'surrogate_pair_error_fallback'
        };
        localStorage.setItem(LOCAL_STORAGE_KEYS.TASKS, JSON.stringify(fallbackData));
        return fallbackData;
      }
      
      throw error;
    }
  },

  // ユーザーのタスクデータを読み込み（Overloadedエラー対応強化）
  async loadUserTasks(userId) {
    try {
      console.log('📖 ローカルタスクデータを読み込み中:', userId);
      
      // ユーザーIDのサニタイズ
      const sanitizedUserId = String(userId).replace(/[^\x00-\x7F]/g, '');
      
      // まずメインデータから読み込みを試行
      let tasksData = localStorage.getItem(LOCAL_STORAGE_KEYS.TASKS);
      
      if (tasksData) {
        try {
          const parsed = JSON.parse(tasksData);
          console.log('✅ ローカルタスクデータ読み込み完了');
          return parsed;
        } catch (parseError) {
          console.warn('⚠️ メインデータの解析に失敗、フォールバックデータを試行');
        }
      }
      
      // フォールバックデータから読み込みを試行
      const fallbackData = localStorage.getItem(`${LOCAL_STORAGE_KEYS.FALLBACK}_${sanitizedUserId}`);
      if (fallbackData) {
        try {
          const parsed = JSON.parse(fallbackData);
          console.log('✅ フォールバックデータから読み込み完了');
          return parsed.tasksData || parsed;
        } catch (fallbackError) {
          console.warn('⚠️ フォールバックデータの解析にも失敗');
        }
      }
      
      // データが見つからない場合はサンプルデータを返す
      console.log('ℹ️ ローカルデータが見つからないため、サンプルデータを返します');
      return this.getSampleTasks();
      
    } catch (error) {
      console.error('❌ ローカルタスクデータ読み込み失敗:', error);
      
      // サロゲートペアエラーの場合の特別処理
      if (handleJSONError(error, null, 'localTaskService.loadUserTasks.catch')) {
        // 破損したデータを削除
        localStorage.removeItem(LOCAL_STORAGE_KEYS.TASKS);
        console.log('🔄 破損データを削除してサンプルタスクを返します');
      }
      
      // エラーの場合は空のオブジェクトを返してアプリが動作するようにする
      return this.getSampleTasks();
    }
  },

  // サンプルタスクデータ
  getSampleTasks() {
    return {
      todayTasks: [
        {
          id: 'sample-1',
          title: 'サンプルタスク',
          description: 'これはサンプルタスクです',
          priority: 'medium',
          timeRequired: 30,
          completed: false
        }
      ],
      scheduledTasks: {},
      dailyTaskPool: [],
      completedTasks: [],
      goals: []
    };
  },

  // Overloadedエラー時の緊急保存
  emergencySave(userId, tasksData) {
    try {
      console.log('🚨 緊急保存を実行中:', userId);
      
      const fallbackData = {
        userId: String(userId).replace(/[^\x00-\x7F]/g, ''),
        tasksData: tasksData,
        savedAt: new Date().toISOString(),
        source: 'emergency_save',
        error: 'Overloaded error detected'
      };
      
      localStorage.setItem(`emergency_tasks_${userId}`, JSON.stringify(fallbackData));
      localStorage.setItem(`tasks_${userId}`, JSON.stringify(tasksData));
      
      console.log('✅ 緊急保存完了');
      return true;
    } catch (error) {
      console.error('❌ 緊急保存失敗:', error);
      return false;
    }
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

// useLocalTaskService React フック
export const useLocalTaskService = () => {
  const [todayTasks, setTodayTasks] = useState([]);
  const [dailyTaskPool, setDailyTaskPool] = useState([]);
  const [scheduledTasks, setScheduledTasks] = useState([]);
  const [goals, setGoals] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);

  const userId = 'test-user'; // デフォルトユーザーID

  // タスクデータを読み込み
  const loadTaskData = async () => {
    try {
      const data = await localTaskService.loadUserTasks(userId);
      if (data) {
        setTodayTasks(data.todayTasks || []);
        setDailyTaskPool(data.dailyTaskPool || []);
        setScheduledTasks(data.scheduledTasks || []);
        setGoals(data.goals || []);
        setCompletedTasks(data.completedTasks || []);
      }
    } catch (error) {
      console.error('タスクデータの読み込みに失敗:', error);
    }
  };

  // タスクデータを保存
  const saveTaskData = async (data) => {
    try {
      await localTaskService.saveUserTasks(userId, data);
      
      // 状態を更新
      if (data.todayTasks !== undefined) setTodayTasks(data.todayTasks);
      if (data.dailyTaskPool !== undefined) setDailyTaskPool(data.dailyTaskPool);
      if (data.scheduledTasks !== undefined) setScheduledTasks(data.scheduledTasks);
      if (data.goals !== undefined) setGoals(data.goals);
      if (data.completedTasks !== undefined) setCompletedTasks(data.completedTasks);
    } catch (error) {
      console.error('タスクデータの保存に失敗:', error);
    }
  };

  return {
    todayTasks,
    dailyTaskPool,
    scheduledTasks,
    goals,
    completedTasks,
    loadTaskData,
    saveTaskData
  };
};