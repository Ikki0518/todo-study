// 問題ベースの学習における表示不一致をテストするためのスクリプト
import { generateStudyPlan, convertPlansToTasks } from './src/utils/studyPlanGenerator.js';

// 問題ベースの参考書のサンプルデータ
const problemBasedBook = {
  id: 'math-problems-1',
  title: '数学問題集',
  studyType: 'problems',
  totalProblems: 100,
  currentProblem: 0,
  dailyProblems: 10,
  category: 'math',
  startDate: '2025-01-09'
};

console.log('🧪 問題ベースの学習における表示不一致のテスト');
console.log('=' .repeat(50));

// 1. 学習プランを生成
console.log('1. 学習プランの生成');
const studyPlans = generateStudyPlan([problemBasedBook]);
console.log('生成された学習プラン:', studyPlans);

// 2. 今日の日付のキーを取得
const today = new Date();
const todayKey = today.toISOString().split('T')[0];
console.log(`\n2. 今日の日付: ${todayKey}`);

// 3. 今日の学習プランを取得（月間カレンダーが参照するデータ）
const todayPlans = studyPlans[todayKey] || [];
console.log('月間カレンダー用の学習プラン:', todayPlans);

// 4. 学習プランをタスクに変換（タスクプールが参照するデータ）
const todayTasks = convertPlansToTasks(todayPlans);
console.log('タスクプール用の変換タスク:', todayTasks);

// 5. 表示内容を比較
console.log('\n5. 表示内容の比較');
if (todayPlans.length > 0 && todayTasks.length > 0) {
  const plan = todayPlans[0];
  const task = todayTasks[0];
  
  console.log('📅 月間カレンダー表示:');
  console.log(`  範囲: ${plan.startProblem}-${plan.endProblem}問`);
  console.log(`  データ: startProblem=${plan.startProblem}, endProblem=${plan.endProblem}, problems=${plan.problems}`);
  
  console.log('\n📋 タスクプール表示:');
  console.log(`  範囲: ${task.startProblem}-${task.endProblem}問`);
  console.log(`  データ: startProblem=${task.startProblem}, endProblem=${task.endProblem}, problems=${task.problems}`);
  console.log(`  タイトル: ${task.title}`);
  
  // 一致性チェック
  const isMatching = plan.startProblem === task.startProblem && 
                    plan.endProblem === task.endProblem &&
                    plan.problems === task.problems;
  
  console.log(`\n✅ 一致性チェック: ${isMatching ? '✅ 一致' : '❌ 不一致'}`);
  
  if (!isMatching) {
    console.log('❌ 不一致の詳細:');
    console.log(`  startProblem: ${plan.startProblem} → ${task.startProblem}`);
    console.log(`  endProblem: ${plan.endProblem} → ${task.endProblem}`);
    console.log(`  problems: ${plan.problems} → ${task.problems}`);
  }
} else {
  console.log('⚠️ 学習プランまたはタスクが生成されませんでした');
  console.log(`  学習プラン数: ${todayPlans.length}`);
  console.log(`  タスク数: ${todayTasks.length}`);
}

// 6. 複数日のテスト
console.log('\n6. 複数日のテスト');
const dates = Object.keys(studyPlans).slice(0, 3);
dates.forEach(dateKey => {
  const plans = studyPlans[dateKey];
  const tasks = convertPlansToTasks(plans);
  
  console.log(`\n日付: ${dateKey}`);
  if (plans.length > 0) {
    const plan = plans[0];
    const task = tasks[0];
    console.log(`  学習プラン: ${plan.startProblem}-${plan.endProblem}問`);
    console.log(`  タスク: ${task.startProblem}-${task.endProblem}問`);
    console.log(`  一致: ${plan.startProblem === task.startProblem && plan.endProblem === task.endProblem ? '✅' : '❌'}`);
  }
});

console.log('\n🧪 テスト完了');