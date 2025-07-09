// デバッグ用のテストケース
import { generateStudyPlan, convertPlansToTasks } from './src/utils/studyPlanGenerator.js';

// テスト用の参考書データ
const testBook = {
  id: 'test-book-1',
  title: '数学問題集テスト',
  studyType: 'problems',
  totalProblems: 100,
  currentProblem: 0,
  dailyProblems: 10,
  category: 'math',
  startDate: '2025-01-09'
};

console.log('🧪 テストケース実行開始');
console.log('📚 テスト用参考書:', testBook);

// 学習プランを生成
const studyPlans = generateStudyPlan([testBook]);
console.log('📅 生成された学習プラン:', studyPlans);

// 今日の日付のキーを取得
const today = new Date();
const todayKey = today.toISOString().split('T')[0];
console.log('🗓️ 今日の日付キー:', todayKey);

// 今日の学習プランを取得
const todayPlans = studyPlans[todayKey] || [];
console.log('📋 今日の学習プラン:', todayPlans);

// タスクに変換
const todayTasks = convertPlansToTasks(todayPlans);
console.log('✅ 変換されたタスク:', todayTasks);

// 結果の比較
if (todayPlans.length > 0 && todayTasks.length > 0) {
  const plan = todayPlans[0];
  const task = todayTasks[0];
  
  console.log('🔍 比較結果:');
  console.log('  学習プラン:', {
    startProblem: plan.startProblem,
    endProblem: plan.endProblem,
    problems: plan.problems
  });
  console.log('  タスク:', {
    startProblem: task.startProblem,
    endProblem: task.endProblem,
    problems: task.problems,
    title: task.title
  });
  
  // 一致するかチェック
  const isMatching = plan.startProblem === task.startProblem && 
                    plan.endProblem === task.endProblem &&
                    plan.problems === task.problems;
  
  console.log('✅ データの一貫性:', isMatching ? '一致' : '不一致');
  
  if (!isMatching) {
    console.log('❌ 不一致が検出されました！');
  }
} else {
  console.log('⚠️ 今日のプランまたはタスクが見つかりません');
}

console.log('🧪 テストケース実行完了');
