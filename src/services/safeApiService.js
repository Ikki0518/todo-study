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

// リクエスト制限設定（より厳しい設定）
const RATE_LIMIT_CONFIG = {
  maxRequestsPerMinute: 15, // 30から15に削減
  maxRequestsPerSecond: 1,  // 2から1に削減
  retryDelay: 5000, // 2秒から5秒に増加
  maxRetries: 2     // 3から2に削減
};

// リクエスト履歴管理
class RequestRateLimiter {
  constructor() {
    this.requests = [];
    this.lastRequestTime = 0;
  }

  // リクエスト制限チェック
  canMakeRequest() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const oneSecondAgo = now - 1000;

    // 1分間のリクエスト数をチェック
    this.requests = this.requests.filter(time => time > oneMinuteAgo);
    if (this.requests.length >= RATE_LIMIT_CONFIG.maxRequestsPerMinute) {
      return false;
    }

    // 1秒間のリクエスト数をチェック
    const recentRequests = this.requests.filter(time => time > oneSecondAgo);
    if (recentRequests.length >= RATE_LIMIT_CONFIG.maxRequestsPerSecond) {
      return false;
    }

    // 最小間隔チェック（より厳しく）
    if (now - this.lastRequestTime < 1000) { // 500msから1000msに増加
      return false;
    }

    return true;
  }

  // リクエスト記録
  recordRequest() {
    const now = Date.now();
    this.requests.push(now);
    this.lastRequestTime = now;
  }

  // 待機時間計算
  getWaitTime() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const oneSecondAgo = now - 1000;

    this.requests = this.requests.filter(time => time > oneMinuteAgo);
    
    if (this.requests.length >= RATE_LIMIT_CONFIG.maxRequestsPerMinute) {
      return 60000; // 1分待機
    }

    const recentRequests = this.requests.filter(time => time > oneSecondAgo);
    if (recentRequests.length >= RATE_LIMIT_CONFIG.maxRequestsPerSecond) {
      return 1000; // 1秒待機
    }

    return 0;
  }
}

// グローバルレート制限インスタンス
const rateLimiter = new RequestRateLimiter();

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
 * レート制限付きAPIリクエスト
 */
const rateLimitedFetch = async (url, options = {}) => {
  // レート制限チェック
  if (!rateLimiter.canMakeRequest()) {
    const waitTime = rateLimiter.getWaitTime();
    console.log(`⏳ レート制限により${waitTime}ms待機中...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  // リクエスト記録
  rateLimiter.recordRequest();

  return fetch(url, options);
};

/**
 * 安全なAPIリクエスト（Overloadedエラー対応）
 */
export const safeFetch = async (url, options = {}) => {
  const { body, ...restOptions } = options;
  
  const executeRequest = async (attempt = 1) => {
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
      
      // 3. レート制限付きリクエスト送信
      const response = await rateLimitedFetch(url, {
        ...restOptions,
        body: processedBody,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          ...restOptions.headers,
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(`API Error: ${response.status} - ${errorText}`);
        
        // Overloadedエラーの場合
        if (errorText.includes('Overloaded') || errorText.includes('overloaded')) {
          if (attempt < RATE_LIMIT_CONFIG.maxRetries) {
            const delay = RATE_LIMIT_CONFIG.retryDelay * attempt;
            console.log(`🔄 Overloadedエラー検出、${delay}ms後にリトライ (${attempt}/${RATE_LIMIT_CONFIG.maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return executeRequest(attempt + 1);
          }
        }
        
        throw error;
      }
      
      return response;
      
    } catch (error) {
      console.error('API送信エラー:', error);
      
      // サロゲート文字エラーの場合の追加処理
      if (handleJSONError(error, body)) {
        // 緊急回避策：ASCII文字のみでリトライ
        console.log('ASCII文字のみでリトライを実行...');
        
        const asciiOnlyBody = JSON.stringify(body).replace(/[^\x00-\x7F]/g, '');
        
        return rateLimitedFetch(url, {
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

  return executeRequest();
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
        console.log('Sanitized:', sanitizeObjectForJSON(data));
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