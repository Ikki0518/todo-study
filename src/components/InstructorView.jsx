import React, { useState, useEffect } from 'react';
import StudentAnalytics from './StudentAnalytics';
import InstructorMessages from './InstructorMessages';
import { ModernAdminUserManagement } from './ModernAdminUserManagement';
import ErrorBoundary from './ErrorBoundary';
import instructorService from '../services/instructorService';

// 講師用ダッシュボードコンポーネント
const InstructorDashboard = () => {
  const [currentView, setCurrentView] = useState('overview'); // overview, students, assignments, analytics, messages
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // 実際のデータベースから取得するデータ
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 現在ログイン中の講師情報を取得
  const getCurrentTeacher = () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      return currentUser.userId || currentUser.id || 'TC-0001'; // デフォルト値
    } catch (error) {
      console.error('講師情報取得エラー:', error);
      return 'TC-0001';
    }
  };

  // データを読み込む
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const teacherId = getCurrentTeacher();
      console.log('📚 講師データ読み込み開始:', teacherId);

      // 並行してデータを取得
      const [studentsData, assignmentsData, messagesData, analyticsData] = await Promise.all([
        instructorService.getStudents(teacherId),
        instructorService.getAssignments(teacherId),
        instructorService.getMessages(teacherId),
        instructorService.getAnalytics(teacherId)
      ]);

      setStudents(studentsData);
      setAssignments(assignmentsData);
      setMessages(messagesData);
      setAnalytics(analyticsData);
      
      console.log('✅ 講師データ読み込み完了');
      console.log('  - 生徒数:', studentsData.length);
      console.log('  - 課題数:', assignmentsData.length);
      console.log('  - メッセージ数:', messagesData.length);
      
    } catch (error) {
      console.error('❌ 講師データ読み込みエラー:', error);
      setError('データの読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  // コンポーネントマウント時にデータを読み込み
  useEffect(() => {
    loadData();
  }, []); // 初回マウント時のみ実行

  // データ再読み込み関数
  const refreshData = () => {
    loadData();
  };

  // ローディング表示
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">講師データを読み込み中...</p>
        </div>
      </div>
    );
  }

  // エラー表示
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️ エラー</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refreshData}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  // モック生徒データ（フォールバック用）
  const fallbackStudents = [
    {
      id: 'fallback-1',
      name: 'サンプル生徒',
      email: 'sample@example.com',
      grade: '高校生',
      subjects: ['数学', '英語'],
      lastLogin: new Date().toLocaleString('ja-JP'),
      studyStreak: 5,
      totalStudyTime: 25.0,
      weeklyGoal: 30,
      avatar: '👨‍🎓',
      status: 'inactive'
    }
  ];

  // 課題データはuseEffectでデータベースから取得

  // モックタスクデータ
  const mockTasks = {
    today: [
      {
        id: 1,
        studentId: 1,
        title: '数学 - 二次関数',
        description: '教科書p.45-50の問題を解く',
        estimatedTime: 60,
        status: 'completed',
        completedAt: '14:30',
        type: 'AI生成',
        subject: '数学'
      },
      {
        id: 2,
        studentId: 1,
        title: '英語 - 長文読解',
        description: '過去問の長文問題3問',
        estimatedTime: 45,
        status: 'in-progress',
        type: '手動',
        subject: '英語'
      },
      {
        id: 3,
        studentId: 2,
        title: '物理 - 力学復習',
        description: '運動方程式の問題',
        estimatedTime: 40,
        status: 'pending',
        type: 'AI生成',
        subject: '物理'
      }
    ],
    overdue: [
      {
        id: 4,
        studentId: 3,
        title: '化学 - 酸化還元',
        description: '昨日の復習問題',
        estimatedTime: 30,
        status: 'overdue',
        originalDate: '2025-01-08',
        subject: '化学'
      }
    ]
  };

  const [tasks, setTasks] = useState(mockTasks);
  const [comments, setComments] = useState({
    1: [
      { id: 1, text: '素晴らしい解答です！この調子で頑張ってください。', timestamp: '2025-01-09 14:35', author: '講師' }
    ],
    2: [
      { id: 2, text: '途中まで良く出来ています。最後の段落も頑張って！', timestamp: '2025-01-09 13:20', author: '講師' }
    ],
  });
  const [newComment, setNewComment] = useState('');
  const [selectedTaskForComment, setSelectedTaskForComment] = useState(null);
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    subject: '',
    description: '',
    dueDate: '',
    assignedTo: []
  });
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsStudent, setAnalyticsStudent] = useState(null);

  // ユーティリティ関数
  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800 border-green-300',
      'in-progress': 'bg-blue-100 text-blue-800 border-blue-300',
      pending: 'bg-gray-100 text-gray-800 border-gray-300',
      overdue: 'bg-red-100 text-red-800 border-red-300',
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || colors.pending;
  };

  const getStatusText = (status) => {
    const texts = {
      completed: '完了',
      'in-progress': '進行中',
      pending: '未着手',
      overdue: '期限切れ',
      active: 'アクティブ',
      inactive: '非アクティブ',
      submitted: '提出済み'
    };
    return texts[status] || '未着手';
  };

  const updateTaskStatus = (taskId, newStatus) => {
    setTasks(prev => ({
      ...prev,
      today: prev.today.map(task => 
        task.id === taskId 
          ? { ...task, status: newStatus, completedAt: newStatus === 'completed' ? new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : null }
          : task
      ),
      overdue: prev.overdue.map(task => 
        task.id === taskId 
          ? { ...task, status: newStatus, completedAt: newStatus === 'completed' ? new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : null }
          : task
      )
    }));
  };

  const addComment = (taskId) => {
    if (newComment.trim()) {
      const comment = {
        id: Date.now(),
        text: newComment.trim(),
        timestamp: new Date().toLocaleString('ja-JP'),
        author: '講師'
      };
      setComments(prev => ({
        ...prev,
        [taskId]: [...(prev[taskId] || []), comment]
      }));
      setNewComment('');
      setSelectedTaskForComment(null);
    }
  };

  const createAssignment = () => {
    if (!newAssignment.title || !newAssignment.subject || !newAssignment.dueDate) {
      alert('必須項目を入力してください。');
      return;
    }

    const assignment = {
      id: Date.now(),
      ...newAssignment,
      status: 'active',
      submissions: [],
      createdAt: new Date().toISOString()
    };

    setAssignments(prev => [...prev, assignment]);
    setNewAssignment({
      title: '',
      subject: '',
      description: '',
      dueDate: '',
      assignedTo: []
    });
    setShowAssignmentModal(false);
  };

  const getStudentById = (id) => students.find(s => s.id === id);

  const getStudentStats = () => {
    const totalStudents = students.length;
    const activeStudents = students.filter(s => s.status === 'active').length;
    const avgStudyTime = students.reduce((sum, s) => sum + s.totalStudyTime, 0) / totalStudents;
    const completedTasks = tasks.today.filter(t => t.status === 'completed').length;
    const totalTasks = tasks.today.length + tasks.overdue.length;

    return {
      totalStudents,
      activeStudents,
      avgStudyTime: avgStudyTime.toFixed(1),
      completedTasks,
      totalTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    };
  };

  const stats = getStudentStats();

  // ナビゲーションタブ
  const NavigationTabs = () => (
    <div className="bg-white rounded-lg shadow-sm mb-6">
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'overview', name: '📊 概要', icon: '📊' },
            { id: 'students', name: '👥 生徒管理', icon: '👥' },
            { id: 'assignments', name: '📝 課題管理', icon: '📝' },
            { id: 'analytics', name: '📈 分析', icon: '📈' },
            { id: 'messages', name: '💬 メッセージ', icon: '💬' },
            { id: 'user-management', name: '⚙️ ユーザー管理', icon: '⚙️' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentView(tab.id)}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                currentView === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );

  // 概要ビュー
  const OverviewView = () => (
    <div className="space-y-6">
      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                <span className="text-blue-600 text-lg">👥</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">総生徒数</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalStudents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                <span className="text-green-600 text-lg">✅</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">アクティブ生徒</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeStudents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                <span className="text-yellow-600 text-lg">⏰</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">平均学習時間</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.avgStudyTime}h</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                <span className="text-purple-600 text-lg">📈</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">完了率</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.completionRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* 最近の活動 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">最近の提出物</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {assignments.flatMap(assignment => 
                assignment.submissions.map(submission => {
                  const student = getStudentById(submission.studentId);
                  return (
                    <div key={`${assignment.id}-${submission.studentId}`} className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <span className="text-2xl">{student?.avatar}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{student?.name}</p>
                        <p className="text-sm text-gray-500">{assignment.title}</p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                          {submission.score}点
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">今日のタスク進捗</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {tasks.today.map(task => {
                const student = getStudentById(task.studentId);
                return (
                  <div key={task.id} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">{student?.avatar}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{student?.name}</p>
                      <p className="text-sm text-gray-500">{task.title}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {getStatusText(task.status)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // 生徒管理ビュー
  const StudentsView = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">生徒一覧</h3>
        </div>
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">生徒</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">学年</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">科目</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">学習時間</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">連続日数</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="text-lg">{student.avatar}</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.grade}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.subjects.join(', ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.totalStudyTime}h / {student.weeklyGoal}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    🔥 {student.studyStreak}日
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
                      {getStatusText(student.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedStudent(student)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      詳細
                    </button>
                    <button
                      onClick={() => {
                        setAnalyticsStudent(student);
                        setShowAnalytics(true);
                      }}
                      className="text-purple-600 hover:text-purple-900 mr-3"
                    >
                      分析
                    </button>
                    <button className="text-green-600 hover:text-green-900">
                      メッセージ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 選択された生徒の詳細 */}
      {selectedStudent && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">{selectedStudent.name} の詳細</h3>
            <button
              onClick={() => setSelectedStudent(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">基本情報</h4>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm text-gray-500">学年</dt>
                    <dd className="text-sm text-gray-900">{selectedStudent.grade}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">担当科目</dt>
                    <dd className="text-sm text-gray-900">{selectedStudent.subjects.join(', ')}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">最終ログイン</dt>
                    <dd className="text-sm text-gray-900">{selectedStudent.lastLogin}</dd>
                  </div>
                </dl>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">学習統計</h4>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm text-gray-500">今週の学習時間</dt>
                    <dd className="text-sm text-gray-900">{selectedStudent.totalStudyTime}時間</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">週間目標</dt>
                    <dd className="text-sm text-gray-900">{selectedStudent.weeklyGoal}時間</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">連続学習日数</dt>
                    <dd className="text-sm text-gray-900">{selectedStudent.studyStreak}日</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // 課題管理ビュー
  const AssignmentsView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">課題管理</h2>
        <button
          onClick={() => setShowAssignmentModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + 新しい課題を作成
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">課題一覧</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">{assignment.title}</h4>
                  <p className="text-sm text-gray-500">科目: {assignment.subject} | 期限: {assignment.dueDate}</p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
                  {getStatusText(assignment.status)}
                </span>
              </div>
              
              <p className="text-sm text-gray-700 mb-4">{assignment.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  対象生徒: {assignment.assignedTo.map(id => getStudentById(id)?.name).join(', ')}
                </div>
                <div className="text-sm text-gray-500">
                  提出済み: {assignment.submissions.length} / {assignment.assignedTo.length}
                </div>
              </div>
              
              {assignment.submissions.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-900 mb-2">提出状況</h5>
                  <div className="space-y-2">
                    {assignment.submissions.map((submission) => {
                      const student = getStudentById(submission.studentId);
                      return (
                        <div key={submission.studentId} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">{student?.avatar}</span>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{student?.name}</p>
                              <p className="text-xs text-gray-500">提出日時: {submission.submittedAt}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">点数: {submission.score}点</p>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                              {getStatusText(submission.status)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* ヘッダー */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">講師ダッシュボード</h1>
        <p className="text-gray-600 mt-2">生徒の学習状況を管理・分析できます</p>
      </div>

      {/* ナビゲーション */}
      <NavigationTabs />

      {/* メインコンテンツ */}
      {currentView === 'overview' && <OverviewView />}
      {currentView === 'students' && (
        <ErrorBoundary>
          <StudentsView />
        </ErrorBoundary>
      )}
      {currentView === 'assignments' && (
        <ErrorBoundary>
          <AssignmentsView />
        </ErrorBoundary>
      )}
      {currentView === 'analytics' && (
        <ErrorBoundary>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">分析機能</h3>
            <p className="text-gray-600">詳細な分析機能は今後実装予定です。</p>
          </div>
        </ErrorBoundary>
      )}
      {currentView === 'messages' && (
        <ErrorBoundary>
          <InstructorMessages />
        </ErrorBoundary>
      )}
      {currentView === 'user-management' && (
        <ErrorBoundary>
          <ModernAdminUserManagement />
        </ErrorBoundary>
      )}

      {/* 課題作成モーダル */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">新しい課題を作成</h2>
              <button
                onClick={() => setShowAssignmentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              createAssignment();
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  課題タイトル <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="課題のタイトルを入力"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  科目 <span className="text-red-500">*</span>
                </label>
                <select
                  value={newAssignment.subject}
                  onChange={(e) => setNewAssignment({...newAssignment, subject: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">科目を選択</option>
                  <option value="数学">数学</option>
                  <option value="英語">英語</option>
                  <option value="国語">国語</option>
                  <option value="理科">理科</option>
                  <option value="社会">社会</option>
                  <option value="物理">物理</option>
                  <option value="化学">化学</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  説明
                </label>
                <textarea
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({...newAssignment, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="課題の詳細説明を入力"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  期限 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={newAssignment.dueDate}
                  onChange={(e) => setNewAssignment({...newAssignment, dueDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  対象生徒 <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {students.map((student) => (
                    <label key={student.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newAssignment.assignedTo.includes(student.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewAssignment({
                              ...newAssignment,
                              assignedTo: [...newAssignment.assignedTo, student.id]
                            });
                          } else {
                            setNewAssignment({
                              ...newAssignment,
                              assignedTo: newAssignment.assignedTo.filter(id => id !== student.id)
                            });
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{student.name} ({student.grade})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAssignmentModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  課題を作成
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 生徒分析モーダル */}
      {showAnalytics && analyticsStudent && (
        <StudentAnalytics
          student={analyticsStudent}
          onClose={() => {
            setShowAnalytics(false);
            setAnalyticsStudent(null);
          }}
        />
      )}
    </div>
  );
};

export default InstructorDashboard;