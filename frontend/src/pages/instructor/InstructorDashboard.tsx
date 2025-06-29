import React, { useState, useEffect } from 'react';
import { Student, Task, TaskStatus, Notification, NotificationType, UserRole } from '../../types';

interface StudentSummary {
  student: Student;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  todayTasks: number;
}

export function InstructorDashboard() {
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // モックデータ（実際にはAPIから取得）
  useEffect(() => {
    const mockStudents: StudentSummary[] = [
      {
        student: {
          id: '1',
          email: 'student1@example.com',
          name: '田中太郎',
          role: UserRole.STUDENT,
          instructorId: 'instructor1',
          currentStreak: 7,
          lastStudiedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        totalTasks: 15,
        completedTasks: 12,
        overdueTasks: 2,
        todayTasks: 3
      },
      {
        student: {
          id: '2',
          email: 'student2@example.com',
          name: '佐藤花子',
          role: UserRole.STUDENT,
          instructorId: 'instructor1',
          currentStreak: 3,
          lastStudiedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        totalTasks: 20,
        completedTasks: 18,
        overdueTasks: 0,
        todayTasks: 2
      }
    ];

    const mockNotifications: Notification[] = [
      {
        id: '1',
        recipientId: 'instructor1',
        studentId: '1',
        type: NotificationType.OVERDUE_TASKS_THRESHOLD,
        title: '未達成タスクの注意',
        message: '田中太郎さんの未達成タスクが2件あります',
        read: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    setStudents(mockStudents);
    setNotifications(mockNotifications);
    setLoading(false);
  }, []);

  const getStreakColor = (streak: number) => {
    if (streak >= 7) return 'text-green-600 bg-green-100';
    if (streak >= 3) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getProgressPercentage = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">講師ダッシュボード</h1>
      
      {/* 概要統計 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-sm text-gray-600">担当生徒数</div>
          <div className="text-2xl font-bold text-gray-900">{students.length}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-600">本日のタスク</div>
          <div className="text-2xl font-bold text-blue-600">
            {students.reduce((sum, s) => sum + s.todayTasks, 0)}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-600">未達成タスク</div>
          <div className="text-2xl font-bold text-red-600">
            {students.reduce((sum, s) => sum + s.overdueTasks, 0)}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-600">未読通知</div>
          <div className="text-2xl font-bold text-orange-600">
            {notifications.filter(n => !n.read).length}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 担当生徒一覧 */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">担当生徒一覧</h2>
            <div className="space-y-4">
              {students.map((studentSummary) => (
                <div
                  key={studentSummary.student.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          {studentSummary.student.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {studentSummary.student.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {studentSummary.student.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStreakColor(studentSummary.student.currentStreak)}`}>
                        {studentSummary.student.currentStreak}日連続
                      </span>
                      <button
                        onClick={() => {
                          // 詳細ページへの遷移（後で実装）
                          console.log('生徒詳細ページに遷移:', studentSummary.student.id);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer"
                      >
                        詳細 →
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">本日:</span>
                      <span className="ml-1 font-medium text-blue-600">
                        {studentSummary.todayTasks}件
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">完了率:</span>
                      <span className="ml-1 font-medium text-green-600">
                        {getProgressPercentage(studentSummary.completedTasks, studentSummary.totalTasks)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">未達成:</span>
                      <span className="ml-1 font-medium text-red-600">
                        {studentSummary.overdueTasks}件
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">総タスク:</span>
                      <span className="ml-1 font-medium text-gray-900">
                        {studentSummary.totalTasks}件
                      </span>
                    </div>
                  </div>

                  {/* 進捗バー */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${getProgressPercentage(studentSummary.completedTasks, studentSummary.totalTasks)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 通知 */}
        <div>
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">重要な通知</h2>
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <p className="text-gray-600 text-sm">新しい通知はありません</p>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border-l-4 ${
                      notification.read
                        ? 'bg-gray-50 border-gray-300'
                        : 'bg-orange-50 border-orange-400'
                    }`}
                  >
                    <h4 className="font-medium text-gray-900 text-sm">
                      {notification.title}
                    </h4>
                    <p className="text-gray-600 text-sm mt-1">
                      {notification.message}
                    </p>
                    <p className="text-gray-500 text-xs mt-2">
                      {notification.createdAt.toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}