import React, { useState } from 'react'

export function StudyBookManager({ 
  studyBooks = [], 
  onBooksUpdate,
  onGenerateStudyPlan 
}) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingBook, setEditingBook] = useState(null)

  const handleAddBook = (bookData) => {
    const newBook = {
      id: Date.now().toString(),
      ...bookData,
      createdAt: new Date().toISOString()
    }
    onBooksUpdate([...studyBooks, newBook])
    setShowAddForm(false)
  }

  const handleEditBook = (bookData) => {
    const updatedBooks = studyBooks.map(book => 
      book.id === editingBook.id ? { ...book, ...bookData } : book
    )
    onBooksUpdate(updatedBooks)
    setEditingBook(null)
  }

  const handleDeleteBook = (bookId) => {
    if (confirm('この参考書を削除しますか？関連する学習計画も削除されます。')) {
      const updatedBooks = studyBooks.filter(book => book.id !== bookId)
      onBooksUpdate(updatedBooks)
    }
  }

  const calculateCompletionDate = (book) => {
    if (book.studyType === 'problems') {
      if (!book.dailyProblems || book.dailyProblems <= 0) return '未設定'
      
      const remainingProblems = book.totalProblems - (book.currentProblem || 0)
      const daysNeeded = Math.ceil(remainingProblems / book.dailyProblems)
      const completionDate = new Date()
      completionDate.setDate(completionDate.getDate() + daysNeeded)
      
      return completionDate.toLocaleDateString('ja-JP')
    } else {
      if (!book.dailyPages || book.dailyPages <= 0) return '未設定'
      
      const remainingPages = book.totalPages - (book.currentPage || 0)
      const daysNeeded = Math.ceil(remainingPages / book.dailyPages)
      const completionDate = new Date()
      completionDate.setDate(completionDate.getDate() + daysNeeded)
      
      return completionDate.toLocaleDateString('ja-JP')
    }
  }

  const calculateProgress = (book) => {
    if (book.studyType === 'problems') {
      if (!book.totalProblems || book.totalProblems <= 0) return 0
      return Math.round(((book.currentProblem || 0) / book.totalProblems) * 100)
    } else {
      if (!book.totalPages || book.totalPages <= 0) return 0
      return Math.round(((book.currentPage || 0) / book.totalPages) * 100)
    }
  }

  const getProgressText = (book) => {
    if (book.studyType === 'problems') {
      return `${book.currentProblem || 0} / ${book.totalProblems || 0} 問`
    } else {
      return `${book.currentPage || 0} / ${book.totalPages || 0} ページ`
    }
  }

  const getDailyTargetText = (book) => {
    if (book.studyType === 'problems') {
      return `1日 ${book.dailyProblems || 0} 問`
    } else {
      return `1日 ${book.dailyPages || 0} ページ`
    }
  }

  const BookForm = ({ book, onSubmit, onCancel }) => {
    const [selectedDays, setSelectedDays] = useState(() => {
      if (book?.excludeDays) {
        // excludeDaysから学習する曜日を計算
        const allDays = [0, 1, 2, 3, 4, 5, 6]
        return allDays.filter(day => !book.excludeDays.includes(day))
      }
      // デフォルトは平日（月〜金）
      return [1, 2, 3, 4, 5]
    })

    const [studyType, setStudyType] = useState(book?.studyType || 'pages')

    const dayNames = ['日', '月', '火', '水', '木', '金', '土']
    
    const handleDayToggle = (dayIndex) => {
      setSelectedDays(prev => {
        if (prev.includes(dayIndex)) {
          return prev.filter(day => day !== dayIndex)
        } else {
          return [...prev, dayIndex].sort()
        }
      })
    }

    const handleSubmit = (e) => {
      e.preventDefault()
      const formData = new FormData(e.target)
      
      // 選択されていない曜日をexcludeDaysとして設定
      const allDays = [0, 1, 2, 3, 4, 5, 6]
      const excludeDays = allDays.filter(day => !selectedDays.includes(day))
      
      const bookData = {
        title: formData.get('title'),
        studyType: studyType,
        // ページベースのデータ
        totalPages: parseInt(formData.get('totalPages')),
        currentPage: parseInt(formData.get('currentPage') || 0),
        dailyPages: parseInt(formData.get('dailyPages')),
        // 問題ベースのデータ
        totalProblems: parseInt(formData.get('totalProblems')),
        currentProblem: parseInt(formData.get('currentProblem') || 0),
        dailyProblems: parseInt(formData.get('dailyProblems')),
        category: formData.get('category'),
        description: formData.get('description') || '',
        startDate: formData.get('startDate') || new Date().toISOString().split('T')[0],
        excludeDays: excludeDays
      }
      onSubmit(bookData)
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">
            {book ? '参考書を編集' : '参考書を追加'}
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">参考書名</label>
                <input
                  name="title"
                  type="text"
                  defaultValue={book?.title}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  placeholder="例：基本情報技術者試験 午前問題集"
                  autoFocus={!book}
                />
              </div>
              
              {/* 学習タイプ選択 */}
              <div>
                <label className="block text-sm font-medium mb-2">学習管理タイプ</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      setStudyType('pages')
                    }}
                    className={`p-3 text-sm rounded-md border transition-colors ${
                      studyType === 'pages'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    📖 ページベース
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      setStudyType('problems')
                    }}
                    className={`p-3 text-sm rounded-md border transition-colors ${
                      studyType === 'problems'
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    🔢 問題ベース
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {studyType === 'pages' ? 'ページ数で進捗を管理します' : '問題数で進捗を管理します'}
                </p>
              </div>

              {/* ページベースのフィールド */}
              {studyType === 'pages' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">総ページ数</label>
                    <input
                      name="totalPages"
                      type="number"
                      defaultValue={book?.totalPages}
                      className="w-full p-2 border rounded-md"
                      required
                      min="1"
                      placeholder="例：300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">現在のページ</label>
                    <input
                      name="currentPage"
                      type="number"
                      defaultValue={book?.currentPage || 0}
                      className="w-full p-2 border rounded-md"
                      min="0"
                      placeholder="例：50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">1日の目標ページ数</label>
                    <input
                      name="dailyPages"
                      type="number"
                      defaultValue={book?.dailyPages}
                      className="w-full p-2 border rounded-md"
                      required
                      min="1"
                      placeholder="例：5"
                    />
                  </div>
                </>
              )}

              {/* 問題ベースのフィールド */}
              {studyType === 'problems' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">総問題数</label>
                    <input
                      name="totalProblems"
                      type="number"
                      defaultValue={book?.totalProblems}
                      className="w-full p-2 border rounded-md"
                      required
                      min="1"
                      placeholder="例：200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">現在の問題</label>
                    <input
                      name="currentProblem"
                      type="number"
                      defaultValue={book?.currentProblem || 0}
                      className="w-full p-2 border rounded-md"
                      min="0"
                      placeholder="例：30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">1日の目標問題数</label>
                    <input
                      name="dailyProblems"
                      type="number"
                      defaultValue={book?.dailyProblems}
                      className="w-full p-2 border rounded-md"
                      required
                      min="1"
                      placeholder="例：10"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">開始日</label>
                <input
                  name="startDate"
                  type="date"
                  defaultValue={book?.startDate || new Date().toISOString().split('T')[0]}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">学習する曜日</label>
                <div className="grid grid-cols-7 gap-2">
                  {dayNames.map((dayName, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleDayToggle(index)}
                      className={`p-2 text-sm rounded-md border transition-colors ${
                        selectedDays.includes(index)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {dayName}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  学習したい曜日をクリックして選択してください（複数選択可）
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">カテゴリ</label>
                <select
                  name="category"
                  defaultValue={book?.category || 'other'}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="programming">プログラミング</option>
                  <option value="math">数学</option>
                  <option value="english">英語</option>
                  <option value="science">理科</option>
                  <option value="certification">資格試験</option>
                  <option value="other">その他</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">説明（任意）</label>
                <textarea
                  name="description"
                  defaultValue={book?.description}
                  className="w-full p-2 border rounded-md"
                  rows="3"
                  placeholder="参考書についての詳細"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {book ? '更新' : '追加'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  const getCategoryColor = (category) => {
    const colors = {
      programming: 'bg-blue-100 text-blue-800',
      math: 'bg-purple-100 text-purple-800',
      english: 'bg-green-100 text-green-800',
      science: 'bg-yellow-100 text-yellow-800',
      certification: 'bg-red-100 text-red-800',
      other: 'bg-gray-100 text-gray-800'
    }
    return colors[category] || colors.other
  }

  const getCategoryName = (category) => {
    const names = {
      programming: 'プログラミング',
      math: '数学',
      english: '英語',
      science: '理科',
      certification: '資格試験',
      other: 'その他'
    }
    return names[category] || 'その他'
  }

  const getStudyDaysText = (excludeDays) => {
    if (!excludeDays || excludeDays.length === 0) {
      return '毎日'
    }
    
    const dayNames = ['日', '月', '火', '水', '木', '金', '土']
    const allDays = [0, 1, 2, 3, 4, 5, 6]
    const studyDays = allDays.filter(day => !excludeDays.includes(day))
    
    if (studyDays.length === 0) {
      return '設定なし'
    }
    
    return studyDays.map(day => dayNames[day]).join('・')
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">参考書管理</h2>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:space-x-2">
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-3 py-2 sm:px-4 lg:px-6 lg:py-3 rounded-md hover:bg-blue-700 text-sm sm:text-base"
          >
            ＋ 参考書を追加
          </button>
          {studyBooks.length > 0 && (
            <button
              onClick={onGenerateStudyPlan}
              className="bg-green-600 text-white px-3 py-2 sm:px-4 lg:px-6 lg:py-3 rounded-md hover:bg-green-700 text-sm sm:text-base"
            >
              📅 学習計画を生成
            </button>
          )}
        </div>
      </div>

      {/* 参考書一覧 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {studyBooks.map((book) => {
          const progress = calculateProgress(book)
          const completionDate = calculateCompletionDate(book)
          const progressText = getProgressText(book)
          const dailyTargetText = getDailyTargetText(book)
          
          return (
            <div key={book.id} className="bg-white rounded-lg shadow p-3 sm:p-4 lg:p-6 border">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-base sm:text-lg lg:text-xl truncate">{book.title}</h3>
                    <span className={`text-xs px-1 py-0.5 rounded ${
                      book.studyType === 'problems'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {book.studyType === 'problems' ? '🔢' : '📖'}
                    </span>
                  </div>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs lg:text-sm ${getCategoryColor(book.category)}`}>
                    {getCategoryName(book.category)}
                  </span>
                </div>
                <div className="flex space-x-1 ml-2 flex-shrink-0">
                  <button
                    onClick={() => setEditingBook(book)}
                    className="text-gray-600 hover:text-gray-800 p-1 text-sm sm:text-base lg:text-lg"
                    title="編集"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteBook(book.id)}
                    className="text-red-600 hover:text-red-800 p-1 text-sm sm:text-base lg:text-lg"
                    title="削除"
                  >
                    🗑
                  </button>
                </div>
              </div>

              {book.description && (
                <p className="text-xs sm:text-sm lg:text-base text-gray-600 mb-3 line-clamp-2">{book.description}</p>
              )}

              <div className="space-y-2 lg:space-y-3">
                <div className="flex justify-between text-xs sm:text-sm lg:text-base">
                  <span>進捗</span>
                  <span className="text-right">{progressText} ({progress}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 lg:h-3">
                  <div
                    className={`h-2 lg:h-3 rounded-full transition-all ${
                      book.studyType === 'problems' ? 'bg-green-600' : 'bg-blue-600'
                    }`}
                    style={{width: `${progress}%`}}
                  ></div>
                </div>
                
                <div className="text-xs sm:text-sm lg:text-base text-gray-600 space-y-1">
                  <div>1日の目標: {dailyTargetText}</div>
                  <div>学習曜日: {getStudyDaysText(book.excludeDays)}</div>
                  <div>完了予定: {completionDate}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {studyBooks.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">📚</div>
          <p>参考書がまだ登録されていません</p>
          <p className="text-sm">「参考書を追加」ボタンから登録してください</p>
        </div>
      )}

      {/* フォームモーダル */}
      {showAddForm && (
        <BookForm
          onSubmit={handleAddBook}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {editingBook && (
        <BookForm
          book={editingBook}
          onSubmit={handleEditBook}
          onCancel={() => setEditingBook(null)}
        />
      )}
    </div>
  )
}