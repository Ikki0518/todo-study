const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  avatar_url?: string;
  timezone: string;
  email_verified: boolean;
  last_login_at?: string;
}

export interface LoginResponse {
  success: boolean;
  data?: {
    user: User;
    token: string;
  };
  message?: string;
  errors?: any[];
}

export interface InvitationInfo {
  email: string;
  role: 'STUDENT' | 'INSTRUCTOR';
  metadata: any;
}

export interface Invitation {
  id: string;
  email: string;
  role: 'STUDENT' | 'INSTRUCTOR';
  invited_by: string;
  instructor_id?: string;
  token: string;
  expires_at: string;
  used_at?: string;
  is_used: boolean;
  metadata: any;
  created_at: string;
  updated_at: string;
}

class AuthService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  // 認証ヘッダーを取得
  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // APIリクエストのヘルパー
  private async apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'APIリクエストに失敗しました');
    }

    return data;
  }

  // 招待リンクの検証
  async validateInvitation(token: string): Promise<InvitationInfo> {
    const data = await this.apiRequest(`/auth/invite/${token}`);
    return data.data;
  }

  // ユーザー登録（招待経由）
  async registerWithInvitation(
    token: string,
    name: string,
    password: string,
    additionalData: any = {}
  ): Promise<LoginResponse> {
    const data = await this.apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        token,
        name,
        password,
        additionalData,
      }),
    });

    if (data.success && data.data.token) {
      this.setToken(data.data.token);
    }

    return data;
  }

  // ログイン
  async login(email: string, password: string): Promise<LoginResponse> {
    const data = await this.apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (data.success && data.data.token) {
      this.setToken(data.data.token);
    }

    return data;
  }

  // ログアウト
  async logout(): Promise<void> {
    try {
      if (this.token) {
        await this.apiRequest('/auth/logout', {
          method: 'POST',
        });
      }
    } catch (error) {
      console.error('ログアウトエラー:', error);
    } finally {
      this.clearToken();
    }
  }

  // 現在のユーザー情報を取得
  async getCurrentUser(): Promise<User | null> {
    try {
      if (!this.token) {
        return null;
      }

      const data = await this.apiRequest('/auth/me');
      return data.data.user;
    } catch (error) {
      console.error('ユーザー情報取得エラー:', error);
      this.clearToken();
      return null;
    }
  }

  // 招待を作成（管理者・講師用）
  async createInvitation(
    email: string,
    role: 'STUDENT' | 'INSTRUCTOR',
    instructorId?: string,
    metadata: any = {}
  ): Promise<{ invitation: Invitation; inviteUrl: string }> {
    const data = await this.apiRequest('/auth/invite', {
      method: 'POST',
      body: JSON.stringify({
        email,
        role,
        instructorId,
        metadata,
      }),
    });

    return data.data;
  }

  // 招待一覧を取得
  async getInvitations(): Promise<Invitation[]> {
    const data = await this.apiRequest('/auth/invitations');
    return data.data.invitations;
  }

  // 招待を削除
  async revokeInvitation(invitationId: string): Promise<void> {
    await this.apiRequest(`/auth/invitations/${invitationId}`, {
      method: 'DELETE',
    });
  }

  // パスワードリセット要求
  async forgotPassword(email: string): Promise<{ resetUrl?: string }> {
    const data = await this.apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    return data.data || {};
  }

  // パスワードリセット実行
  async resetPassword(token: string, password: string): Promise<void> {
    await this.apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  // トークンの設定
  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  // トークンのクリア
  clearToken(): void {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  // 認証状態の確認
  isAuthenticated(): boolean {
    return !!this.token;
  }

  // トークンの取得
  getToken(): string | null {
    return this.token;
  }
}

export const authService = new AuthService();
export default authService;