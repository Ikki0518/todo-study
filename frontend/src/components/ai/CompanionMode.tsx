import React, { useState, useEffect } from 'react';
import {
  AICompanionRequest,
  AIResponse,
  UserKnowledge
} from '../../types';

interface CompanionModeProps {
  studentId: string;
  knowledge: UserKnowledge;
  onKnowledgeUpdate: (knowledge: UserKnowledge) => void;
}

interface DailyTask {
  material: string;
  range: string;
  type: string;
  completed?: boolean;
}

export const CompanionMode: React.FC<CompanionModeProps> = ({ 
  studentId, 
  knowledge, 
  onKnowledgeUpdate 
}) => {
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [showTaskCompletion, setShowTaskCompletion] = useState(false);

  useEffect(() => {
    // 初回メッセージを取得
    handleSendMessage('今日もよろしくお願いします！', true);
  }, []);

  const handleSendMessage = async (message: string, isInitial: boolean = false) => {
    if (!message.trim() && !isInitial) return;
    
    setIsLoading(true);
    
    try {
      if (!isInitial) {
        setMessages(prev => [...prev, { role: 'user', content: message }]);
      }

      const request: AICompanionRequest = {
        studentId,
        message: message || '',
        knowledge
      };

      const response = await fetch('/api/v1/ai/companion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const result = await response.json();
      const aiResponse: AIResponse = result.data;

      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse.message }]);
      
      if (aiResponse.dailyTasks) {
        setDailyTasks(aiResponse.dailyTasks.map(task => ({ ...task, completed: false })));
      }

      setCurrentMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '申し訳ございません。エラーが発生しました。もう一度お試しください。' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskComplete = async (taskIndex: number) => {
    const task = dailyTasks[taskIndex];
    if (!task) return;

    try {
      // タスクを完了としてマーク
      const updatedTasks = [...dailyTasks];
      updatedTasks[taskIndex].completed = true;
      setDailyTasks(updatedTasks);

      // 進捗を更新
      const material = knowledge.materials.find(m => m.name === task.material);
      if (material) {
        // 範囲から完了量を計算（簡単な実装）
        const rangeMatch = task.range.match(/(\d+).*?〜.*?(\d+)/);
        if (rangeMatch) {
          const endPoint = parseInt(rangeMatch[2]);
          
          const response = await fetch('/api/v1/ai/progress', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              studentId,
              materialName: task.material,
              completedAmount: endPoint,
              knowledge
            }),
          });

          if (response.ok) {
            const result = await response.json();
            onKnowledgeUpdate(result.data.knowledge);
            
            // 完了メッセージを表示
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              content: result.data.message 
            }]);
          }
        }
      }
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(currentMessage);
  };

  const completedTasksCount = dailyTasks.filter(task => task.completed).length;
  const progressPercentage = dailyTasks.length > 0 ? (completedTasksCount / dailyTasks.length) * 100 : 0;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左側: チャット */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              🤝 伴走モード
            </h2>
            <p className="text-gray-600">
              今日も一緒に頑張りましょう！
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 h-80 overflow-y-auto">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-4 ${
                  msg.role === 'user' ? 'text-right' : 'text-left'
                }`}
              >
                <div
                  className={`inline-block max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-800 border'
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="text-left mb-4">
                <div className="inline-block bg-white text-gray-800 border px-4 py-2 rounded-lg">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                    考え中...
                  </div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder="質問や報告をどうぞ..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !currentMessage.trim()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              送信
            </button>
          </form>
        </div>

        {/* 右側: 今日のタスク */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              📋 今日のタスク
            </h3>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {completedTasksCount} / {dailyTasks.length} 完了 ({Math.round(progressPercentage)}%)
            </p>
          </div>

          <div className="space-y-3">
            {dailyTasks.map((task, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 transition-all ${
                  task.completed
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className={`font-medium ${
                      task.completed ? 'text-green-800 line-through' : 'text-gray-800'
                    }`}>
                      {task.material}
                    </h4>
                    <p className={`text-sm ${
                      task.completed ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {task.range}
                    </p>
                  </div>
                  <button
                    onClick={() => handleTaskComplete(index)}
                    disabled={task.completed}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      task.completed
                        ? 'bg-green-500 text-white cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {task.completed ? '✅ 完了' : '完了'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {dailyTasks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>今日のタスクを取得中...</p>
            </div>
          )}
        </div>
      </div>

      {/* 学習統計 */}
      <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">📊 学習統計</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {knowledge.session_data?.streak_days || 0}
            </div>
            <div className="text-sm text-blue-800">連続学習日数</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {knowledge.materials.reduce((sum, m) => sum + m.current_progress, 0)}
            </div>
            <div className="text-sm text-green-800">総学習量</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(
                knowledge.materials.reduce((sum, m) => 
                  sum + (m.current_progress / m.total_amount * 100), 0
                ) / knowledge.materials.length
              )}%
            </div>
            <div className="text-sm text-purple-800">平均進捗率</div>
          </div>
        </div>
      </div>
    </div>
  );
};