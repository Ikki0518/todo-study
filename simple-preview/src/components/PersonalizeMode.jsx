import React, { useState, useEffect } from 'react';
import openaiService from '../services/openaiService';

export const PersonalizeMode = ({ studentId, onComplete }) => {
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [sessionId, setSessionId] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // ChatGPT-4o latestを使用したAI応答
  const getAIResponse = async (userMessage, conversationHistory) => {
    try {
      const systemPrompt = openaiService.getPersonalizeSystemPrompt();
      
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: userMessage }
      ];

      const response = await openaiService.createChatCompletion(messages);
      return response;
    } catch (error) {
      console.error('AI応答エラー:', error);
      return "ごめんなさい！ちょっと調子が悪いみたいです😅 もう一度お話しかけてもらえますか？";
    }
  };

  const [collectedData, setCollectedData] = useState({
    goal: '',
    deadline: '',
    currentStatus: '',
    studyHours: '',
    // 追加の詳細情報（備考として保存）
    additionalInfo: {
      materials: [],
      studyDays: '',
      weakSubjects: [],
      studyMethods: '',
      weakAreas: '',
      strongAreas: '',
      motivation: '',
      previousExperience: '',
      availableResources: '',
      studyEnvironment: '',
      challenges: '',
      preferences: '',
      otherGoals: '',
      conversationHistory: []
    }
  });

  useEffect(() => {
    // 初回メッセージを表示
    const initializeChat = async () => {
      try {
        const initialResponse = await getAIResponse('初回挨拶をお願いします。学習目標について聞いてください。', []);
        setMessages([{ role: 'assistant', content: initialResponse }]);
      } catch (error) {
        // フォールバック
        setMessages([{ 
          role: 'assistant', 
          content: "こんにちは！😊 学習のお手伝いをさせてもらいます！まずは、どんな目標に向かって頑張ってるか教えてもらえる？大学受験とか、資格取得とか、なんでも大丈夫だよ〜✨" 
        }]);
      }
    };
    
    initializeChat();
  }, []);

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
      
      // データを収集（簡単なキーワード検出）
      const newData = { ...collectedData };
      
      // より精密なデータ収集ロジック
      const messageText = message.toLowerCase();
      const conversationContext = messages.length;
      
      // 会話の文脈に基づいてデータを分類
      if (conversationContext <= 2) {
        // 最初の1-2回の応答は目標と期限
        if (!newData.goal && (messageText.includes('toeic') || messageText.includes('大学') || messageText.includes('試験') || messageText.includes('資格') || messageText.includes('検定'))) {
          // 目標から数値を抽出
          const goalMatch = message.match(/toeic\s*(\d+)/i) || message.match(/(\d+)\s*点/);
          if (goalMatch) {
            newData.goal = `TOEIC ${goalMatch[1]}点取得`;
          } else {
            newData.goal = message;
          }
        }
        
        // 期限の抽出（年月日を含む表現）
        if (!newData.deadline && (messageText.includes('年') || messageText.includes('月') || messageText.includes('まで') || messageText.includes('日'))) {
          const dateMatch = message.match(/(\d{4})\s*年\s*(\d{1,2})\s*月/) || message.match(/(\d{1,2})\s*月/);
          if (dateMatch) {
            newData.deadline = message;
          }
        }
      } else if (conversationContext <= 4) {
        // 3-4回目の応答は現在のレベル
        if (!newData.currentStatus && (messageText.includes('点') || messageText.includes('偏差値') || messageText.includes('レベル') || messageText.includes('初心者') || messageText.includes('中級') || messageText.includes('現在') || messageText.includes('今'))) {
          // 現在のスコアを抽出
          const currentMatch = message.match(/(\d+)\s*点/) || message.match(/偏差値\s*(\d+)/);
          if (currentMatch) {
            newData.currentStatus = `現在 ${currentMatch[1]}点`;
          } else {
            newData.currentStatus = message;
          }
        }
      } else {
        // 5回目以降は学習時間や頻度
        if (!newData.studyHours && (messageText.includes('時間') || messageText.includes('分'))) {
          newData.studyHours = message;
        }
        
        if (!newData.studyDays && (messageText.includes('日') || messageText.includes('週') || messageText.includes('毎日'))) {
          newData.studyDays = message;
        }
      }

      setCollectedData(newData);
      
      // 十分な情報が集まったら完了
      if (newData.goal && newData.deadline && newData.currentStatus && newData.studyHours) {
        setTimeout(() => {
          setIsCompleted(true);
          if (onComplete) {
            onComplete(newData);
          }
        }, 2000);
      }
      
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

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          🎯 パーソナライズモード
        </h2>
        <p className="text-gray-600">
          AIとの会話を通じて、あなた専用の学習計画を作成します
        </p>
      </div>

      {/* 進捗表示 */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">収集済み情報</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className={`p-2 rounded ${collectedData.goal ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
            目標: {collectedData.goal || '未設定'}
          </div>
          <div className={`p-2 rounded ${collectedData.deadline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
            期限: {collectedData.deadline || '未設定'}
          </div>
          <div className={`p-2 rounded ${collectedData.currentStatus ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
            現在のレベル: {collectedData.currentStatus || '未設定'}
          </div>
          <div className={`p-2 rounded ${collectedData.studyHours ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
            学習時間: {collectedData.studyHours || '未設定'}
          </div>
        </div>
      </div>

      {/* チャット画面 */}
      <div className="border rounded-lg overflow-hidden">
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
        {!isCompleted && (
          <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
            <div className="flex space-x-2">
              <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder="メッセージを入力..."
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
        )}

        {/* 完了メッセージ */}
        {isCompleted && (
          <div className="p-4 border-t bg-green-50">
            <div className="text-center">
              <div className="text-green-800 font-semibold mb-2">
                🎉 学習計画の作成が完了しました！
              </div>
              <p className="text-green-600 text-sm">
                コンパニオンモードで日々の学習をサポートします
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};