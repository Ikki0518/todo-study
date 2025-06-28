import React, { useState, useEffect } from 'react';
import { PersonalizeMode } from '../../components/ai/PersonalizeMode';
import { CompanionMode } from '../../components/ai/CompanionMode';
import { UserKnowledge } from '../../types';
import { useAuthStore } from '../../stores/authStore';

export const AIStudyPlannerPage: React.FC = () => {
  const { user } = useAuthStore();
  const [currentMode, setCurrentMode] = useState<'select' | 'personalize' | 'companion'>('select');
  const [userKnowledge, setUserKnowledge] = useState<UserKnowledge | null>(null);

  // ローカルストレージからナレッジを読み込み
  useEffect(() => {
    const savedKnowledge = localStorage.getItem(`ai_knowledge_${user?.id}`);
    if (savedKnowledge) {
      try {
        const knowledge = JSON.parse(savedKnowledge);
        setUserKnowledge(knowledge);
        setCurrentMode('companion');
      } catch (error) {
        console.error('Failed to parse saved knowledge:', error);
      }
    }
  }, [user?.id]);

  const handlePersonalizationComplete = (knowledge: UserKnowledge) => {
    setUserKnowledge(knowledge);
    // ローカルストレージに保存
    localStorage.setItem(`ai_knowledge_${user?.id}`, JSON.stringify(knowledge));
    setCurrentMode('companion');
  };

  const handleKnowledgeUpdate = (updatedKnowledge: UserKnowledge) => {
    setUserKnowledge(updatedKnowledge);
    // ローカルストレージを更新
    localStorage.setItem(`ai_knowledge_${user?.id}`, JSON.stringify(updatedKnowledge));
  };

  const handleResetKnowledge = () => {
    if (confirm('学習計画をリセットしますか？これまでのデータは削除されます。')) {
      localStorage.removeItem(`ai_knowledge_${user?.id}`);
      setUserKnowledge(null);
      setCurrentMode('select');
    }
  };

  const handleModeSelect = (mode: 'personalize' | 'companion') => {
    if (mode === 'companion' && !userKnowledge) {
      alert('まずはパーソナライズモードで学習計画を作成してください。');
      return;
    }
    setCurrentMode(mode);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            ログインが必要です
          </h2>
          <p className="text-gray-600">
            AI学習プランナーを使用するにはログインしてください。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🤖 AI学習プランナー
              </h1>
              <p className="text-gray-600 mt-1">
                あなた専用の学習パートナー
              </p>
            </div>
            
            {userKnowledge && (
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  目標: {userKnowledge.user_profile.goal.name}
                </div>
                <button
                  onClick={handleResetKnowledge}
                  className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  リセット
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="py-8">
        {currentMode === 'select' && (
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                モードを選択してください
              </h2>
              <p className="text-gray-600">
                初回の方はパーソナライズモードから始めてください
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* パーソナライズモード */}
              <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="text-center">
                  <div className="text-4xl mb-4">🎯</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    パーソナライズモード
                  </h3>
                  <p className="text-gray-600 mb-6">
                    あなたの目標や現状をヒアリングして、専用の学習計画を作成します。
                  </p>
                  <ul className="text-sm text-gray-600 text-left mb-6 space-y-1">
                    <li>• 学習目標の設定</li>
                    <li>• 現在の学力把握</li>
                    <li>• 使用教材の登録</li>
                    <li>• 学習時間の設定</li>
                    <li>• 苦手分野の特定</li>
                  </ul>
                  <button
                    onClick={() => handleModeSelect('personalize')}
                    className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
                  >
                    パーソナライズを開始
                  </button>
                </div>
              </div>

              {/* 伴走モード */}
              <div className={`bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow ${
                !userKnowledge ? 'opacity-50' : ''
              }`}>
                <div className="text-center">
                  <div className="text-4xl mb-4">🤝</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    伴走モード
                  </h3>
                  <p className="text-gray-600 mb-6">
                    作成された学習計画に基づいて、日々の学習をサポートします。
                  </p>
                  <ul className="text-sm text-gray-600 text-left mb-6 space-y-1">
                    <li>• 今日のタスク提示</li>
                    <li>• 進捗管理</li>
                    <li>• モチベーション維持</li>
                    <li>• 学習相談</li>
                    <li>• 統計表示</li>
                  </ul>
                  <button
                    onClick={() => handleModeSelect('companion')}
                    disabled={!userKnowledge}
                    className="w-full px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {userKnowledge ? '伴走を開始' : '計画作成が必要'}
                  </button>
                </div>
              </div>
            </div>

            {userKnowledge && (
              <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  📊 現在の学習計画
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-blue-800 font-medium">目標</div>
                    <div className="text-blue-600 font-bold">
                      {userKnowledge.user_profile.goal.name}
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-green-800 font-medium">期限</div>
                    <div className="text-green-600 font-bold">
                      {userKnowledge.user_profile.goal.deadline}
                    </div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-sm text-purple-800 font-medium">教材数</div>
                    <div className="text-purple-600 font-bold">
                      {userKnowledge.materials.length}冊
                    </div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="text-sm text-orange-800 font-medium">連続日数</div>
                    <div className="text-orange-600 font-bold">
                      {userKnowledge.session_data?.streak_days || 0}日
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {currentMode === 'personalize' && (
          <PersonalizeMode
            studentId={user.id}
            onComplete={handlePersonalizationComplete}
          />
        )}

        {currentMode === 'companion' && userKnowledge && (
          <CompanionMode
            studentId={user.id}
            knowledge={userKnowledge}
            onKnowledgeUpdate={handleKnowledgeUpdate}
          />
        )}
      </div>

      {/* フッター */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-600">
            <p className="text-sm">
              AI学習プランナー - あなたの学習目標達成をサポートします
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};