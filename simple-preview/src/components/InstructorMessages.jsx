import React, { useState } from 'react';

const InstructorMessages = () => {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // モック生徒データ
  const students = [
    {
      id: 1,
      name: '田中太郎',
      avatar: '👨‍🎓',
      lastMessage: '数学の問題について質問があります',
      lastMessageTime: '2025-01-09 14:30',
      unreadCount: 2,
      status: 'online'
    },
    {
      id: 2,
      name: '佐藤花子',
      avatar: '👩‍🎓',
      lastMessage: 'ありがとうございました！',
      lastMessageTime: '2025-01-09 12:15',
      unreadCount: 0,
      status: 'offline'
    },
    {
      id: 3,
      name: '山田次郎',
      avatar: '👨‍🎓',
      lastMessage: '明日の課題について確認したいことが...',
      lastMessageTime: '2025-01-08 18:45',
      unreadCount: 1,
      status: 'online'
    }
  ];

  // モックメッセージデータ
  const [messages, setMessages] = useState({
    1: [
      {
        id: 1,
        senderId: 1,
        senderType: 'student',
        content: '先生、こんにちは！二次関数の問題で分からないところがあります。',
        timestamp: '2025-01-09 13:45',
        read: true
      },
      {
        id: 2,
        senderId: 'instructor',
        senderType: 'instructor',
        content: 'こんにちは！どの問題でしょうか？具体的に教えてください。',
        timestamp: '2025-01-09 13:50',
        read: true
      },
      {
        id: 3,
        senderId: 1,
        senderType: 'student',
        content: '教科書の45ページの問題3です。グラフの頂点の求め方が分かりません。',
        timestamp: '2025-01-09 14:30',
        read: false
      },
      {
        id: 4,
        senderId: 1,
        senderType: 'student',
        content: '画像を添付しました。',
        timestamp: '2025-01-09 14:31',
        read: false,
        attachment: {
          type: 'image',
          name: 'math_problem.jpg',
          url: '#'
        }
      }
    ],
    2: [
      {
        id: 5,
        senderId: 2,
        senderType: 'student',
        content: '英語の課題、提出しました！',
        timestamp: '2025-01-09 11:20',
        read: true
      },
      {
        id: 6,
        senderId: 'instructor',
        senderType: 'instructor',
        content: '確認しました。とても良くできていますね！',
        timestamp: '2025-01-09 12:10',
        read: true
      },
      {
        id: 7,
        senderId: 2,
        senderType: 'student',
        content: 'ありがとうございました！',
        timestamp: '2025-01-09 12:15',
        read: true
      }
    ],
    3: [
      {
        id: 8,
        senderId: 3,
        senderType: 'student',
        content: '明日の課題について確認したいことがあります。',
        timestamp: '2025-01-08 18:45',
        read: false
      }
    ]
  });

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedStudent) return;

    const message = {
      id: Date.now(),
      senderId: 'instructor',
      senderType: 'instructor',
      content: newMessage.trim(),
      timestamp: new Date().toLocaleString('ja-JP'),
      read: true
    };

    setMessages(prev => ({
      ...prev,
      [selectedStudent.id]: [...(prev[selectedStudent.id] || []), message]
    }));

    setNewMessage('');
  };

  const markAsRead = (studentId) => {
    setMessages(prev => ({
      ...prev,
      [studentId]: prev[studentId]?.map(msg => ({ ...msg, read: true })) || []
    }));
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    return status === 'online' ? 'bg-green-500' : 'bg-gray-400';
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

  return (
    <div className="flex h-[calc(100vh-200px)] bg-white rounded-lg shadow">
      {/* 生徒リスト */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        {/* 検索バー */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              placeholder="生徒を検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* 生徒リスト */}
        <div className="flex-1 overflow-y-auto">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              onClick={() => {
                setSelectedStudent(student);
                markAsRead(student.id);
              }}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                selectedStudent?.id === student.id ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-xl">{student.avatar}</span>
                  </div>
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(student.status)}`}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">{student.name}</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-xs text-gray-500">{formatTime(student.lastMessageTime)}</p>
                      {student.unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                          {student.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 truncate mt-1">{student.lastMessage}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* メッセージエリア */}
      <div className="flex-1 flex flex-col">
        {selectedStudent ? (
          <>
            {/* ヘッダー */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-lg">{selectedStudent.avatar}</span>
                  </div>
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(selectedStudent.status)}`}></div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{selectedStudent.name}</h3>
                  <p className="text-sm text-gray-500">
                    {selectedStudent.status === 'online' ? 'オンライン' : `最終ログイン: ${formatTime(selectedStudent.lastMessageTime)}`}
                  </p>
                </div>
              </div>
            </div>

            {/* メッセージリスト */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {(messages[selectedStudent.id] || []).map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderType === 'instructor' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.senderType === 'instructor'
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
                      message.senderType === 'instructor' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* メッセージ入力 */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="メッセージを入力..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  送信
                </button>
              </div>
              <div className="flex items-center space-x-4 mt-2">
                <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1">
                  <span>📎</span>
                  <span>ファイル添付</span>
                </button>
                <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1">
                  <span>😊</span>
                  <span>絵文字</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">メッセージを開始</h3>
              <p className="text-gray-500">左側から生徒を選択してメッセージを送信できます</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorMessages;