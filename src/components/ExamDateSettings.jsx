import { useState, useEffect } from 'react'

export const ExamDateSettings = ({ onExamDateChange }) => {
  const [examDate, setExamDate] = useState('')
  const [examTitle, setExamTitle] = useState('')
  const [daysRemaining, setDaysRemaining] = useState(null)
  const [examList, setExamList] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)

  // localStorage から受験日リストを読み込み
  useEffect(() => {
    const savedExams = localStorage.getItem('examDates')
    if (savedExams) {
      try {
        const parsedExams = JSON.parse(savedExams)
        setExamList(parsedExams)
      } catch (error) {
        console.error('受験日データの読み込みに失敗しました:', error)
      }
    }
  }, [])

  // 受験日リストの変更を localStorage に保存
  useEffect(() => {
    localStorage.setItem('examDates', JSON.stringify(examList))
  }, [examList])

  // 日数計算関数
  const calculateDaysRemaining = (targetDate) => {
    const today = new Date()
    const target = new Date(targetDate)
    
    // 時刻を00:00:00に設定して正確な日数を計算
    today.setHours(0, 0, 0, 0)
    target.setHours(0, 0, 0, 0)
    
    const diffTime = target - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  }

  // 受験日追加ハンドラー
  const handleAddExam = () => {
    if (!examTitle.trim() || !examDate) {
      alert('試験名と受験日を入力してください')
      return
    }

    const newExam = {
      id: Date.now(),
      title: examTitle,
      date: examDate,
      createdAt: new Date().toISOString()
    }

    setExamList(prevList => [...prevList, newExam])
    setExamTitle('')
    setExamDate('')
    setShowAddForm(false)
    
    // 親コンポーネントに通知
    if (onExamDateChange) {
      onExamDateChange(newExam)
    }
  }

  // 受験日削除ハンドラー
  const handleDeleteExam = (examId) => {
    if (confirm('この受験日を削除しますか？')) {
      setExamList(prevList => prevList.filter(exam => exam.id !== examId))
    }
  }

  // 受験日の状態を取得
  const getExamStatus = (examDate) => {
    const days = calculateDaysRemaining(examDate)
    
    if (days < 0) {
      return { status: 'past', text: `${Math.abs(days)}日経過`, color: 'text-gray-500' }
    } else if (days === 0) {
      return { status: 'today', text: '今日', color: 'text-red-600 font-bold' }
    } else if (days <= 7) {
      return { status: 'urgent', text: `あと${days}日`, color: 'text-red-600 font-bold' }
    } else if (days <= 30) {
      return { status: 'soon', text: `あと${days}日`, color: 'text-orange-600 font-semibold' }
    } else {
      return { status: 'future', text: `あと${days}日`, color: 'text-blue-600' }
    }
  }

  // 最も近い受験日を取得
  const getNextExam = () => {
    const futureExams = examList.filter(exam => {
      const days = calculateDaysRemaining(exam.date)
      return days >= 0
    })
    
    if (futureExams.length === 0) return null
    
    return futureExams.reduce((nearest, current) => {
      const nearestDays = calculateDaysRemaining(nearest.date)
      const currentDays = calculateDaysRemaining(current.date)
      return currentDays < nearestDays ? current : nearest
    })
  }

  const nextExam = getNextExam()

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">受験日設定</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          {showAddForm ? 'キャンセル' : '+ 受験日追加'}
        </button>
      </div>

      {/* 最も近い受験日の表示 */}
      {nextExam && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">次の受験日</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold text-gray-900">{nextExam.title}</p>
              <p className="text-sm text-gray-600">{nextExam.date}</p>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold ${getExamStatus(nextExam.date).color}`}>
                {getExamStatus(nextExam.date).text}
              </p>
              <p className="text-sm text-gray-500">残り日数</p>
            </div>
          </div>
        </div>
      )}

      {/* 受験日追加フォーム */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">新しい受験日を追加</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                試験名
              </label>
              <input
                type="text"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                placeholder="例：大学入試、TOEIC、英検など"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                受験日
              </label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleAddExam}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              追加
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* 受験日リスト */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">登録済み受験日</h3>
        {examList.length === 0 ? (
          <p className="text-gray-500 text-center py-8">まだ受験日が登録されていません</p>
        ) : (
          <div className="space-y-3">
            {examList
              .sort((a, b) => new Date(a.date) - new Date(b.date))
              .map((exam) => {
                const examStatus = getExamStatus(exam.date)
                return (
                  <div
                    key={exam.id}
                    className={`p-4 rounded-lg border-2 ${
                      examStatus.status === 'past' ? 'bg-gray-50 border-gray-200' :
                      examStatus.status === 'today' ? 'bg-red-50 border-red-200' :
                      examStatus.status === 'urgent' ? 'bg-red-50 border-red-300' :
                      examStatus.status === 'soon' ? 'bg-orange-50 border-orange-200' :
                      'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">{exam.title}</h4>
                        <p className="text-sm text-gray-600">{exam.date}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-bold ${examStatus.color}`}>
                          {examStatus.text}
                        </span>
                        <button
                          onClick={() => handleDeleteExam(exam.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>
    </div>
  )
}