// APIサービス - バックエンドとの通信
class ApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
    this.token = localStorage.getItem('authToken');
  }

  // 認証ヘッダーを取得
  getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` })
    };
  }

  // 汎用APIリクエスト
  async request(method, endpoint, data = null) {
    try {
      const config = {
        method,
        headers: this.getAuthHeaders(),
      };

      if (data) {
        config.body = JSON.stringify(data);
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'API request failed');
      }

      return result;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // GET リクエスト
  async get(endpoint) {
    return this.request('GET', endpoint);
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

  // タスク関連API
  async getTasks(studentId, date = null) {
    const dateParam = date ? `?date=${date}` : '';
    return this.get(`/tasks/student/${studentId}${dateParam}`);
  }

  async getInstructorTasks(instructorId, studentId = null, date = null) {
    const params = new URLSearchParams();
    if (studentId) params.append('studentId', studentId);
    if (date) params.append('date', date);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.get(`/tasks/instructor/${instructorId}${queryString}`);
  }

  async createTask(taskData) {
    return this.post('/tasks', { taskData });
  }

  async updateTask(taskId, updates) {
    return this.put(`/tasks/${taskId}`, { updates });
  }

  async deleteTask(taskId) {
    return this.delete(`/tasks/${taskId}`);
  }

  async getOverdueTasks(studentId) {
    return this.get(`/tasks/overdue/${studentId}`);
  }

  async getTaskStats(studentId, date = null) {
    const dateParam = date ? `?date=${date}` : '';
    return this.get(`/tasks/stats/${studentId}${dateParam}`);
  }

  // コメント関連API
  async getTaskComments(taskId) {
    return this.get(`/comments/task/${taskId}`);
  }

  async getStudentComments(studentId, limit = null) {
    const limitParam = limit ? `?limit=${limit}` : '';
    return this.get(`/comments/student/${studentId}${limitParam}`);
  }

  async createComment(taskId, studentId, content) {
    return this.post('/comments', { taskId, studentId, content });
  }

  async updateComment(commentId, content) {
    return this.put(`/comments/${commentId}`, { content });
  }

  async deleteComment(commentId) {
    return this.delete(`/comments/${commentId}`);
  }

  async getCommentStats(instructorId, period = null) {
    const periodParam = period ? `?period=${period}` : '';
    return this.get(`/comments/stats/${instructorId}${periodParam}`);
  }

  // 認証関連
  setAuthToken(token) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  clearAuthToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  // ログイン
  async login(email, password) {
    const response = await this.post('/auth/login', { email, password });
    if (response.success && response.data.token) {
      this.setAuthToken(response.data.token);
    }
    return response;
  }

  // ログアウト
  async logout() {
    try {
      await this.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuthToken();
    }
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
    return this.get('/auth/me');
  }

  // 招待の確認
  async validateInvite(token) {
    return this.get(`/auth/invite/${token}`);
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
    return this.get('/health');
  }
}

export default new ApiService();