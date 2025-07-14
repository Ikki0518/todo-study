import React, { useState, useEffect } from 'react';

const StudentMessages = ({ currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [instructor, setInstructor] = useState(null);

  // モック講師データ（実際の実装では API から取得）
  useEffect(() => {
    // 受講生に割り当てられた講師を取得
    setInstructor({
      id: 'instructor_1',
      name: '山田先生',
      avatar: '👨‍🏫',
      status: 'online',
      subject: '数学・英語'
    });

    // モックメッセージデータ（実際の実装では API から取得）
    setMessages([
      {
        id: 1,
        senderId: 'instructor_1',
        senderType: 'instructor',
        content: 'こんにちは！何か質問がございましたら、いつでもお聞きください。',
        timestamp: '2025-01-09 09:00',
        read: true
      },
      {
        id: 2,
        senderId: currentUser?.id || 'student_1',
        senderType: 'student',
        content: 'よろしくお願いします！',
        timestamp: '2025-01-09 09:05',
        read: true
      }
    ]);
  }, [currentUser]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsLoading(true);
    
    const message = {
      id: Date.now(),
      senderId: currentUser?.id || 'student_1',
      senderType: 'student',
      content: newMessage.trim(),
      timestamp: new Date().toLocaleString('ja-JP'),
      read: true
    };

    // メッセージを追加
    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // TODO: 実際の API 呼び出しをここに追加
    try {
      // await apiService.sendMessage({
      //   recipientId: instructor.id,
      //   content: message.content,
      //   type: 'text'
      // });
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
    }
  };

  const getStatusColor = (status) => {
    return status === 'online' ? 'bg-green-500' : 'bg-gray-400';
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      {/* ヘッダー */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {instructor && (
              <>
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-xl">{instructor.avatar}</span>
                  </div>
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(instructor.status)}`}></div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{instructor.name}</h3>
                  <p className="text-sm text-gray-500">
                    {instructor.subject} • {instructor.status === 'online' ? 'オンライン' : 'オフライン'}
                  </p>
                </div>
              </>
            )}
          </div>
          <div className="text-sm text-gray-500">
            💬 質問・相談チャット
          </div>
        </div>
      </div>

      {/* クイック質問ボタン */}
      <div className="p-4 border-b border-gray-100 bg-blue-50">
        <div className="text-sm text-gray-700 mb-2">よくある質問:</div>
        <div className="flex flex-wrap gap-2">
          {[
            '課題について教えてください',
            '解き方が分からない問題があります',
            '次回の授業について',
            'テスト対策について相談したいです'
          ].map((quickMsg, index) => (
            <button
              key={index}
              onClick={() => setNewMessage(quickMsg)}
              className="px-3 py-1 text-xs bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
            >
              {quickMsg}
            </button>
          ))}
        </div>
      </div>

      {/* メッセージリスト */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">質問を始めましょう</h3>
            <p className="text-gray-500">わからないことがあれば、いつでも先生に質問してください</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderType === 'student' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.senderType === 'student'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-900'
              }`}>
                <p className="text-sm">{message.content}</p>
                {message.attachment && (
                  <div className="mt-2 p-2 bg-white bg-opacity-20 rounded">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">📎</span>
                      <span className="text-xs">{message.attachment.name}</span>
                    </div>
                  </div>
                )}
                <p className={`text-xs mt-1 ${
                  message.senderType === 'student' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-end">
            <div className="max-w-xs lg:max-w-md px-4 py-2 bg-blue-600 text-white rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* メッセージ入力 */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="質問や相談を入力してください..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '送信中...' : '送信'}
          </button>
        </div>

        {/* 操作ボタン */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center space-x-4">
            <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1 transition-colors">
              <span>📎</span>
              <span>ファイル添付</span>
            </button>
            <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1 transition-colors">
              <span>📷</span>
              <span>写真</span>
            </button>
            <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1 transition-colors">
              <span>😊</span>
              <span>絵文字</span>
            </button>
          </div>
          
          <div className="text-xs text-gray-400">
            💡 質問はいつでも大歓迎です
          </div>
        </div>

        {/* 使い方のヒント */}
        {messages.length <= 2 && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <span className="text-yellow-600">💡</span>
              <div className="text-sm text-yellow-800">
                <p className="font-medium">質問のコツ:</p>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  <li>どの教科・単元の質問かを明記する</li>
                  <li>問題の写真を撮って添付する</li>
                  <li>どこまで理解できているかを説明する</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentMessages;