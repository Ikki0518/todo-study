// 現在の日付に対応した問題ベースの学習テスト
import { generateStudyPlan, convertPlansToTasks } from './src/utils/studyPlanGenerator.js';

// 現在の日付を取得
const today = new Date();
const todayStr = today.toISOString().split('T')[0];

// 問題ベースの参考書（今日開始）
const problemBasedBook = {
  id: 'math-problems-today',
  title: '数学問題集テスト',
  studyType: 'problems',
  totalProblems: 100,
  currentProblem: 0,
  dailyProblems: 10,
  category: 'math',
  startDate: todayStr  // 今日の日付に設定
};

console.log('🧪 現在の日付での問題ベーステスト');
console.log(`📅 今日の日付: ${todayStr}`);
console.log('=' .repeat(50));

// 1. 学習プランを生成
const studyPlans = generateStudyPlan([problemBasedBook]);
console.log('\n1. 学習プランの生成結果:');
console.log(`今日の学習プラン:`, studyPlans[todayStr]);

// 2. 今日の学習プランを取得
const todayPlans = studyPlans[todayStr] || [];
console.log('\n2. 月間カレンダー用データ:');
console.log('Raw Plans:', todayPlans);

// 3. タスクに変換
const todayTasks = convertPlansToTasks(todayPlans);
console.log('\n3. タスクプール用データ:');
console.log('Converted Tasks:', todayTasks);

// 4. 比較
if (todayPlans.length > 0 && todayTasks.length > 0) {
  const plan = todayPlans[0];
  const task = todayTasks[0];
  
  console.log('\n4. 表示内容の比較:');
  console.log(`📅 月間カレンダー: ${plan.startProblem}-${plan.endProblem}問`);
  console.log(`📋 タスクプール: ${task.startProblem}-${task.endProblem}問`);
  
  const isMatching = plan.startProblem === task.startProblem && 
                    plan.endProblem === task.endProblem;
  
  console.log(`🔍 一致性: ${isMatching ? '✅ 一致' : '❌ 不一致'}`);
  
  if (!isMatching) {
    console.log('❌ 不一致の詳細:');
    console.log(`  学習プラン: ${plan.startProblem}-${plan.endProblem}問`);
    console.log(`  タスク: ${task.startProblem}-${task.endProblem}問`);
  }
} else {
  console.log('\n⚠️ 今日の学習プランまたはタスクが存在しません');
}

// 5. 明日のテスト
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowStr = tomorrow.toISOString().split('T')[0];

console.log(`\n5. 明日（${tomorrowStr}）のテスト:`);
const tomorrowPlans = studyPlans[tomorrowStr] || [];
const tomorrowTasks = convertPlansToTasks(tomorrowPlans);

if (tomorrowPlans.length > 0) {
  const plan = tomorrowPlans[0];
  const task = tomorrowTasks[0];
  console.log(`📅 月間カレンダー: ${plan.startProblem}-${plan.endProblem}問`);
  console.log(`📋 タスクプール: ${task.startProblem}-${task.endProblem}問`);
  console.log(`🔍 一致性: ${plan.startProblem === task.startProblem && plan.endProblem === task.endProblem ? '✅' : '❌'}`);
}

console.log('\n🧪 テスト完了');