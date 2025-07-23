import { supabase } from './supabase'
import {
  sanitizeObjectForJSON,
  handleJSONError,
  debugStringData,
  sanitizeStringForJSON,
  toSafeLogString
} from '../utils/stringUtils.js'

// リトライ設定（より保守的な設定）
const RETRY_CONFIG = {
  maxAttempts: 2, // 3回から2回に削減
  baseDelay: 3000, // 1秒から3秒に増加
  maxDelay: 10000,  // 5秒から10秒に増加
  backoffMultiplier: 3 // 2から3に増加
};

// 指数バックオフでリトライ
const retryWithBackoff = async (operation, attempt = 1) => {
  try {
    return await operation();
  } catch (error) {
    // Overloadedエラーの場合のみリトライ
    const isOverloadedError = error.message && (
      error.message.includes('Overloaded') ||
      error.message.includes('overloaded') ||
      error.message.includes('rate limit') ||
      error.message.includes('too many requests')
    );

    if (!isOverloadedError || attempt >= RETRY_CONFIG.maxAttempts) {
      // リトライ回数上限に達した場合、ローカルストレージにフォールバック
      if (isOverloadedError && attempt >= RETRY_CONFIG.maxAttempts) {
        console.log('🛑 リトライ回数上限に達しました。ローカルストレージにフォールバックします。');
        return null; // フォールバック処理を呼び出し元で実行
      }
      throw error;
    }

    // 指数バックオフ計算
    const delay = Math.min(
      RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt - 1),
      RETRY_CONFIG.maxDelay
    );

    console.log(`🔄 Overloadedエラー検出、${delay}ms後にリトライ (${attempt}/${RETRY_CONFIG.maxAttempts})`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryWithBackoff(operation, attempt + 1);
  }
};

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
  // ユーザーのタスクデータを保存（Overloadedエラー対応）
  async saveUserTasks(userId, tasksData) {
    const result = await retryWithBackoff(async () => {
      try {
        console.log('💾 タスクデータを保存中:', userId);
        
        // データのサニタイズ
        const sanitizedUserId = sanitizeStringForJSON(userId);
        const sanitizedTasksData = sanitizeObjectForJSON(tasksData);
        
        const client = await getAuthenticatedClient();
        
        // selectを追加してレスポンスを取得
        const { data, error } = await client
          .from('user_tasks')
          .upsert({
            user_id: sanitizedUserId,
            tasks_data: sanitizedTasksData,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          })
          .select();

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
        
        throw error;
      }
    });

    // リトライ失敗時のフォールバック処理
    if (result === null) {
      console.log('🛑 リトライ失敗、ローカルストレージにフォールバック保存');
      
      // ローカルストレージにフォールバック保存
      try {
        const fallbackData = {
          userId,
          tasksData,
          savedAt: new Date().toISOString(),
          source: 'overloaded_fallback',
          error: 'Overloaded error - retry limit reached'
        };
        localStorage.setItem(`tasks_fallback_${userId}`, JSON.stringify(fallbackData));
        localStorage.setItem(`tasks_${userId}`, JSON.stringify(tasksData));
        console.log('✅ フォールバック保存完了（ローカルストレージ）');
        
        // ユーザーに通知
        alert('サーバーが混雑しています。データはローカルに保存されました。');
        
        return { success: true, source: 'local_storage' };
      } catch (fallbackError) {
        console.error('❌ フォールバック保存も失敗:', fallbackError);
        throw fallbackError;
      }
    }

    return result;
  },

  // ユーザーのタスクデータを読み込み（Overloadedエラー対応）
  async loadUserTasks(userId) {
    return retryWithBackoff(async () => {
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
          
          // 2. ローカルストレージから復元を試行
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
          
          // 3. 空のデータを返す
          console.log('ℹ️ データが見つからないため、空のデータを返します');
          return {
            todayTasks: [],
            scheduledTasks: {},
            dailyTaskPool: []
          };
        }

        console.log('✅ タスクデータ読み込み完了:', data);
        return data?.tasks_data || {
          todayTasks: [],
          scheduledTasks: {},
          dailyTaskPool: []
        };
      } catch (error) {
        console.error('❌ タスクデータ読み込み失敗:', error);
        
        // JSON関連のエラーハンドリング
        const handled = handleJSONError(error, { userId });
        if (handled) {
          console.log('⚠️ サロゲート文字エラーを処理済み');
        }
        
        // フォールバック処理
        try {
          const fallbackData = localStorage.getItem(`tasks_fallback_${userId}`);
          if (fallbackData) {
            const parsed = JSON.parse(fallbackData);
            console.log('✅ フォールバックデータから復元:', parsed.tasksData);
            return parsed.tasksData;
          }
        } catch (fallbackError) {
          console.warn('⚠️ フォールバックデータ復元失敗:', fallbackError);
        }
        
        // 最終フォールバック
        return {
          todayTasks: [],
          scheduledTasks: {},
          dailyTaskPool: []
        };
      }
    });
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