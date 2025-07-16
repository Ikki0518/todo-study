import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface Student {
  id: string;
  name: string;
  email: string;
  instructor: {
    name: string;
  };
  tasksCompleted: number;
  totalTasks: number;
  lastActive: Date;
}

interface Instructor {
  id: string;
  name: string;
  email: string;
  studentCount: number;
}

export function AdminDashboard() {
  const { user } = useAuthStore();
  const [students, setStudents] = useState<Student[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'students' | 'instructors'>('students');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // TODO: 実際のAPI呼び出しに置き換える
      setStudents([
        {
          id: '1',
          name: '田中太郎',
          email: 'tanaka@example.com',
          instructor: { name: '山田先生' },
          tasksCompleted: 25,
          totalTasks: 30,
          lastActive: new Date(),
        },
        {
          id: '2',
          name: '佐藤花子',
          email: 'sato@example.com',
          instructor: { name: '鈴木先生' },
          tasksCompleted: 18,
          totalTasks: 25,
          lastActive: new Date(),
        },
      ]);

      setInstructors([
        {
          id: '1',
          name: '山田先生',
          email: 'yamada@example.com',
          studentCount: 15,
        },
        {
          id: '2',
          name: '鈴木先生',
          email: 'suzuki@example.com',
          studentCount: 12,
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">管理者ダッシュボード</h1>
        <p className="text-gray-600">塾全体の受講生とタスクの管理</p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">総受講生数</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{students.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">講師数</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{instructors.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">今日のタスク完了率</div>
          <div className="mt-2 text-3xl font-bold text-green-600">75%</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">アクティブな受講生</div>
          <div className="mt-2 text-3xl font-bold text-blue-600">{students.length}</div>
        </div>
      </div>

      {/* タブ */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('students')}
              className={`px-6 py-3 border-b-2 font-medium text-sm ${
                activeTab === 'students'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              受講生一覧
            </button>
            <button
              onClick={() => setActiveTab('instructors')}
              className={`px-6 py-3 border-b-2 font-medium text-sm ${
                activeTab === 'instructors'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              講師一覧
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'students' ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">受講生一覧</h2>
                <button className="btn-primary">
                  新規受講生を追加
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        名前
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        メールアドレス
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        担当講師
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        タスク進捗
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        最終アクティブ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student) => (
                      <tr key={student.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.instructor.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{
                                  width: `${(student.tasksCompleted / student.totalTasks) * 100}%`,
                                }}
                              />
                            </div>
                            <span>
                              {student.tasksCompleted}/{student.totalTasks}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(student.lastActive).toLocaleDateString('ja-JP')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            to={`/admin/students/${student.id}`}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            詳細
                          </Link>
                          <button className="text-red-600 hover:text-red-900">
                            削除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">講師一覧</h2>
                <button className="btn-primary">
                  新規講師を追加
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        名前
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        メールアドレス
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        担当受講生数
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {instructors.map((instructor) => (
                      <tr key={instructor.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {instructor.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {instructor.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {instructor.studentCount}名
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            to={`/admin/instructors/${instructor.id}`}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            詳細
                          </Link>
                          <button className="text-red-600 hover:text-red-900">
                            削除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}