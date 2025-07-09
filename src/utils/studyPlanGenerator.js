// 学習計画を生成するユーティリティ関数

/**
 * 参考書の学習計画を生成する
 * @param {Array} studyBooks - 参考書の配列
 * @returns {Object} 日付をキーとした学習計画オブジェクト
 */
export function generateStudyPlan(studyBooks) {
  console.log('📊 学習プラン生成開始:', studyBooks)
  const studyPlan = {}
  
  studyBooks.forEach(book => {
    const isProblems = book.studyType === 'problems'
    const dailyTarget = isProblems ? book.dailyProblems : book.dailyPages
    const currentProgress = isProblems ? (book.currentProblem || 0) : (book.currentPage || 0)
    const totalUnits = isProblems ? book.totalProblems : book.totalPages
    
    // デバッグログ：参考書の詳細情報
    console.log(`📖 参考書詳細 - ${book.title}:`, {
      studyType: book.studyType,
      isProblems,
      dailyTarget,
      currentProgress,
      totalUnits,
      remainingUnits: totalUnits - currentProgress,
      rawData: {
        dailyPages: book.dailyPages,
        dailyProblems: book.dailyProblems,
        currentPage: book.currentPage,
        currentProblem: book.currentProblem,
        totalPages: book.totalPages,
        totalProblems: book.totalProblems
      }
    })
    
    if (!dailyTarget || dailyTarget <= 0) {
      console.log(`⚠️ スキップ: dailyTarget が無効 (${dailyTarget})`)
      return
    }
    
    const remainingUnits = totalUnits - currentProgress
    
    if (remainingUnits <= 0) {
      console.log(`⚠️ スキップ: 残り単位が0以下 (${remainingUnits})`)
      return
    }
    
    // 除外する曜日を取得（デフォルトは土曜日のみ）
    const excludeDays = book.excludeDays || [6] // 0=日曜日, 1=月曜日, ..., 6=土曜日
    
    // 学習開始日を設定（各参考書の開始日を使用、未設定の場合は今日）
    let currentDate
    if (book.startDate) {
      // 日付文字列を正確にパース（YYYY-MM-DD形式）
      // UTC時間で作成して時差問題を回避
      const [year, month, day] = book.startDate.split('-').map(Number)
      currentDate = new Date(Date.UTC(year, month - 1, day)) // UTC時間で作成
      
      console.log(`📅 開始日設定: ${book.startDate} → ${currentDate.toISOString().split('T')[0]} (曜日: ${currentDate.getDay()})`)
    } else {
      // 今日の日付を正確に設定（UTC時間で統一）
      const now = new Date()
      currentDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
      
      console.log(`📅 開始日設定（今日）: ${currentDate.toISOString().split('T')[0]} (曜日: ${currentDate.getDay()})`)
    }
    let unitsLeft = remainingUnits
    let unitStart = currentProgress + 1
    
    // デバッグログを追加：開始位置の確認
    console.log(`📚 学習プラン生成 - ${book.title}: currentProgress=${currentProgress}, unitStart=${unitStart}, totalUnits=${totalUnits}, remainingUnits=${remainingUnits}`)
    
    // 指定された開始日から正確に開始（除外日処理は学習日のスキップのみ）
    const originalStartDate = new Date(currentDate)
    console.log(`📅 学習開始日: ${originalStartDate.toISOString().split('T')[0]} (曜日: ${originalStartDate.getDay()})`)
    
    // 除外日の場合でも開始日は変更しない
    // 除外日は単純にスキップするだけ
    
    while (unitsLeft > 0) {
      const dayOfWeek = currentDate.getDay()
      const dateKey = currentDate.toISOString().split('T')[0]
      
      // 除外する曜日でない場合のみ学習計画を追加
      if (!excludeDays.includes(dayOfWeek)) {
        // その日に学習する単位数を決定
        const unitsToStudy = Math.min(dailyTarget, unitsLeft)
        const unitEnd = unitStart + unitsToStudy - 1
        
        console.log(`📅 学習日 ${dateKey}: ${unitStart}-${unitEnd} (${unitsToStudy}単位, 残り${unitsLeft}単位)`)
        
        // 学習計画を追加
        if (!studyPlan[dateKey]) {
          studyPlan[dateKey] = []
        }
        
        const planData = {
          id: `${book.id}-${dateKey}`,
          bookId: book.id,
          bookTitle: book.title,
          category: book.category,
          priority: getPriorityByCategory(book.category),
          studyType: book.studyType
        }
        
        // ページベースか問題ベースかで分岐
        if (isProblems) {
          planData.startProblem = unitStart
          planData.endProblem = unitEnd
          planData.problems = unitsToStudy
          
          // デバッグログ：問題範囲の確認
          console.log(`🧮 問題ベース学習プラン生成 [${dateKey}]:`, {
            bookTitle: book.title,
            unitStart,
            unitEnd,
            unitsToStudy,
            unitsLeft,
            currentProgress,
            startProblem: unitStart,
            endProblem: unitEnd
          })
        } else {
          planData.startPage = unitStart
          planData.endPage = unitEnd
          planData.pages = unitsToStudy
          
          // デバッグログ：ページ範囲の確認
          console.log(`📚 ページベース学習プラン生成 [${dateKey}]:`, {
            bookTitle: book.title,
            unitStart,
            unitEnd,
            unitsToStudy,
            unitsLeft,
            currentProgress,
            startPage: unitStart,
            endPage: unitEnd
          })
        }
        
        studyPlan[dateKey].push(planData)
        
        // 単位数を更新
        unitsLeft -= unitsToStudy
        unitStart = unitEnd + 1
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
  console.log('🔄 convertPlansToTasks 開始 - 入力データ:', dayPlans)
  
  return dayPlans.map((plan, index) => {
    const isProblems = plan.studyType === 'problems'
    
    console.log(`📋 タスク変換 [${index}]:`, {
      bookTitle: plan.bookTitle,
      studyType: plan.studyType,
      startProblem: plan.startProblem,
      endProblem: plan.endProblem,
      startPage: plan.startPage,
      endPage: plan.endPage,
      problems: plan.problems,
      pages: plan.pages
    })
    
    // タイトルと説明を学習タイプに応じて生成
    let title, description
    if (isProblems) {
      title = `${plan.bookTitle} (${plan.startProblem}-${plan.endProblem}問)`
      description = `${plan.bookTitle}の${plan.startProblem}問から${plan.endProblem}問までを学習${plan.type === 'book-goal' ? ' (目標)' : ''}`
    } else {
      title = `${plan.bookTitle} (${plan.startPage}-${plan.endPage}ページ)`
      description = `${plan.bookTitle}の${plan.startPage}ページから${plan.endPage}ページまでを学習${plan.type === 'book-goal' ? ' (目標)' : ''}`
    }
    
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
      type: plan.type, // 参考書目標かどうかの識別
      studyType: plan.studyType,
      createdAt: new Date().toISOString()
    }
    
    // 学習タイプに応じて追加フィールドを設定
    if (isProblems) {
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
      totalProblems: 0,
      studyType: book.studyType,
      completionDate: null
    }
  })
  
  // 日ごとの計画を集計
  allDates.forEach(dateKey => {
    const dayPlans = studyPlan[dateKey]
    dayPlans.forEach(plan => {
      // 推定学習時間を計算（仮に1ページ=5分、1問=3分と仮定）
      const estimatedMinutes = plan.studyType === 'problems'
        ? (plan.problems || 0) * 3
        : (plan.pages || 0) * 5
      
      stats.totalHours += estimatedMinutes
      
      if (stats.bookStats[plan.bookId]) {
        stats.bookStats[plan.bookId].totalMinutes += estimatedMinutes
        
        // 学習タイプに応じて統計を更新
        if (plan.studyType === 'problems') {
          stats.bookStats[plan.bookId].totalProblems += (plan.endProblem - plan.startProblem + 1)
        } else {
          stats.bookStats[plan.bookId].totalPages += (plan.endPage - plan.startPage + 1)
        }
        
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