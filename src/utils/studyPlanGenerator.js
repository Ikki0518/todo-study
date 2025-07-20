// 学習計画を生成するユーティリティ関数

/**
 * 参考書の学習計画を生成する
 * @param {Array} studyBooks - 参考書の配列
 * @returns {Object} 日付をキーとした学習計画オブジェクト
 */
export function generateStudyPlan(studyBooks) {
  const studyPlan = {}
  
  studyBooks.forEach(book => {
    // 問題集タイプと通常のページタイプの両方に対応
    const isProblemsType = book.studyType === 'problems'
    const dailyTarget = isProblemsType ? book.dailyProblems : book.dailyPages
    const currentProgress = isProblemsType ? (book.currentProblem || 0) : (book.currentPage || 0)
    const totalTarget = isProblemsType ? book.totalProblems : book.totalPages
    
    if (!dailyTarget || dailyTarget <= 0) return
    
    const remainingTarget = totalTarget - currentProgress
    
    if (remainingTarget <= 0) return
    
    // 除外する曜日を取得（デフォルトは土曜日のみ）
    const excludeDays = book.excludeDays || [6] // 0=日曜日, 1=月曜日, ..., 6=土曜日
    
    // 学習開始日を設定（各参考書の開始日を使用、未設定の場合は今日）
    let currentDate
    if (book.startDate) {
      // 日付文字列を正確にパース（YYYY-MM-DD形式）
      const [year, month, day] = book.startDate.split('-').map(Number)
      currentDate = new Date(year, month - 1, day) // 月は0ベース
      currentDate.setHours(0, 0, 0, 0)
    } else {
      // 今日の日付を正確に設定（時刻を00:00:00にリセット）
      currentDate = new Date()
      currentDate.setHours(0, 0, 0, 0)
    }
    let targetLeft = remainingTarget
    let targetStart = currentProgress + 1
    
    // 開始日が除外日の場合、最初の学習可能日まで進める
    while (excludeDays.includes(currentDate.getDay())) {
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    while (targetLeft > 0) {
      const dayOfWeek = currentDate.getDay()
      // ローカルタイムゾーンベースで日付キーを生成
      const year = currentDate.getFullYear()
      const month = String(currentDate.getMonth() + 1).padStart(2, '0')
      const day = String(currentDate.getDate()).padStart(2, '0')
      const dateKey = `${year}-${month}-${day}`
      
      // 除外する曜日でない場合のみ学習計画を追加
      if (!excludeDays.includes(dayOfWeek)) {
        // その日に学習する量を決定
        const targetToStudy = Math.min(dailyTarget, targetLeft)
        const targetEnd = targetStart + targetToStudy - 1
        
        // 学習計画を追加
        if (!studyPlan[dateKey]) {
          studyPlan[dateKey] = []
        }
        
        const planItem = {
          id: `${book.id}-${dateKey}`,
          bookId: book.id,
          bookTitle: book.title,
          category: book.category,
          priority: getPriorityByCategory(book.category),
          studyType: book.studyType || 'pages'
        }
        
        // 問題集タイプか通常のページタイプかで表示を分ける
        if (isProblemsType) {
          planItem.startProblem = targetStart
          planItem.endProblem = targetEnd
          planItem.problems = targetToStudy
        } else {
          planItem.startPage = targetStart
          planItem.endPage = targetEnd
          planItem.pages = targetToStudy
        }
        
        studyPlan[dateKey].push(planItem)
        
        // 残り量を更新
        targetLeft -= targetToStudy
        targetStart = targetEnd + 1
      }
      
      // 次の日に進む
      currentDate.setDate(currentDate.getDate() + 1)
    }
  })
  
  return studyPlan
}

/**
 * ページ数とカテゴリに基づいて予想学習時間を計算
 * @param {number} pages - ページ数
 * @param {string} category - カテゴリ
 * @returns {number} 予想時間（分）
 */
function calculateEstimatedTime(pages, category) {
  // カテゴリごとの1ページあたりの平均学習時間（分）
  const timePerPage = {
    programming: 8,    // プログラミング
    math: 10,         // 数学
    english: 6,       // 英語
    science: 7,       // 理科
    certification: 5, // 資格試験
    other: 6          // その他
  }
  
  const baseTime = timePerPage[category] || timePerPage.other
  return Math.round(pages * baseTime)
}

/**
 * カテゴリに基づいて優先度を決定
 * @param {string} category - カテゴリ
 * @returns {string} 優先度
 */
function getPriorityByCategory(category) {
  const priorities = {
    certification: 'high',  // 資格試験は高優先度
    programming: 'high',    // プログラミングも高優先度
    math: 'medium',         // 数学は中優先度
    english: 'medium',      // 英語は中優先度
    science: 'medium',      // 理科は中優先度
    other: 'low'           // その他は低優先度
  }
  
  return priorities[category] || 'medium'
}

/**
 * 特定の日の学習計画をタスクプール用のタスクに変換
 * @param {Array} dayPlans - その日の学習計画配列
 * @returns {Array} タスク配列
 */
export function convertPlansToTasks(dayPlans) {
  return dayPlans.map(plan => {
    const isProblemsType = plan.studyType === 'problems'
    
    // タイトルと説明を問題集タイプに応じて生成
    const title = isProblemsType
      ? `${plan.bookTitle} (${plan.startProblem}-${plan.endProblem}問)`
      : `${plan.bookTitle} (${plan.startPage}-${plan.endPage}ページ)`
    
    const description = isProblemsType
      ? `${plan.bookTitle}の${plan.startProblem}問から${plan.endProblem}問までを学習${plan.type === 'book-goal' ? ' (目標)' : ''}`
      : `${plan.bookTitle}の${plan.startPage}ページから${plan.endPage}ページまでを学習${plan.type === 'book-goal' ? ' (目標)' : ''}`
    
    const baseTask = {
      id: `task-${plan.id}`,
      title,
      description,
      priority: plan.priority || 'medium',
      completed: false,
      source: 'calendar',
      bookId: plan.bookId,
      bookTitle: plan.bookTitle,
      category: plan.category || 'study',
      studyType: plan.studyType || 'pages',
      type: plan.type, // 参考書目標かどうかの識別
      createdAt: new Date().toISOString()
    }
    
    // 問題集タイプか通常のページタイプかで追加フィールドを設定
    if (isProblemsType) {
      baseTask.startProblem = plan.startProblem
      baseTask.endProblem = plan.endProblem
      baseTask.problems = plan.problems
    } else {
      baseTask.startPage = plan.startPage
      baseTask.endPage = plan.endPage
      baseTask.pages = plan.pages
    }
    
    return baseTask
  })
}

/**
 * 学習計画の統計情報を計算
 * @param {Object} studyPlan - 学習計画オブジェクト
 * @param {Array} studyBooks - 参考書配列
 * @returns {Object} 統計情報
 */
export function calculateStudyPlanStats(studyPlan, studyBooks) {
  const stats = {
    totalDays: 0,
    totalHours: 0,
    bookStats: {},
    dailyAverageMinutes: 0
  }
  
  const allDates = Object.keys(studyPlan)
  stats.totalDays = allDates.length
  
  // 各参考書の統計を初期化
  studyBooks.forEach(book => {
    stats.bookStats[book.id] = {
      title: book.title,
      totalMinutes: 0,
      totalPages: 0,
      completionDate: null
    }
  })
  
  // 日ごとの計画を集計
  allDates.forEach(dateKey => {
    const dayPlans = studyPlan[dateKey]
    dayPlans.forEach(plan => {
      stats.totalHours += plan.estimatedMinutes
      
      if (stats.bookStats[plan.bookId]) {
        stats.bookStats[plan.bookId].totalMinutes += plan.estimatedMinutes
        stats.bookStats[plan.bookId].totalPages += (plan.endPage - plan.startPage + 1)
        
        // 完了日を更新
        if (!stats.bookStats[plan.bookId].completionDate || dateKey > stats.bookStats[plan.bookId].completionDate) {
          stats.bookStats[plan.bookId].completionDate = dateKey
        }
      }
    })
  })
  
  stats.totalHours = Math.round(stats.totalHours / 60 * 10) / 10 // 時間に変換、小数点1桁
  stats.dailyAverageMinutes = stats.totalDays > 0 ? Math.round((stats.totalHours * 60) / stats.totalDays) : 0
  
  return stats
}

/**
 * 学習計画を日付範囲でフィルタリング
 * @param {Object} studyPlan - 学習計画オブジェクト
 * @param {Date} startDate - 開始日
 * @param {Date} endDate - 終了日
 * @returns {Object} フィルタリングされた学習計画
 */
export function filterStudyPlanByDateRange(studyPlan, startDate, endDate) {
  const filtered = {}
  const start = startDate.toISOString().split('T')[0]
  const end = endDate.toISOString().split('T')[0]
  
  Object.keys(studyPlan).forEach(dateKey => {
    if (dateKey >= start && dateKey <= end) {
      filtered[dateKey] = studyPlan[dateKey]
    }
  })
  
  return filtered
}

/**
 * 学習計画をエクスポート用のデータに変換
 * @param {Object} studyPlan - 学習計画オブジェクト
 * @param {Array} studyBooks - 参考書配列
 * @returns {Object} エクスポート用データ
 */
export function exportStudyPlan(studyPlan, studyBooks) {
  return {
    generatedAt: new Date().toISOString(),
    studyBooks: studyBooks,
    studyPlan: studyPlan,
    stats: calculateStudyPlanStats(studyPlan, studyBooks)
  }
}