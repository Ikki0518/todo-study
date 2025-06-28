import { create } from 'zustand';
import { User } from '@ai-study-planner/shared';

interface AuthState {
  user: User | null;
  loading: boolean;
  checkAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  
  checkAuth: async () => {
    try {
      // 実際の実装では、APIを呼び出してトークンの検証を行う
      const token = localStorage.getItem('token');
      if (token) {
        // ダミーユーザーデータ
        set({ 
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'テストユーザー',
            role: 'STUDENT' as any,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          loading: false 
        });
      } else {
        set({ user: null, loading: false });
      }
    } catch (error) {
      set({ user: null, loading: false });
    }
  },
  
  login: async (email: string, password: string) => {
    // 実際の実装では、APIを呼び出して認証を行う
    localStorage.setItem('token', 'dummy-token');
    await useAuthStore.getState().checkAuth();
  },
  
  logout: async () => {
    localStorage.removeItem('token');
    set({ user: null });
  },
}));