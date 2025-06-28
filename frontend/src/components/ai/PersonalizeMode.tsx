import React, { useState, useEffect } from 'react';
import {
  AIPersonalizeRequest,
  AIResponse,
  UserKnowledge
} from '../../types';

interface PersonalizeModeProps {
  studentId: string;
  onComplete: (knowledge: UserKnowledge) => void;
}

export const PersonalizeMode: React.FC<PersonalizeModeProps> = ({ 
  studentId, 
  onComplete 
}) => {
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    // 初回メッセージを取得
    handleSendMessage('', true);
  }, []);

  const handleSendMessage = async (message: string, isInitial: boolean = false) => {
    if (!message.trim() && !isInitial) return;
    
    setIsLoading(true);
    
    try {
      if (!isInitial) {
        setMessages(prev => [...prev, { role: 'user', content: message }]);
      }

      const request: AIPersonalizeRequest = {
        studentId,
        message: message || '',
        sessionId
      };

      const response = await fetch('/api/v1/ai/personalize', {
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
      
      if (aiResponse.sessionId) {
        setSessionId(aiResponse.sessionId);
      }

      if (aiResponse.isCompleted && aiResponse.knowledge) {
        setIsCompleted(true);
        onComplete(aiResponse.knowledge);
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

  const handleSubmit = (e: React.FormEvent) => {
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
          あなた専用の学習計画を作成するために、いくつか質問させていただきます。
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-6 h-96 overflow-y-auto">
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
              <div className="whitespace-pre-wrap">{msg.content}</div>
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

      {!isCompleted && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            placeholder="メッセージを入力してください..."
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
      )}

      {isCompleted && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-500 mr-2">✅</div>
            <div className="text-green-800 font-medium">
              学習計画の設計図が完成しました！これから伴走モードで日々のサポートを開始できます。
            </div>
          </div>
        </div>
      )}
    </div>
  );
};