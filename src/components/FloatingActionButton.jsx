import { useState } from 'react';
import StudentMessages from './StudentMessages';
import { CompanionMode } from './CompanionMode';

const FloatingActionButton = ({ currentUser }) => {
  console.log('FloatingActionButton rendered, currentUser:', currentUser);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState(null); // 'ai' or 'instructor'

  const handleSelectMode = (mode) => {
    setSelectedMode(mode);
    setIsOpen(false);
  };

  const handleClose = () => {
    setSelectedMode(null);
  };

  return (
    <>
      {/* メインの浮動ボタン */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative">
          {/* グラデーションの美しいメインボタン */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`
              w-16 h-16 bg-gradient-to-br from-cyan-400 via-cyan-500 to-blue-500
              text-white rounded-full shadow-xl hover:shadow-2xl
              transform transition-all duration-300 ease-out
              flex items-center justify-center
              hover:scale-110 active:scale-95
              ${isOpen ? 'rotate-45' : 'rotate-0'}
              relative overflow-hidden
              group
            `}
          >
            {/* 背景のキラキラエフェクト */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* アイコン */}
            <div className={`relative z-10 transform transition-all duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'}`}>
              {isOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              )}
            </div>
          </button>
          
          {/* にゅるっと出てくるポップアップメニュー */}
          <div className={`
            absolute bottom-full right-0 mb-4
            transform transition-all duration-500 ease-out
            ${isOpen
              ? 'translate-y-0 scale-100 opacity-100'
              : 'translate-y-4 scale-75 opacity-0 pointer-events-none'
            }
          `}>
            <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-3 min-w-[280px]">
              {/* 可愛い三角形の矢印 */}
              <div className="absolute top-full right-6 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-white/95"></div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handleSelectMode('ai')}
                  className="flex-1 px-4 py-3 text-center rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 transition-all duration-300 transform hover:scale-105 group"
                >
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">AIに質問</span>
                </button>
                
                <button
                  onClick={() => handleSelectMode('instructor')}
                  className="flex-1 px-4 py-3 text-center rounded-xl bg-gradient-to-r from-orange-50 to-pink-50 hover:from-orange-100 hover:to-pink-100 transition-all duration-300 transform hover:scale-105 group"
                >
                  <span className="text-sm font-medium text-gray-700 group-hover:text-orange-600 transition-colors">講師に質問</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 選択されたモードのフルスクリーン表示 */}
      {selectedMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {selectedMode === 'ai' ? (
              // AIチャット画面
              <div className="h-[80vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">🤖 AI学習アシスタント</h3>
                  <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <CompanionMode userKnowledge={{goal: '学習目標', deadline: '未設定', currentStatus: '未設定'}} />
                </div>
              </div>
            ) : (
              // 講師への質問画面
              <div className="h-[80vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">👨‍🏫 講師への質問</h3>
                  <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <StudentMessages currentUser={currentUser} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingActionButton;