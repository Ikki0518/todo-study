export function InstructorDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">講師ダッシュボード</h1>
      <div className="grid grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">担当生徒一覧</h2>
          <p className="text-gray-600">担当生徒の一覧を表示予定</p>
        </div>
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">通知</h2>
          <p className="text-gray-600">重要な通知を表示予定</p>
        </div>
      </div>
    </div>
  );
}