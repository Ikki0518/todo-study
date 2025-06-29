import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DailyPlannerPage } from './pages/student/DailyPlannerPage';
import { GoalsPage } from './pages/student/GoalsPage';
import { AIStudyPlannerPage } from './pages/student/AIStudyPlannerPage';
import { InstructorDashboard } from './pages/instructor/InstructorDashboard';
import { StudentDetailPage } from './pages/instructor/StudentDetailPage';
import { ProfilePage } from './pages/common/ProfilePage';
import { NotificationsPage } from './pages/common/NotificationsPage';
import { PrivateRoute } from './components/auth/PrivateRoute';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { UserRole } from './types';

function App() {
  const { user, loading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* 認証ページ */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* プライベートルート */}
      <Route element={<PrivateRoute />}>
        <Route element={<DashboardLayout />}>
          {/* 共通ページ */}
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />

          {/* 生徒用ページ */}
          {user?.role === UserRole.STUDENT && (
            <>
              <Route path="/planner" element={<DailyPlannerPage />} />
              <Route path="/goals" element={<GoalsPage />} />
              <Route path="/ai" element={<AIStudyPlannerPage />} />
              <Route path="/" element={<Navigate to="/planner" replace />} />
            </>
          )}

          {/* 講師用ページ */}
          {user?.role === UserRole.INSTRUCTOR && (
            <>
              <Route path="/dashboard" element={<InstructorDashboard />} />
              <Route path="/students/:studentId" element={<StudentDetailPage />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </>
          )}
        </Route>
      </Route>

      {/* デフォルトリダイレクト */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;