import React, { useState } from 'react';

const StudentAnalytics = ({ student, onClose }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('week'); // week, month, quarter

  // モック分析データ
  const analyticsData = {
    week: {
      studyTime: [
        { day: '月', hours: 2.5, target: 3 },
        { day: '火', hours: 3.2, target: 3 },
        { day: '水', hours: 1.8, target: 3 },
        { day: '木', hours: 4.1, target: 3 },
        { day: '金', hours: 2.9, target: 3 },
        { day: '土', hours: 5.2, target: 4 },
        { day: '日', hours: 3.8, target: 4 }
      ],
      subjects: [
        { name: '数学', time: 8.5, progress: 85, color: 'bg-blue-500' },
        { name: '英語', time: 6.2, progress: 72, color: 'bg-green-500' },
        { name: '物理', time: 4.8, progress: 68, color: 'bg-purple-500' }
      ],
      performance: {
        averageScore: 82,
        completionRate: 89,
        streakDays: 12,
        totalTasks: 45,
        completedTasks: 40
      }
    }
  };

  const currentData = analyticsData[selectedPeriod];

  const getPerformanceColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressBarColor = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-2xl">{student.avatar}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{student.name} の学習分析</h2>
              <p className="text-gray-600">{student.grade} | {student.subjects.join(', ')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* 期間選択 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex space-x-4">
            {[
              { id: 'week', name: '今週' },
              { id: 'month', name: '今月' },
              { id: 'quarter', name: '四半期' }
            ].map((period) => (
              <button
                key={period.id}
                onClick={() => setSelectedPeriod(period.id)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  selectedPeriod === period.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {period.name}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* 概要統計 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">平均点数</p>
                  <p className="text-3xl font-bold">{currentData.performance.averageScore}</p>
                </div>
                <div className="text-4xl opacity-80">📊</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">完了率</p>
                  <p className="text-3xl font-bold">{currentData.performance.completionRate}%</p>
                </div>
                <div className="text-4xl opacity-80">✅</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">連続学習</p>
                  <p className="text-3xl font-bold">{currentData.performance.streakDays}日</p>
                </div>
                <div className="text-4xl opacity-80">🔥</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">総タスク</p>
                  <p className="text-3xl font-bold">{currentData.performance.completedTasks}/{currentData.performance.totalTasks}</p>
                </div>
                <div className="text-4xl opacity-80">📋</div>
              </div>
            </div>
          </div>

          {/* チャートエリア */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* 学習時間チャート */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">日別学習時間</h3>
              <div className="space-y-4">
                {currentData.studyTime.map((day, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-8 text-sm font-medium text-gray-600">{day.day}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">実績: {day.hours}h</span>
                        <span className="text-sm text-gray-500">目標: {day.target}h</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${
                            day.hours >= day.target ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min((day.hours / day.target) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 科目別進捗 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">科目別進捗</h3>
              <div className="space-y-6">
                {currentData.subjects.map((subject, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded ${subject.color}`}></div>
                        <span className="font-medium text-gray-900">{subject.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">{subject.progress}%</div>
                        <div className="text-xs text-gray-500">{subject.time}h</div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getProgressBarColor(subject.progress)}`}
                        style={{ width: `${subject.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 詳細分析 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 強み・弱み分析 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">強み・弱み分析</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-green-600 mb-2">💪 強み</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 数学の問題解決能力が高い</li>
                    <li>• 継続的な学習習慣が身についている</li>
                    <li>• 難しい問題にも粘り強く取り組む</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-red-600 mb-2">⚠️ 改善点</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 英語の語彙力強化が必要</li>
                    <li>• 物理の基礎概念の理解を深める</li>
                    <li>• 時間管理スキルの向上</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 学習パターン */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">学習パターン</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">最も集中できる時間帯</h4>
                  <p className="text-sm text-gray-600">午後2時〜4時</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">平均学習セッション</h4>
                  <p className="text-sm text-gray-600">45分</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">好む学習方法</h4>
                  <p className="text-sm text-gray-600">問題演習中心</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">休憩パターン</h4>
                  <p className="text-sm text-gray-600">15分間隔</p>
                </div>
              </div>
            </div>

            {/* 推奨アクション */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">推奨アクション</h3>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800">📚 学習計画</h4>
                  <p className="text-xs text-blue-600 mt-1">英語の語彙学習を毎日30分追加</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <h4 className="text-sm font-medium text-green-800">🎯 目標設定</h4>
                  <p className="text-xs text-green-600 mt-1">物理の基礎問題集を1週間で完了</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <h4 className="text-sm font-medium text-yellow-800">⏰ スケジュール</h4>
                  <p className="text-xs text-yellow-600 mt-1">集中時間帯を活用した重要科目の配置</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <h4 className="text-sm font-medium text-purple-800">💬 フィードバック</h4>
                  <p className="text-xs text-purple-600 mt-1">週次面談で進捗確認とモチベーション維持</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAnalytics;