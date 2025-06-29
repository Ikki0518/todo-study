import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { LogOut, User, Bell, Calendar, Target, Home, Bot } from 'lucide-react';

export function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isStudent = user?.role === 'STUDENT';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* サイドバー */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200">
        <div className="flex h-full flex-col">
          {/* ロゴ */}
          <div className="flex h-16 items-center px-6 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-gray-900">
              AI学習プランナー
            </h1>
          </div>

          {/* ナビゲーション */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {isStudent ? (
              <>
                <Link
                  to="/planner"
                  className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700"
                >
                  <Calendar className="mr-3 h-5 w-5" />
                  デイリープランナー
                </Link>
                <Link
                  to="/goals"
                  className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700"
                >
                  <Target className="mr-3 h-5 w-5" />
                  目標管理
                </Link>
                <Link
                  to="/ai"
                  className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700 bg-blue-50 text-blue-700 border-l-4 border-blue-500"
                >
                  <Bot className="mr-3 h-5 w-5" />
                  AI学習パートナー
                </Link>
              </>
            ) : (
              <Link
                to="/dashboard"
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700"
              >
                <Home className="mr-3 h-5 w-5" />
                ダッシュボード
              </Link>
            )}
            
            <Link
              to="/notifications"
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700"
            >
              <Bell className="mr-3 h-5 w-5" />
              通知
            </Link>
            
            <Link
              to="/profile"
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700"
            >
              <User className="mr-3 h-5 w-5" />
              プロフィール
            </Link>
          </nav>

          {/* ユーザー情報とログアウト */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.email}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-3 p-2 text-gray-400 hover:text-gray-500"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="pl-64">
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}