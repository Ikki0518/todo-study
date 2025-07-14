import React, { useState, useEffect } from 'react';
import openaiService from '../services/openaiService';

export const CompanionMode = ({ userKnowledge, onKnowledgeUpdate, onTasksGenerated }) => {
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [todayTasks, setTodayTasks] = useState([]);

  // ChatGPT-4o latestを使用したAI応答
  const getAIResponse = async (userMessage, conversationHistory) => {
    try {
      // userKnowledgeが存在しない場合はデフォルトを使用
      const safeUserKnowledge = userKnowledge || {
        goal: '学習目標',
        user_profile: { goal: { name: '学習目標' } }
      };
      const systemPrompt = openaiService.getCompanionSystemPrompt(safeUserKnowledge);
      
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: userMessage }
      ];

      const response = await openaiService.createChatCompletion(messages);
      return response;
    } catch (error) {
      console.error('AI応答エラー:', error);
      return "あ、ちょっと調子が悪いみたいです😅 もう一度お話しかけてもらえますか？";
    }
  };

  useEffect(() => {
    // 初回メッセージを表示
    const initializeChat = async () => {
      try {
        const initialResponse = await getAIResponse('今日の学習について挨拶とサポートを開始してください。', []);
        setMessages([{ role: 'assistant', content: initialResponse }]);
        
        // 今日のタスクを生成
        generateTodayTasks();
      } catch (error) {
        // フォールバック
        const goalText = userKnowledge?.goal || userKnowledge?.user_profile?.goal?.name || '学習目標';
        setMessages([{
          role: 'assistant',
          content: `こんにちは！😊 ${goalText}に向けて、今日も一緒に頑張りましょう！✨

左側に今日のおすすめタスクを用意しました。どれから始めますか？

今日の気分や調子はいかがですか？何でも気軽に話しかけてくださいね〜😊`
        }]);
        generateTodayTasks();
      }
    };
    
    initializeChat();
  }, [userKnowledge]);

  const generateTodayTasks = () => {
    // ユーザーの学習計画に基づいてタスクを生成
    const tasks = [];
    
    if (userKnowledge?.goal?.includes('TOEIC')) {
      tasks.push(
        { id: Date.now() + 1, title: 'TOEIC単語 50語復習', estimatedMinutes: 30, completed: false, source: 'ai', status: 'PENDING' },
        { id: Date.now() + 2, title: 'リスニング問題 Part1-2', estimatedMinutes: 45, completed: false, source: 'ai', status: 'PENDING' },
        { id: Date.now() + 3, title: '文法問題集 10問', estimatedMinutes: 25, completed: false, source: 'ai', status: 'PENDING' }
      );
    } else if (userKnowledge?.goal?.includes('大学')) {
      tasks.push(
        { id: Date.now() + 1, title: '数学 - 微分積分の復習', estimatedMinutes: 60, completed: false, source: 'ai', status: 'PENDING' },
        { id: Date.now() + 2, title: '英語 - 長文読解 2題', estimatedMinutes: 40, completed: false, source: 'ai', status: 'PENDING' },
        { id: Date.now() + 3, title: '現代文 - 過去問1題', estimatedMinutes: 50, completed: false, source: 'ai', status: 'PENDING' }
      );
    } else {
      tasks.push(
        { id: Date.now() + 1, title: '基礎問題の復習', estimatedMinutes: 30, completed: false, source: 'ai', status: 'PENDING' },
        { id: Date.now() + 2, title: '新しい単元の学習', estimatedMinutes: 45, completed: false, source: 'ai', status: 'PENDING' },
        { id: Date.now() + 3, title: '練習問題を解く', estimatedMinutes: 35, completed: false, source: 'ai', status: 'PENDING' }
      );
    }
    
    setTodayTasks(tasks);
    
    // デイリープランナーにタスクを送信
    if (onTasksGenerated) {
      onTasksGenerated(tasks);
    }
  };

  const handleSendMessage = async (message) => {
    if (!message.trim()) return;
    
    setIsLoading(true);
    
    // ユーザーメッセージを追加
    const updatedMessages = [...messages, { role: 'user', content: message }];
    setMessages(updatedMessages);

    try {
      // ChatGPT-4o latestから応答を取得
      const aiResponse = await getAIResponse(message, updatedMessages.slice(0, -1));
      
      // AIメッセージを追加
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
      
    } catch (error) {
      console.error('メッセージ送信エラー:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "あ、ちょっと調子が悪いみたいです😅 もう一度お話しかけてもらえますか？" 
      }]);
    }
    
    setIsLoading(false);
    setCurrentMessage('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendMessage(currentMessage);
  };

  const toggleTaskComplete = (taskId) => {
    setTodayTasks(tasks => 
      tasks.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const completedTasks = todayTasks.filter(task => task.completed).length;
  const totalTasks = todayTasks.length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側: 今日のタスク */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              📋 今日のタスク
            </h3>
            
            {/* 進捗バー */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>進捗</span>
                <span>{completedTasks}/{totalTasks}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                  style={{width: `${progressPercentage}%`}}
                ></div>
              </div>
            </div>

            {/* タスクリスト */}
            <div className="space-y-3">
              {todayTasks.map((task) => (
                <div key={task.id} className={`p-3 rounded-lg border ${
                  task.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTaskComplete(task.id)}
                      className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <h4 className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                        {task.title}
                      </h4>
                      <p className="text-sm text-gray-500">
                        ⏱ {task.estimatedMinutes}分
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 励ましメッセージ */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                {progressPercentage === 100 ?
                  "🎉 今日のタスク完了！お疲れさまでした！" :
                  progressPercentage >= 50 ?
                  "💪 いい調子！もう少しで完了ですね！" :
                  "✨ 今日も一歩ずつ頑張りましょう！"
                }
              </p>
            </div>

            {/* デイリープランナーに追加ボタン */}
            <div className="mt-4">
              <button
                onClick={() => {
                  if (onTasksGenerated && todayTasks.length > 0) {
                    onTasksGenerated(todayTasks);
                    alert('タスクをデイリープランナーに追加しました！');
                  }
                }}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors text-sm"
                disabled={todayTasks.length === 0}
              >
                📅 デイリープランナーに追加
              </button>
            </div>
          </div>

          {/* 学習計画情報 */}
          <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3">
              🎯 あなたの学習計画
            </h3>
            <div className="space-y-2 text-sm">
              <div><strong>目標:</strong> {userKnowledge.goal}</div>
              <div><strong>期限:</strong> {userKnowledge.deadline}</div>
              <div><strong>現在のレベル:</strong> {userKnowledge.currentStatus}</div>
              {userKnowledge.studyHours && (
                <div><strong>学習時間:</strong> {userKnowledge.studyHours}</div>
              )}
              
              {/* 追加情報の表示（備考として） */}
              {userKnowledge.additionalInfo && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                    📝 詳細情報を表示
                  </summary>
                  <div className="mt-2 pl-4 border-l-2 border-blue-200 space-y-1 text-xs text-gray-600">
                    {userKnowledge.additionalInfo.weakAreas && (
                      <div><strong>苦手分野:</strong> {userKnowledge.additionalInfo.weakAreas}</div>
                    )}
                    {userKnowledge.additionalInfo.strongAreas && (
                      <div><strong>得意分野:</strong> {userKnowledge.additionalInfo.strongAreas}</div>
                    )}
                    {userKnowledge.additionalInfo.motivation && (
                      <div><strong>学習動機:</strong> {userKnowledge.additionalInfo.motivation}</div>
                    )}
                    {userKnowledge.additionalInfo.availableResources && (
                      <div><strong>利用可能な教材:</strong> {userKnowledge.additionalInfo.availableResources}</div>
                    )}
                    {userKnowledge.additionalInfo.challenges && (
                      <div><strong>課題・悩み:</strong> {userKnowledge.additionalInfo.challenges}</div>
                    )}
                    <div className="text-xs text-gray-400 mt-2">
                      会話履歴: {userKnowledge.additionalInfo.conversationHistory?.length || 0}件
                    </div>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>

        {/* 右側: AIチャット */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <h3 className="text-xl font-bold">🤖 AI学習コンパニオン</h3>
              <p className="text-blue-100">あなたの学習をサポートします</p>
            </div>

            {/* チャット画面 */}
            <div className="h-96 overflow-y-auto p-4 bg-gray-50">
              {messages.map((msg, index) => (
                <div key={index} className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-800 shadow'
                  }`}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="text-left mb-4">
                  <div className="inline-block bg-white text-gray-800 shadow px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span>考え中...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 入力フォーム */}
            <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder="学習について相談してみてください..."
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !currentMessage.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  送信
                </button>
              </div>
            </form>

            {/* クイック質問ボタン */}
            <div className="p-4 bg-gray-50 border-t">
              <p className="text-sm text-gray-600 mb-2">よくある質問:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "今日の調子はどう？",
                  "勉強のコツを教えて",
                  "モチベーションが下がってる",
                  "休憩のタイミングは？"
                ].map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentMessage(question)}
                    className="px-3 py-1 bg-white border border-gray-300 rounded-full text-sm hover:bg-gray-100 transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};