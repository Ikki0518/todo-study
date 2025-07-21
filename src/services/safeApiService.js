/**
 * セーフAPIサービス - サロゲート文字エラー対応
 * 「invalid high surrogate in string」エラーを防ぐための安全なAPI通信
 */

import { 
  sanitizeObjectForJSON, 
  isValidForJSON, 
  detectProblematicChars, 
  toSafeLogString 
} from '../utils/stringUtils.js';

/**
 * エラー報告サービス
 */
const reportError = (errorType, details) => {
  console.error(`[${errorType}]`, details);
  
  // 本番環境では外部のエラー追跡サービスに送信
  if (import.meta.env.PROD) {
    // 例: Sentry, LogRocket, etc.
    // sentry.captureException(new Error(errorType), { extra: details });
  }
};

/**
 * JSONサロゲート文字エラーのハンドリング
 */
export const handleJSONError = (error, data) => {
  if (error.message.includes('invalid high surrogate')) {
    const problemDetails = typeof data === 'string' 
      ? detectProblematicChars(data)
      : { hasProblems: false, details: [] };
      
    console.error('サロゲート文字エラー詳細:', {
      error: error.message,
      dataType: typeof data,
      dataLength: data?.toString()?.length,
      problematicChars: problemDetails.details,
      safePreview: toSafeLogString(data, 200)
    });
    
    reportError('JSON_SURROGATE_ERROR', {
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      errorMessage: error.message,
      dataPreview: toSafeLogString(data, 500)
    });
    
    return true; // このエラーを処理済みとマーク
  }
  return false;
};

/**
 * 安全なJSON変換
 */
export const safeJSONStringify = (data, fallbackValue = '{}') => {
  try {
    // まず元データでテスト
    if (isValidForJSON(data)) {
      return JSON.stringify(data);
    }
    
    console.warn('元データがJSON変換できません。サニタイズを実行...');
    
    // サニタイズしてリトライ
    const sanitizedData = sanitizeObjectForJSON(data);
    const jsonString = JSON.stringify(sanitizedData);
    
    console.log('サニタイズ後のJSON変換成功');
    return jsonString;
    
  } catch (error) {
    const handled = handleJSONError(error, data);
    
    if (handled) {
      // フォールバック処理
      console.warn('フォールバック値を使用:', fallbackValue);
      return fallbackValue;
    }
    
    throw error; // 他のエラーは再throw
  }
};

/**
 * 安全なAPIリクエスト
 */
export const safeFetch = async (url, options = {}) => {
  const { body, ...restOptions } = options;
  
  try {
    let processedBody = body;
    
    // bodyが存在する場合の処理
    if (body && typeof body === 'object') {
      console.log('APIリクエストデータをサニタイズ中...');
      
      // 1. データのサニタイズ
      const sanitizedData = sanitizeObjectForJSON(body);
      
      // 2. JSON変換テスト
      const jsonString = safeJSONStringify(sanitizedData);
      
      console.log('送信データサイズ:', jsonString.length, 'bytes');
      processedBody = jsonString;
    }
    
    // 3. リクエスト送信
    const response = await fetch(url, {
      ...restOptions,
      body: processedBody,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        ...restOptions.headers,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }
    
    return response;
    
  } catch (error) {
    console.error('API送信エラー:', error);
    
    // サロゲート文字エラーの場合の追加処理
    if (handleJSONError(error, body)) {
      // 緊急回避策：ASCII文字のみでリトライ
      console.log('ASCII文字のみでリトライを実行...');
      
      const asciiOnlyBody = JSON.stringify(body).replace(/[^\x00-\x7F]/g, '');
      
      return fetch(url, {
        ...restOptions,
        body: asciiOnlyBody,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          ...restOptions.headers,
        },
      });
    }
    
    throw error;
  }
};

/**
 * POST リクエスト専用
 */
export const safePost = async (url, data) => {
  return safeFetch(url, {
    method: 'POST',
    body: data,
  });
};

/**
 * PUT リクエスト専用  
 */
export const safePut = async (url, data) => {
  return safeFetch(url, {
    method: 'PUT',
    body: data,
  });
};

/**
 * PATCH リクエスト専用
 */
export const safePatch = async (url, data) => {
  return safeFetch(url, {
    method: 'PATCH',
    body: data,
  });
};

/**
 * レスポンスデータの安全な解析
 */
export const safeParseResponse = async (response) => {
  try {
    const text = await response.text();
    
    // 空のレスポンスの場合
    if (!text.trim()) {
      return null;
    }
    
    // サニタイズしてからパース
    const sanitizedText = sanitizeObjectForJSON(text);
    return JSON.parse(sanitizedText);
    
  } catch (error) {
    console.error('レスポンス解析エラー:', error);
    
    if (handleJSONError(error, text)) {
      // フォールバック: 空オブジェクトを返す
      return {};
    }
    
    throw error;
  }
};

/**
 * WebSocket送信時の安全なデータ処理
 */
export const safeSendWebSocket = (websocket, data) => {
  try {
    const jsonString = safeJSONStringify(data);
    websocket.send(jsonString);
    
  } catch (error) {
    console.error('WebSocket送信エラー:', error);
    
    if (handleJSONError(error, data)) {
      // フォールバック: エラー通知のみ送信
      websocket.send(JSON.stringify({ 
        error: 'データ送信エラー', 
        timestamp: new Date().toISOString() 
      }));
    }
  }
};

/**
 * ローカルストレージへの安全な保存
 */
export const safeSetLocalStorage = (key, data) => {
  try {
    const jsonString = safeJSONStringify(data);
    localStorage.setItem(key, jsonString);
    
  } catch (error) {
    console.error('ローカルストレージ保存エラー:', error);
    
    if (handleJSONError(error, data)) {
      // フォールバック: データを文字列化してASCII文字のみで保存
      const fallbackString = String(data).replace(/[^\x00-\x7F]/g, '');
      localStorage.setItem(key, JSON.stringify({ 
        data: fallbackString, 
        sanitized: true,
        timestamp: new Date().toISOString()
      }));
    }
  }
};

/**
 * 開発環境でのデバッグ情報
 */
export const debugStringData = (data, label = 'Data') => {
  if (import.meta.env.DEV) {
    console.group(`🔍 [DEBUG] ${label}`);
    console.log('Original:', data);
    console.log('Type:', typeof data);
    
    if (typeof data === 'string') {
      const problems = detectProblematicChars(data);
      console.log('Problems detected:', problems);
      
      if (problems.hasProblems) {
        console.log('Sanitized:', sanitizeStringForJSON(data));
      }
    }
    
    console.log('JSON valid:', isValidForJSON(data));
    console.groupEnd();
  }
};

// デフォルトエクスポート
export default {
  safeFetch,
  safePost,
  safePut,
  safePatch,
  safeParseResponse,
  safeSendWebSocket,
  safeSetLocalStorage,
  safeJSONStringify,
  handleJSONError,
  debugStringData
};