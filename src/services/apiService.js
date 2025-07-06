// APIサービス - バックエンドとの通信（最適化版）
class ApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
    this.token = localStorage.getItem('authToken');
    this.authHeadersCache = null; // 認証ヘッダーキャッシュ
    this.requestCache = new Map(); // リクエストキャッシュ
    this.cacheTimeout = 5 * 60 * 1000; // 5分間キャッシュ
  }

  // 認証ヘッダーを取得（キャッシュ機能付き）
  getAuthHeaders() {
    if (this.authHeadersCache && this.authHeadersCache.token === this.token) {
      return this.authHeadersCache.headers;
    }
    
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` })
    };
    
    this.authHeadersCache = { token: this.token, headers };
    return headers;
  }

  // キャッシュキー生成
  getCacheKey(method, endpoint, data) {
    return `${method}:${endpoint}:${JSON.stringify(data)}`;
  }

  // キャッシュの有効性チェック
  isCacheValid(cacheEntry) {
    return Date.now() - cacheEntry.timestamp < this.cacheTimeout;
  }

  // GET リクエスト用キャッシュ管理
  getCachedResponse(cacheKey) {
    const cached = this.requestCache.get(cacheKey);
    if (cached && this.isCacheValid(cached)) {
      return cached.data;
    }
    return null;
  }

  // キャッシュに保存
  setCachedResponse(cacheKey, data) {
    this.requestCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }

  // 汎用APIリクエスト（最適化版）
  async request(method, endpoint, data = null, useCache = false) {
    const cacheKey = this.getCacheKey(method, endpoint, data);
    
    // GETリクエストの場合はキャッシュをチェック
    if (method === 'GET' && useCache) {
      const cached = this.getCachedResponse(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒タイムアウト

      const config = {
        method,
        headers: this.getAuthHeaders(),
        signal: controller.signal
      };

      if (data && method !== 'GET') {
        config.body = JSON.stringify(data);
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // GETリクエストの結果をキャッシュ
      if (method === 'GET' && useCache) {
        this.setCachedResponse(cacheKey, result);
      }

      return result;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('リクエストがタイムアウトしました');
      }
      console.error('API Error:', error);
      throw error;
    }
  }

  // GET リクエスト（キャッシュ付き）
  async get(endpoint, useCache = true) {
    return this.request('GET', endpoint, null, useCache);
  }

  // POST リクエスト
  async post(endpoint, data) {
    return this.request('POST', endpoint, data);
  }

  // PUT リクエスト
  async put(endpoint, data) {
    return this.request('PUT', endpoint, data);
  }

  // DELETE リクエスト
  async delete(endpoint) {
    return this.request('DELETE', endpoint);
  }

  // 認証関連の最適化
  setAuthToken(token) {
    this.token = token;
    this.authHeadersCache = null; // キャッシュクリア
    localStorage.setItem('authToken', token);
  }

  clearAuthToken() {
    this.token = null;
    this.authHeadersCache = null; // キャッシュクリア
    this.requestCache.clear(); // リクエストキャッシュもクリア
    localStorage.removeItem('authToken');
  }

  // 最適化されたログイン処理
  async login(email, password) {
    try {
      const response = await this.post('/auth/login', { email, password });
      if (response.success && response.data.token) {
        this.setAuthToken(response.data.token);
      }
      return response;
    } catch (error) {
      // ネットワークエラーの場合は特定のエラーを投げる
      if (error.message.includes('fetch')) {
        throw new Error('ネットワークに接続できません');
      }
      throw error;
    }
  }

  // 最適化されたログアウト処理
  async logout() {
    try {
      await this.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
      // ログアウト時はエラーがあってもトークンをクリア
    } finally {
      this.clearAuthToken();
    }
  }

  // 並列リクエスト処理
  async batchRequest(requests) {
    try {
      const promises = requests.map(req => 
        this.request(req.method, req.endpoint, req.data, req.useCache)
      );
      return await Promise.all(promises);
    } catch (error) {
      console.error('Batch request error:', error);
      throw error;
    }
  }

  // タスク関連API（最適化版）
  async getTasks(studentId, date = null) {
    const dateParam = date ? `?date=${date}` : '';
    return this.get(`/tasks/student/${studentId}${dateParam}`, true);
  }

  async getInstructorTasks(instructorId, studentId = null, date = null) {
    const params = new URLSearchParams();
    if (studentId) params.append('studentId', studentId);
    if (date) params.append('date', date);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.get(`/tasks/instructor/${instructorId}${queryString}`, true);
  }

  async createTask(taskData) {
    // タスク作成後はキャッシュをクリア
    const result = await this.post('/tasks', { taskData });
    this.clearTaskCache();
    return result;
  }

  async updateTask(taskId, updates) {
    const result = await this.put(`/tasks/${taskId}`, { updates });
    this.clearTaskCache();
    return result;
  }

  async deleteTask(taskId) {
    const result = await this.delete(`/tasks/${taskId}`);
    this.clearTaskCache();
    return result;
  }

  // タスク関連のキャッシュクリア
  clearTaskCache() {
    const keysToDelete = [];
    for (const [key] of this.requestCache) {
      if (key.includes('/tasks/')) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.requestCache.delete(key));
  }

  async getOverdueTasks(studentId) {
    return this.get(`/tasks/overdue/${studentId}`, true);
  }

  async getTaskStats(studentId, date = null) {
    const dateParam = date ? `?date=${date}` : '';
    return this.get(`/tasks/stats/${studentId}${dateParam}`, true);
  }

  // コメント関連API
  async getTaskComments(taskId) {
    return this.get(`/comments/task/${taskId}`, true);
  }

  async getStudentComments(studentId, limit = null) {
    const limitParam = limit ? `?limit=${limit}` : '';
    return this.get(`/comments/student/${studentId}${limitParam}`, true);
  }

  async createComment(taskId, studentId, content) {
    const result = await this.post('/comments', { taskId, studentId, content });
    this.clearCommentCache();
    return result;
  }

  async updateComment(commentId, content) {
    const result = await this.put(`/comments/${commentId}`, { content });
    this.clearCommentCache();
    return result;
  }

  async deleteComment(commentId) {
    const result = await this.delete(`/comments/${commentId}`);
    this.clearCommentCache();
    return result;
  }

  // コメント関連のキャッシュクリア
  clearCommentCache() {
    const keysToDelete = [];
    for (const [key] of this.requestCache) {
      if (key.includes('/comments/')) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.requestCache.delete(key));
  }

  async getCommentStats(instructorId, period = null) {
    const periodParam = period ? `?period=${period}` : '';
    return this.get(`/comments/stats/${instructorId}${periodParam}`, true);
  }

  // 新規登録
  async register(userData) {
    const response = await this.post('/auth/register', userData);
    if (response.success && response.data.token) {
      this.setAuthToken(response.data.token);
    }
    return response;
  }

  // 現在のユーザー情報取得
  async getCurrentUser() {
    return this.get('/auth/me', true);
  }

  // 招待の確認
  async validateInvite(token) {
    return this.get(`/auth/invite/${token}`, false);
  }

  // パスワードリセット要求
  async requestPasswordReset(email) {
    return this.post('/auth/forgot-password', { email });
  }

  // パスワードリセット実行
  async resetPassword(token, password) {
    return this.post('/auth/reset-password', { token, password });
  }

  // ヘルスチェック
  async healthCheck() {
    return this.get('/health', false);
  }
}

export default new ApiService();