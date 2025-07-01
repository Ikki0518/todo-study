import React, { useState, useEffect } from 'react';
import openaiService from '../services/openaiService';

export const PersonalizeMode = ({ studentId, onComplete }) => {
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [sessionId, setSessionId] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // ChatGPT-4o latestを使用したAI応答
  const getAIResponse = async (userMessage, conversationHistory, currentData) => {
    try {
      const systemPrompt = openaiService.getPersonalizeSystemPrompt();
      
      // 収集済みの情報をシステムプロンプトに追加
      const contextPrompt = `
${systemPrompt}

### 現在収集済みの情報:
${currentData.goal ? `- 目標: ${currentData.goal}` : '- 目標: 未設定'}
${currentData.deadline ? `- 期限: ${currentData.deadline}` : '- 期限: 未設定'}
${currentData.currentStatus ? `- 現在のレベル: ${currentData.currentStatus}` : '- 現在のレベル: 未設定'}
${currentData.studyHours ? `- 学習時間: ${currentData.studyHours}` : '- 学習時間: 未設定'}

### 注意事項:
- すでに収集済みの情報について再度質問しないでください
- 未設定の項目から順番に質問してください
- 期限を聞く際は、必ず具体的な日付（YYYY年MM月DD日）で答えてもらうよう促してください
`;
      
      const messages = [
        { role: 'system', content: contextPrompt },
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
        const initialResponse = await getAIResponse('初回挨拶をお願いします。学習目標について聞いてください。', [], collectedData);
        setMessages([{ role: 'assistant', content: initialResponse }]);
      } catch (error) {
        // フォールバック
        setMessages([{
          role: 'assistant',
          content: "こんにちは！😊 私はあなたの学習目標達成をサポートするパートナーAIです。一緒に夢を叶えるための計画を立てていきましょう！まずは、あなたの大きな目標を教えていただけますか？（例: TOEIC 900点取得、〇〇大学合格など）"
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
      const aiResponse = await getAIResponse(message, updatedMessages.slice(0, -1), collectedData);
      
      // AIメッセージを追加
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
      
      // データを収集（簡単なキーワード検出）
      const newData = { ...collectedData };
      
      // より精密なデータ収集ロジック
      const messageText = message.toLowerCase();
      const conversationContext = messages.length;
      
      // 会話履歴を保存
      newData.additionalInfo.conversationHistory.push({
        timestamp: new Date().toISOString(),
        userMessage: message,
        context: conversationContext
      });
      
      // 基本情報の収集（目標は1回目の会話でのみ抽出）
      if (!newData.goal && conversationContext === 1 && (messageText.includes('toeic') || messageText.includes('大学') || messageText.includes('試験') || messageText.includes('資格') || messageText.includes('検定') || messageText.includes('英検'))) {
        const goalMatch = message.match(/toeic\s*(\d+)/i) || message.match(/(\d+)\s*点/) || message.match(/英検\s*(\d+)\s*級/i);
        if (goalMatch) {
          if (messageText.includes('toeic')) {
            newData.goal = `TOEIC ${goalMatch[1]}点取得`;
          } else if (messageText.includes('英検')) {
            newData.goal = `英検${goalMatch[1]}級合格`;
          } else {
            newData.goal = `${goalMatch[1]}点取得`;
          }
        } else {
          newData.goal = message;
        }
      }
      
      // 期限は2回目以降の会話で抽出（既に設定されていない場合）
      if (!newData.deadline && conversationContext >= 2 && (messageText.includes('年') || messageText.includes('月') || messageText.includes('まで') || messageText.includes('日'))) {
        // 明確な日付形式を抽出（YYYY年MM月DD日、MM月DD日など）
        const fullDateMatch = message.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
        const monthDayMatch = message.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
        const yearMonthMatch = message.match(/(\d{4})\s*年\s*(\d{1,2})\s*月/);
        const monthOnlyMatch = message.match(/(\d{1,2})\s*月/);
        
        if (fullDateMatch) {
          newData.deadline = `${fullDateMatch[1]}年${fullDateMatch[2]}月${fullDateMatch[3]}日`;
        } else if (monthDayMatch) {
          const currentYear = new Date().getFullYear();
          newData.deadline = `${currentYear}年${monthDayMatch[1]}月${monthDayMatch[2]}日`;
        } else if (yearMonthMatch) {
          newData.deadline = `${yearMonthMatch[1]}年${yearMonthMatch[2]}月末`;
        } else if (monthOnlyMatch) {
          const currentYear = new Date().getFullYear();
          newData.deadline = `${currentYear}年${monthOnlyMatch[1]}月末`;
        }
      }

      // 現在のレベルは3回目以降の会話で抽出（既に設定されていない場合）
      if (!newData.currentStatus && conversationContext >= 3 && (messageText.includes('点') || messageText.includes('偏差値') || messageText.includes('レベル') || messageText.includes('初心者') || messageText.includes('中級') || messageText.includes('現在') || messageText.includes('今'))) {
        const currentMatch = message.match(/(\d+)\s*点/) || message.match(/偏差値\s*(\d+)/);
        if (currentMatch) {
          newData.currentStatus = `現在 ${currentMatch[1]}点`;
        } else {
          newData.currentStatus = message;
        }
      }
      
      // 学習時間は4回目以降の会話で抽出（既に設定されていない場合）
      if (!newData.studyHours && conversationContext >= 4 && (messageText.includes('時間') || messageText.includes('分'))) {
        newData.studyHours = message;
      }

      // 追加情報の収集（備考として保存）
      if (messageText.includes('苦手') || messageText.includes('弱い') || messageText.includes('難しい')) {
        newData.additionalInfo.weakAreas += message + '; ';
      }
      if (messageText.includes('得意') || messageText.includes('強い') || messageText.includes('好き')) {
        newData.additionalInfo.strongAreas += message + '; ';
      }
      if (messageText.includes('やる気') || messageText.includes('目的') || messageText.includes('理由')) {
        newData.additionalInfo.motivation += message + '; ';
      }
      if (messageText.includes('経験') || messageText.includes('前に') || messageText.includes('以前')) {
        newData.additionalInfo.previousExperience += message + '; ';
      }
      if (messageText.includes('教材') || messageText.includes('本') || messageText.includes('アプリ')) {
        newData.additionalInfo.availableResources += message + '; ';
      }
      if (messageText.includes('環境') || messageText.includes('場所') || messageText.includes('家') || messageText.includes('図書館')) {
        newData.additionalInfo.studyEnvironment += message + '; ';
      }
      if (messageText.includes('問題') || messageText.includes('困って') || messageText.includes('悩み')) {
        newData.additionalInfo.challenges += message + '; ';
      }

      setCollectedData(newData);
      
      // 基本4項目が揃った場合のみ完了
      const hasBasicInfo = newData.goal && newData.deadline && newData.currentStatus && newData.studyHours;
      
      if (hasBasicInfo) {
        setTimeout(() => {
          setIsCompleted(true);
          if (onComplete) {
            // 4項目が全て揃っている場合のみコンパニオンモードに移行
            // 目標管理ページで使用できる形式に変換
            const goalData = {
              goal: newData.goal,
              deadline: newData.deadline,
              currentStatus: newData.currentStatus,
              studyHours: newData.studyHours,
              additionalInfo: newData.additionalInfo
            };
            onComplete(goalData);
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
              <p className="text-green-600 text-sm mb-4">
                コンパニオンモードで日々の学習をサポートします
              </p>
              
              {/* AI学習コンパニオンボタン */}
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <h4 className="text-white font-bold mb-2">🤖 AI学習コンパニオン</h4>
                <p className="text-blue-100 text-sm mb-3">
                  あなたの学習をサポートします
                </p>
                <button
                  onClick={() => {
                    // 自動的にコンパニオンモードに移行
                    if (onComplete) {
                      const completeData = {
                        goal: collectedData.goal || '学習目標',
                        deadline: collectedData.deadline || '未設定',
                        currentStatus: collectedData.currentStatus || '未設定',
                        studyHours: collectedData.studyHours || '1時間とかかなー',
                        additionalInfo: collectedData.additionalInfo
                      };
                      onComplete(completeData);
                    }
                  }}
                  className="bg-white text-blue-600 px-6 py-2 rounded-md font-semibold hover:bg-blue-50 transition-colors"
                >
                  学習サポートを開始
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};