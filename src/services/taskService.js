import { supabase } from './supabase'
import {
  sanitizeObjectForJSON,
  handleJSONError,
  debugStringData,
  sanitizeStringForJSON,
  toSafeLogString
} from '../utils/stringUtils.js'

// 認証済みSupabaseクライアントを取得（匿名アクセス対応）
const getAuthenticatedClient = async () => {
  console.log('🔐 Supabaseクライアントを取得中...');
  
  try {
    // セッション確認（エラーが発生しても継続）
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('⚠️ セッション取得エラー（匿名アクセスで継続）:', error.message);
    } else if (session) {
      console.log('✅ 有効なセッションが見つかりました:', session.user.email);
    } else {
      console.log('ℹ️ セッションなし - 匿名アクセスで継続');
    }
    
    return supabase;
  } catch (error) {
    console.log('ℹ️ 認証確認エラー（匿名アクセスで継続）:', error.message);
    return supabase;
  }
};

export const taskService = {
  // ユーザーのタスクデータを保存（サロゲート文字エラー対応）
  async saveUserTasks(userId, tasksData) {
    try {
      console.log('💾 タスクデータを保存中:', { userId, tasksCount: Object.keys(tasksData).length });
      
      // デバッグ情報（開発環境のみ）
      debugStringData(tasksData, 'TasksData before sanitization');
      
      // 1. データのサニタイズ
      const sanitizedTasksData = sanitizeObjectForJSON(tasksData);
      const sanitizedUserId = sanitizeStringForJSON(userId);
      
      console.log('🧹 データサニタイズ完了');
      
      const client = await getAuthenticatedClient();
      
      // RLS回避のため、サービスロールキーを使用するか、RLSを無効化
      const { data, error } = await client
        .from('user_tasks')
        .upsert({
          user_id: sanitizedUserId,
          tasks_data: sanitizedTasksData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select(); // selectを追加してレスポンスを取得

      if (error) {
        console.error('❌ タスクデータ保存エラー:', error);
        console.error('❌ エラー詳細:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        
        // サロゲート文字エラーの特別な処理
        if (error.message && error.message.includes('invalid high surrogate')) {
          console.error('🔍 サロゲート文字エラーを検出:', {
            originalDataPreview: toSafeLogString(tasksData, 200),
            sanitizedDataPreview: toSafeLogString(sanitizedTasksData, 200)
          });
          
          handleJSONError(error, tasksData);
          
          // フォールバック: ASCII文字のみで再試行
          console.log('🔄 ASCII文字のみで再試行...');
          const asciiOnlyData = JSON.parse(
            JSON.stringify(sanitizedTasksData).replace(/[^\x00-\x7F]/g, '')
          );
          
          const retryResult = await client
            .from('user_tasks')
            .upsert({
              user_id: sanitizedUserId,
              tasks_data: asciiOnlyData,
              updated_at: new Date().toISOString()
              // sanitized: true フラグを削除（データベースにカラムが存在しないため）
            }, {
              onConflict: 'user_id'
            });
            
          if (retryResult.error) {
            throw retryResult.error;
          }
          
          console.log('✅ フォールバックでの保存成功');
          return retryResult.data;
        }
        
        throw error;
      }

      console.log('✅ タスクデータ保存完了:', data);
      return data;
    } catch (error) {
      console.error('❌ タスクデータ保存失敗:', error);
      
      // JSON関連のエラーハンドリング
      const handled = handleJSONError(error, tasksData);
      if (handled) {
        console.log('⚠️ サロゲート文字エラーを処理済み');
      }
      
      // ローカルストレージにフォールバック保存
      try {
        const fallbackData = {
          userId,
          tasksData,
          savedAt: new Date().toISOString(),
          source: 'fallback_save',
          error: error.message
        };
        localStorage.setItem(`tasks_fallback_${userId}`, JSON.stringify(fallbackData));
        localStorage.setItem(`tasks_${userId}`, JSON.stringify(tasksData));
        console.log('✅ フォールバック保存完了（ローカルストレージ）');
      } catch (fallbackError) {
        console.error('❌ フォールバック保存も失敗:', fallbackError);
      }
      
      throw error;
    }
  },

  // ユーザーのタスクデータを読み込み（サロゲート文字エラー対応）
  async loadUserTasks(userId) {
    try {
      console.log('📖 タスクデータを読み込み中:', userId);
      
      // ユーザーIDのサニタイズ
      const sanitizedUserId = sanitizeStringForJSON(userId);
      
      const client = await getAuthenticatedClient();
      
      // maybeSingle()を使用してデータが存在しない場合もエラーにしない
      const { data, error } = await client
        .from('user_tasks')
        .select('tasks_data')
        .eq('user_id', sanitizedUserId)
        .maybeSingle();

      if (error) {
        console.error('❌ タスクデータ読み込みエラー:', error);
        console.error('❌ エラー詳細:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          status: error.status
        });
        
        // サロゲート文字エラーの処理
        if (error.message && error.message.includes('invalid high surrogate')) {
          console.error('🔍 データ読み込み時のサロゲート文字エラーを検出');
          handleJSONError(error, { userId });
        }
        
        // データベース読み込み失敗時のフォールバック処理
        console.warn('⚠️ データベース読み込み失敗、フォールバックを試行:', error);
        
        // 1. フォールバックデータから復元を試行
        try {
          const fallbackData = localStorage.getItem(`tasks_fallback_${sanitizedUserId}`);
          if (fallbackData) {
            const parsed = JSON.parse(fallbackData);
            console.log('✅ フォールバックデータから復元:', parsed.tasksData);
            return parsed.tasksData;
          }
        } catch (fallbackError) {
          console.warn('⚠️ フォールバックデータ復元失敗:', fallbackError);
        }
        
        // 2. 通常のローカルストレージから復元を試行
        try {
          const localData = localStorage.getItem(`tasks_${sanitizedUserId}`);
          if (localData) {
            const parsed = JSON.parse(localData);
            console.log('✅ ローカルストレージから復元:', parsed);
            return parsed;
          }
        } catch (localError) {
          console.warn('⚠️ ローカルストレージ復元失敗:', localError);
        }
        
        // エラーが発生してもアプリは継続動作
        console.log('⚠️ 全てのフォールバック失敗、空のデータを返します');
        return {};
      }

      if (!data) {
        console.log('ℹ️ データベースにタスクデータが見つかりません - フォールバック復元を試行');
        
        // データベースにデータがない場合もフォールバックを試行
        try {
          const fallbackData = localStorage.getItem(`tasks_fallback_${sanitizedUserId}`);
          if (fallbackData) {
            const parsed = JSON.parse(fallbackData);
            console.log('✅ フォールバックデータから復元（データなし時）:', parsed.tasksData);
            return parsed.tasksData;
          }
          
          const localData = localStorage.getItem(`tasks_${sanitizedUserId}`);
          if (localData) {
            const parsed = JSON.parse(localData);
            console.log('✅ ローカルストレージから復元（データなし時）:', parsed);
            return parsed;
          }
        } catch (fallbackError) {
          console.warn('⚠️ フォールバック復元失敗（データなし時）:', fallbackError);
        }
        
        // データが存在しない場合は空のオブジェクトを返す
        console.log('📝 新規ユーザー - 空のタスクデータを返します');
        return {};
      }

      // データのサニタイズチェック
      let tasksData = data.tasks_data || {};
      
      // サニタイズ状態の判定をデータ内容ベースに変更
      const jsonString = JSON.stringify(tasksData);
      const isSanitized = !/[^\x00-\x7F]/.test(jsonString);
      if (isSanitized) {
        console.log('ℹ️ ASCII文字のみのデータを読み込み中');
      }
      
      // 念のため読み込んだデータもサニタイズ
      try {
        tasksData = sanitizeObjectForJSON(tasksData);
        debugStringData(tasksData, 'Loaded TasksData after sanitization');
      } catch (sanitizeError) {
        console.warn('⚠️ データサニタイズエラー:', sanitizeError);
        handleJSONError(sanitizeError, tasksData);
        // フォールバック: 空のオブジェクト
        tasksData = {};
      }

      console.log('✅ タスクデータ読み込み完了:', { tasksCount: Object.keys(tasksData).length });
      return tasksData;
    } catch (error) {
      console.error('❌ タスクデータ読み込み失敗:', error);
      
      // JSON関連のエラーハンドリング
      const handled = handleJSONError(error, { userId });
      if (handled) {
        console.log('⚠️ サロゲート文字エラーを処理済み');
      }
      
      console.log('⚠️ 例外を無視して空のデータを返します');
      // エラーの場合は空のオブジェクトを返してアプリが動作するようにする
      return {};
    }
  },

  // ユーザーの学習計画データを保存
  async saveStudyPlans(userId, studyPlansData) {
    try {
      // データ形式を確認して安全に処理
      const safeStudyPlansData = studyPlansData || [];
      const plansCount = Array.isArray(safeStudyPlansData) ? safeStudyPlansData.length : Object.keys(safeStudyPlansData).length;
      
      console.log('💾 学習計画データを保存中:', { userId, plansCount, dataType: typeof safeStudyPlansData });
      
      const client = await getAuthenticatedClient();
      
      const { data, error } = await client
        .from('user_study_plans')
        .upsert({
          user_id: userId,
          study_plans: safeStudyPlansData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('❌ 学習計画データ保存エラー:', error);
        console.error('❌ エラー詳細:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('✅ 学習計画データ保存完了:', data);
      return data;
    } catch (error) {
      console.error('❌ 学習計画データ保存失敗:', error);
      throw error;
    }
  },

  // ユーザーの学習計画データを読み込み
  async loadStudyPlans(userId) {
    try {
      console.log('📖 学習計画データを読み込み中:', userId);
      
      const client = await getAuthenticatedClient();
      
      // maybeSingle()を使用してデータが存在しない場合もエラーにしない
      const { data, error } = await client
        .from('user_study_plans')
        .select('study_plans')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('❌ 学習計画データ読み込みエラー:', error);
        console.error('❌ エラー詳細:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          status: error.status
        });
        // エラーが発生してもアプリは継続動作
        console.log('⚠️ エラーを無視して空のデータを返します');
        return [];
      }

      if (!data) {
        // データが存在しない場合は空の配列を返す
        console.log('📝 新規ユーザー - 空の学習計画データを返します');
        return [];
      }

      console.log('✅ 学習計画データ読み込み完了:', { plansCount: (data.study_plans || []).length });
      return data.study_plans || [];
    } catch (error) {
      console.error('❌ 学習計画データ読み込み失敗:', error);
      console.log('⚠️ 例外を無視して空のデータを返します');
      // エラーの場合は空の配列を返してアプリが動作するようにする
      return [];
    }
  },

  // ユーザーの受験日データを保存
  async saveExamDates(userId, examDatesData) {
    try {
      // データ形式を確認して安全に処理
      const safeExamDatesData = examDatesData || [];
      const examCount = Array.isArray(safeExamDatesData) ? safeExamDatesData.length : Object.keys(safeExamDatesData).length;
      
      console.log('💾 受験日データを保存中:', { userId, examCount, dataType: typeof safeExamDatesData });
      
      const client = await getAuthenticatedClient();
      
      const { data, error } = await client
        .from('user_exam_dates')
        .upsert({
          user_id: userId,
          exam_dates: safeExamDatesData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('❌ 受験日データ保存エラー:', error);
        console.error('❌ エラー詳細:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('✅ 受験日データ保存完了:', data);
      return data;
    } catch (error) {
      console.error('❌ 受験日データ保存失敗:', error);
      throw error;
    }
  },

  // ユーザーの受験日データを読み込み
  async loadExamDates(userId) {
    try {
      console.log('📖 受験日データを読み込み中:', userId);
      
      const client = await getAuthenticatedClient();
      
      // maybeSingle()を使用してデータが存在しない場合もエラーにしない
      const { data, error } = await client
        .from('user_exam_dates')
        .select('exam_dates')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('❌ 受験日データ読み込みエラー:', error);
        console.error('❌ エラー詳細:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          status: error.status
        });
        // エラーが発生してもアプリは継続動作
        console.log('⚠️ エラーを無視して空のデータを返します');
        return [];
      }

      if (!data) {
        // データが存在しない場合は空の配列を返す
        console.log('📝 新規ユーザー - 空の受験日データを返します');
        return [];
      }

      console.log('✅ 受験日データ読み込み完了:', { examCount: (data.exam_dates || []).length });
      return data.exam_dates || [];
    } catch (error) {
      console.error('❌ 受験日データ読み込み失敗:', error);
      console.log('⚠️ 例外を無視して空のデータを返します');
      // エラーの場合は空の配列を返してアプリが動作するようにする
      return [];
    }
  },
};