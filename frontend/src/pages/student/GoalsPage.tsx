import React, { useState, useEffect } from 'react';
import { Goal, UserKnowledge } from '../../types';

interface AIGoal {
  id: string;
  name: string;
  deadline: string;
  currentStatus: {
    type: string;
    value: string;
  };
  studyHours: {
    weekday: string;
    holiday: string;
  };
  materials: Array<{
    name: string;
    type: string;
    total_amount: number;
    current_progress: number;
  }>;
  createdAt: Date;
  source: 'AI' | 'MANUAL';
}

export function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [aiGoals, setAiGoals] = useState<AIGoal[]>([]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    targetDate: ''
  });

  // AI学習アシスタントからの目標データを読み込み
  useEffect(() => {
    loadAIGoals();
    loadManualGoals();
  }, []);

  const loadAIGoals = () => {
    try {
      const savedKnowledge = localStorage.getItem('userKnowledge');
      if (savedKnowledge) {
        const knowledge: UserKnowledge = JSON.parse(savedKnowledge);
        const aiGoal: AIGoal = {
          id: `ai-goal-${Date.now()}`,
          name: knowledge.user_profile.goal.name,
          deadline: knowledge.user_profile.goal.deadline,
          currentStatus: knowledge.user_profile.current_status,
          studyHours: knowledge.user_profile.preferences.study_hours,
          materials: knowledge.materials,
          createdAt: new Date(),
          source: 'AI'
        };
        setAiGoals([aiGoal]);
      }
    } catch (error) {
      console.error('AI目標の読み込みに失敗しました:', error);
    }
  };

  const loadManualGoals = async () => {
    try {
      // TODO: 実際のAPIエンドポイントから手動作成の目標を取得
      // const response = await fetch('/api/v1/goals');
      // const result = await response.json();
      // setGoals(result.data || []);
      setGoals([]);
    } catch (error) {
      console.error('手動目標の読み込みに失敗しました:', error);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // TODO: 実際のAPIエンドポイントに送信
      const goalData = {
        ...newGoal,
        targetDate: new Date(newGoal.targetDate),
        studentId: 'current-student-id' // 実際の学生IDを使用
      };
      
      console.log('新しい目標を作成:', goalData);
      
      // 一時的にローカル状態に追加
      const tempGoal: Goal = {
        id: `manual-goal-${Date.now()}`,
        studentId: 'current-student-id',
        title: newGoal.title,
        description: newGoal.description,
        targetDate: new Date(newGoal.targetDate),
        createdAt: new Date(),
        updatedAt: new Date(),
        completed: false
      };
      
      setGoals(prev => [...prev, tempGoal]);
      setNewGoal({ title: '', description: '', targetDate: '' });
      setShowAddGoal(false);
    } catch (error) {
      console.error('目標の作成に失敗しました:', error);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const calculateProgress = (materials: AIGoal['materials']) => {
    if (!materials.length) return 0;
    const totalProgress = materials.reduce((sum, material) => {
      return sum + (material.current_progress / material.total_amount) * 100;
    }, 0);
    return Math.round(totalProgress / materials.length);
  };

  const getDaysUntilDeadline = (deadline: string) => {
    try {
      const deadlineDate = new Date(deadline);
      const today = new Date();
      const diffTime = deadlineDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return null;
    }
  };

  const handleGoToAIPlanner = () => {
    window.location.href = '/student/ai-study-planner';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold text-gray-900">目標管理</h1>
          <button
            onClick={handleGoToAIPlanner}
            className="px-3 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
          >
            <span>🤖</span>
            <span>AI学習プランナー</span>
          </button>
        </div>
        <button
          onClick={() => setShowAddGoal(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          + 新しい目標を追加
        </button>
      </div>

      {/* AI学習アシスタントで作成された目標 */}
      {aiGoals.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">🤖</span>
            AI学習アシスタントで作成された目標
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {aiGoals.map((goal) => {
              const progress = calculateProgress(goal.materials);
              const daysLeft = getDaysUntilDeadline(goal.deadline);
              
              return (
                <div key={goal.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{goal.name}</h3>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      AI作成
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">目標期限</p>
                      <p className="font-medium">{formatDate(goal.deadline)}</p>
                      {daysLeft !== null && (
                        <p className={`text-sm ${daysLeft > 30 ? 'text-green-600' : daysLeft > 7 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {daysLeft > 0 ? `あと${daysLeft}日` : daysLeft === 0 ? '今日が期限' : `${Math.abs(daysLeft)}日超過`}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">現在のレベル</p>
                      <p className="font-medium">{goal.currentStatus.type}: {goal.currentStatus.value}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">学習時間設定</p>
                      <p className="text-sm">平日: {goal.studyHours.weekday}</p>
                      <p className="text-sm">休日: {goal.studyHours.holiday}</p>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm text-gray-600">進捗状況</p>
                        <p className="text-sm font-medium">{progress}%</p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {goal.materials.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">学習教材</p>
                        <div className="space-y-1">
                          {goal.materials.map((material, index) => (
                            <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                              <p className="font-medium">{material.name}</p>
                              <p className="text-gray-600">
                                {material.current_progress}/{material.total_amount} {material.type}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 手動で作成された目標 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <span className="mr-2">📝</span>
          手動で作成された目標
        </h2>
        {goals.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {goals.map((goal) => (
              <div key={goal.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{goal.title}</h3>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    手動作成
                  </span>
                </div>
                
                {goal.description && (
                  <p className="text-gray-600 mb-3">{goal.description}</p>
                )}
                
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">目標期限</p>
                    <p className="font-medium">{formatDate(goal.targetDate.toISOString())}</p>
                  </div>
                  
                  <div className="flex items-center">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      goal.completed 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {goal.completed ? '完了' : '進行中'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-600">手動で作成された目標はありません</p>
            <p className="text-sm text-gray-500 mt-2">「新しい目標を追加」ボタンから目標を作成できます</p>
          </div>
        )}
      </div>

      {/* 新しい目標追加モーダル */}
      {showAddGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">新しい目標を追加</h3>
            <form onSubmit={handleAddGoal}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    目標タイトル
                  </label>
                  <input
                    type="text"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="例: TOEIC 900点取得"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    説明（任意）
                  </label>
                  <textarea
                    value={newGoal.description}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="目標の詳細説明を入力してください（任意）"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    目標期限
                  </label>
                  <input
                    type="date"
                    value={newGoal.targetDate}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, targetDate: e.target.value }))}
                    title="目標達成予定日を選択してください"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddGoal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  追加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}