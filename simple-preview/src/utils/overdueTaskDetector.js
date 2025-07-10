/**
 * 未達成タスク検出ユーティリティ
 * 過去のタスクと時間を過ぎたタスクを検出する
 */

/**
 * 現在時刻を取得
 */
export const getCurrentTime = () => {
  return new Date()
}

/**
 * 日付が1日以上経過（昨日以前）かどうかを判定
 * @param {Date} date - 判定する日付
 * @returns {boolean} 1日以上経過した日付かどうか
 */
export const isPastDate = (date) => {
  const today = new Date()
  
  // ローカル時間ベースで日付文字列を作成（時差の問題を回避）
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  
  // 今日より前の日付（昨日以前）を判定
  return dateStr < todayStr
}

/**
 * 日付が1日以上経過（昨日以前）かどうかを判定（より明確な名前）
 * @param {Date} date - 判定する日付
 * @returns {boolean} 1日以上経過した日付かどうか
 */
export const isOneDayOverdue = (date) => {
  return isPastDate(date)
}

/**
 * 日付が今日かどうかを判定
 * @param {Date} date - 判定する日付
 * @returns {boolean} 今日の日付かどうか
 */
export const isToday = (date) => {
  const today = new Date()
  
  // ローカル時間ベースで日付文字列を作成（時差の問題を回避）
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  
  return dateStr === todayStr
}

/**
 * タスクの終了時刻から1時間経過したかどうかを判定（今日のタスクのみ）
 * @param {string} timeSlot - 開始時間スロット（例：'18:00'）
 * @param {Date} taskDate - タスクの日付
 * @param {number} duration - タスクの継続時間（時間単位、デフォルト1）
 * @returns {boolean} タスク終了から1時間経過したかどうか
 */
export const isTimeOverdue = (timeSlot, taskDate, duration = 1) => {
  if (!isToday(taskDate)) {
    return false
  }
  
  const now = new Date()
  const [hour, minute] = timeSlot.split(':').map(Number)
  
  // タスクの終了時刻を計算
  const taskEndTime = new Date()
  taskEndTime.setHours(hour + duration, minute, 0, 0)
  
  // 終了時刻から1時間経過した時刻を計算
  const overdueTime = new Date(taskEndTime)
  overdueTime.setHours(overdueTime.getHours() + 1)
  
  return now > overdueTime
}

/**
 * 学習プランから未達成タスクを検出
 * @param {Object} studyPlans - 学習プラン（日付キーのオブジェクト）
 * @param {Object} completedTasks - 完了済みタスク
 * @returns {Array} 未達成タスクの配列
 */
export const detectOverdueTasks = (studyPlans, completedTasks = {}) => {
  const overdueTasks = []
  const now = getCurrentTime()
  
  Object.keys(studyPlans).forEach(dateKey => {
    const planDate = new Date(dateKey + 'T00:00:00')
    const dayPlans = studyPlans[dateKey] || []
    
    dayPlans.forEach((plan) => {
      const isCompleted = completedTasks[plan.id] || plan.completed
      
      if (isCompleted) return // 完了済みはスキップ
      
      // 過去の日付のタスクのみを未達成タスクプールに入れる
      // 今日の時間を過ぎたタスクは未達成タスクプールには入れない
      if (isPastDate(planDate)) {
        overdueTasks.push({
          ...plan,
          date: dateKey,
          planDate: planDate,
          overdueReason: 'pastDate',
          detectedAt: now.toISOString()
        })
      }
    })
  })
  
  return overdueTasks
}

/**
 * 未達成タスクを重要度でソート
 * @param {Array} overdueTasks - 未達成タスクの配列
 * @returns {Array} ソートされた未達成タスクの配列
 */
export const sortOverdueTasks = (overdueTasks) => {
  return overdueTasks.sort((a, b) => {
    // 1. 過去の日付を優先（より古い日付を優先）
    if (a.overdueReason === 'pastDate' && b.overdueReason === 'pastDate') {
      return new Date(a.date) - new Date(b.date)
    }
    
    // 2. 過去の日付 > 時間オーバー
    if (a.overdueReason === 'pastDate' && b.overdueReason === 'timeOverdue') {
      return -1
    }
    if (a.overdueReason === 'timeOverdue' && b.overdueReason === 'pastDate') {
      return 1
    }
    
    // 3. 優先度でソート
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    const aPriority = priorityOrder[a.priority] || 2
    const bPriority = priorityOrder[b.priority] || 2
    
    return bPriority - aPriority
  })
}

/**
 * 未達成タスクの統計情報を取得
 * @param {Array} overdueTasks - 未達成タスクの配列
 * @returns {Object} 統計情報
 */
export const getOverdueTaskStats = (overdueTasks) => {
  const stats = {
    total: overdueTasks.length,
    pastDate: 0,
    timeOverdue: 0,
    byPriority: {
      high: 0,
      medium: 0,
      low: 0
    }
  }
  
  overdueTasks.forEach(task => {
    if (task.overdueReason === 'pastDate') {
      stats.pastDate++
    } else if (task.overdueReason === 'timeOverdue') {
      stats.timeOverdue++
    }
    
    const priority = task.priority || 'medium'
    stats.byPriority[priority]++
  })
  
  return stats
}

/**
 * 未達成タスクの表示メッセージを生成
 * @param {Object} task - 未達成タスク
 * @returns {string} 表示メッセージ
 */
export const getOverdueMessage = (task) => {
  const planDate = new Date(task.date)
  const dateStr = planDate.toLocaleDateString('ja-JP', { 
    month: 'long', 
    day: 'numeric' 
  })
  
  if (task.overdueReason === 'pastDate') {
    return `${dateStr}の未完了タスク`
  } else if (task.overdueReason === 'timeOverdue') {
    return `${task.timeSlot}を過ぎた未完了タスク`
  }
  
  return '未完了タスク'
}