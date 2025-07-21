/**
 * 文字列サニタイズユーティリティ
 * UTF-16サロゲートペアエラー「invalid high surrogate in string」の解決
 */

/**
 * JSONに安全な文字列にサニタイズ
 * @param {string} str - サニタイズする文字列
 * @returns {string} - サニタイズされた文字列
 */
export const sanitizeStringForJSON = (str) => {
  if (!str || typeof str !== 'string') return str;
  
  try {
    // 1. 孤立したサロゲート文字を除去
    const cleanedStr = str.replace(/[\uD800-\uDFFF]/g, (match, offset) => {
      const charCode = match.charCodeAt(0);
      
      // 高サロゲートの場合（U+D800-U+DBFF）
      if (charCode >= 0xD800 && charCode <= 0xDBFF) {
        // 次の文字が低サロゲートかチェック
        const nextChar = str.charAt(offset + 1);
        const nextCharCode = nextChar.charCodeAt(0);
        
        if (nextCharCode >= 0xDC00 && nextCharCode <= 0xDFFF) {
          // 正常なサロゲートペア
          return match;
        } else {
          // 孤立した高サロゲート - 削除
          console.warn('孤立した高サロゲート文字を削除:', charCode.toString(16));
          return '';
        }
      }
      
      // 低サロゲートの場合（U+DC00-U+DFFF）
      else if (charCode >= 0xDC00 && charCode <= 0xDFFF) {
        // 前の文字が高サロゲートかチェック
        const prevChar = str.charAt(offset - 1);
        const prevCharCode = prevChar.charCodeAt(0);
        
        if (prevCharCode >= 0xD800 && prevCharCode <= 0xDBFF) {
          // 正常なサロゲートペア
          return match;
        } else {
          // 孤立した低サロゲート - 削除
          console.warn('孤立した低サロゲート文字を削除:', charCode.toString(16));
          return '';
        }
      }
      
      return match;
    });
    
    // 2. JSON.stringifyでテスト（エラーが出ないことを確認）
    JSON.stringify(cleanedStr);
    
    return cleanedStr;
    
  } catch (error) {
    console.warn('文字列のサニタイズに失敗:', error);
    // フォールバック: ASCII文字のみを残す
    return str.replace(/[^\x00-\x7F]/g, '');
  }
};

/**
 * 絵文字と特殊文字を完全に除去
 * @param {string} str - 処理する文字列
 * @returns {string} - 絵文字が除去された文字列
 */
export const removeEmojisAndSpecialChars = (str) => {
  if (!str || typeof str !== 'string') return str;
  
  return str
    // 絵文字範囲を除去
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // 感情表現
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // シンボル・絵文字
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // 交通・地図シンボル
    .replace(/[\u{1F700}-\u{1F77F}]/gu, '') // アルファベット記号
    .replace(/[\u{1F780}-\u{1F7FF}]/gu, '') // 幾何学図形
    .replace(/[\u{1F800}-\u{1F8FF}]/gu, '') // 矢印記号
    .replace(/[\u{2600}-\u{26FF}]/gu, '')   // その他のシンボル
    .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')   // 異体字セレクタ
    // サロゲートペアの除去
    .replace(/[\uD800-\uDFFF]/g, '')
    // 制御文字の除去
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    // 余分な空白を正規化
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * オブジェクト全体をサニタイズ（再帰的）
 * @param {any} obj - サニタイズするオブジェクト
 * @param {string} context - サニタイズのコンテキスト
 * @param {boolean} asciiOnly - ASCII文字のみに制限するかどうか
 * @returns {any} - サニタイズされたオブジェクト
 */
export const sanitizeObjectForJSON = (obj, context = 'sanitizeObjectForJSON', asciiOnly = false) => {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    if (asciiOnly) {
      return obj.replace(/[^\x00-\x7F]/g, '');
    }
    return sanitizeStringForJSON(obj);
  }
  
  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObjectForJSON(item, context, asciiOnly));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = asciiOnly ?
        key.replace(/[^\x00-\x7F]/g, '') :
        sanitizeStringForJSON(key);
      sanitized[sanitizedKey] = sanitizeObjectForJSON(value, context, asciiOnly);
    }
    return sanitized;
  }
  
  return obj;
};

/**
 * JSON文字列の安全性をチェック
 * @param {any} data - チェックするデータ
 * @returns {boolean} - JSON変換可能かどうか
 */
export const isValidForJSON = (data) => {
  try {
    JSON.stringify(data);
    return true;
  } catch (error) {
    console.error('JSON変換チェック失敗:', error.message);
    return false;
  }
};

/**
 * 文字列内の問題のある文字を検出
 * @param {string} str - チェックする文字列
 * @returns {object} - 問題の詳細
 */
export const detectProblematicChars = (str) => {
  if (!str || typeof str !== 'string') {
    return { hasProblems: false, details: [] };
  }
  
  const problems = [];
  
  // サロゲート文字の検出
  const surrogateMatches = str.match(/[\uD800-\uDFFF]/g);
  if (surrogateMatches) {
    problems.push({
      type: 'surrogate',
      count: surrogateMatches.length,
      chars: surrogateMatches,
      positions: []
    });
    
    // 位置を特定
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      if (charCode >= 0xD800 && charCode <= 0xDFFF) {
        problems[problems.length - 1].positions.push({
          index: i,
          char: str.charAt(i),
          code: charCode.toString(16)
        });
      }
    }
  }
  
  // 制御文字の検出
  const controlMatches = str.match(/[\u0000-\u001F\u007F-\u009F]/g);
  if (controlMatches) {
    problems.push({
      type: 'control',
      count: controlMatches.length,
      chars: controlMatches
    });
  }
  
  return {
    hasProblems: problems.length > 0,
    details: problems
  };
};

/**
 * エラーログ用のセーフな文字列変換
 * @param {any} data - ログ出力するデータ
 * @param {number} maxLength - 最大長（デフォルト: 500）
 * @returns {string} - セーフな文字列
 */
export const toSafeLogString = (data, maxLength = 500) => {
  try {
    let str = typeof data === 'string' ? data : JSON.stringify(data);
    str = sanitizeStringForJSON(str);
    return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
  } catch (error) {
    return `[ログ変換エラー: ${error.message}]`;
  }
};
/**
 * JSONエラーハンドリング
 * @param {Error} error - 発生したエラー
 * @param {any} data - エラーの原因となったデータ  
 * @param {string} context - エラーが発生した文脈
 * @returns {boolean} - サロゲートペアエラーかどうか
 */
export const handleJSONError = (error, data, context = 'unknown') => {
  const errorMessage = error?.message || '';
  const isSurrogateError = errorMessage.includes('invalid high surrogate') || 
                          errorMessage.includes('invalid low surrogate') ||
                          errorMessage.includes('surrogate');
  
  if (isSurrogateError) {
    console.error(`🚨 サロゲートペアエラー検出 [${context}]:`, {
      error: errorMessage,
      dataType: typeof data,
      dataPreview: toSafeLogString(data, 100)
    });
    
    if (data && typeof data === 'string') {
      const problems = detectProblematicChars(data);
      if (problems.hasProblems) {
        console.error('問題のある文字の詳細:', problems.details);
      }
    }
    
    return true;
  }
  
  return false;
};

/**
 * デバッグ用文字列データ出力
 * @param {any} data - デバッグするデータ
 * @param {string} label - ラベル
 */
export const debugStringData = (data, label = 'Debug') => {
  console.log(`📝 [${label}] データの詳細分析:`);
  
  if (typeof data === 'string') {
    console.log('文字列長:', data.length);
    console.log('最初の100文字:', data.substring(0, 100));
    
    const problems = detectProblematicChars(data);
    if (problems.hasProblems) {
      console.warn('⚠️ 問題のある文字を検出:', problems.details);
    } else {
      console.log('✅ 文字列は問題なし');
    }
  } else if (typeof data === 'object') {
    try {
      const jsonStr = JSON.stringify(data);
      console.log('JSONサイズ:', jsonStr.length);
      console.log('JSON有効:', isValidForJSON(data));
    } catch (error) {
      console.error('JSON変換エラー:', error.message);
    }
  } else {
    console.log('データタイプ:', typeof data);
    console.log('値:', data);
  }
};

/**
 * 安全なローカルストレージ設定
 * @param {string} key - ストレージキー
 * @param {any} value - 保存する値
 * @returns {Promise<boolean>} - 成功したかどうか
 */
export const safeSetLocalStorage = async (key, value) => {
  try {
    // データをサニタイズ
    const sanitizedValue = sanitizeObjectForJSON(value);
    
    // JSON変換テスト
    const jsonString = JSON.stringify(sanitizedValue);
    
    // ローカルストレージに保存
    localStorage.setItem(key, jsonString);
    
    // 保存の確認
    const saved = localStorage.getItem(key);
    if (saved && JSON.parse(saved)) {
      console.log('✅ ローカルストレージ保存成功:', key);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ ローカルストレージ保存エラー:', error);
    
    // サロゲートペアエラーの場合の特別処理
    if (handleJSONError(error, value, `localStorage.${key}`)) {
      try {
        // ASCII のみでフォールバック保存を試行
        const asciiOnlyValue = sanitizeObjectForJSON(value, 'safeSetLocalStorage.fallback', true);
        const fallbackJson = JSON.stringify(asciiOnlyValue);
        localStorage.setItem(key, fallbackJson);
        console.warn('⚠️ ASCII フォールバックで保存完了:', key);
        return true;
      } catch (fallbackError) {
        console.error('❌ フォールバック保存も失敗:', fallbackError);
        return false;
      }
    }
    
    return false;
  }
};
