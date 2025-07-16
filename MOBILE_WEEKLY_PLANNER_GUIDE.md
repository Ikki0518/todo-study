# モバイル週間プランナー ガイド

## 概要

モバイル週間プランナーは、タップとドラッグ操作で直感的にタスクを管理できるモバイル最適化されたUIコンポーネントです。

## 主な機能

### 1. タップでタスク追加
- 時間スロットをタップすると、タスク追加モーダルが開きます
- タスク名、説明、優先度、時間を設定できます
- 追加されたタスクは即座にカレンダーに表示されます

### 2. ドラッグでタスク時間調整（3つの操作モード）

#### タスク全体の移動
- タスクの中央部分をドラッグして、別の時間帯に移動できます
- 移動中は移動アイコンが表示されます
- タスクの長さは変わらず、開始時刻のみが変更されます

#### 開始時刻の調整（上端ドラッグ）
- タスクの上端をドラッグして、開始時刻を変更できます
- 終了時刻は固定され、タスクの長さが自動的に調整されます
- ホバー時に白いハンドルバーが表示されます

#### 終了時刻の調整（下端ドラッグ）
- タスクの下端をドラッグして、終了時刻を変更できます
- 開始時刻は固定され、タスクの長さが自動的に調整されます
- ホバー時に白いハンドルバーが表示されます

すべての操作で：
- リアルタイムで視覚的フィードバックが提供されます
- 最小30分、最大6時間まで調整可能です
- ドラッグ中はタスクが半透明になり、白い枠が表示されます

### 3. タスク詳細表示
- タスクをタップすると詳細情報が表示されます
- 詳細画面からタスクを削除することも可能です

### 4. 週間ナビゲーション
- 前週・今週・次週ボタンで簡単に週を切り替えられます
- 現在の週は「今週」ボタンがハイライトされます

### 5. 現在時刻インジケーター
- 青い線で現在時刻が表示されます
- 時刻は自動的に更新されます

## 技術的な特徴

### レスポンシブデザイン
- モバイルファーストで設計
- タッチ操作に最適化されたUI
- 44px以上のタッチターゲットサイズ

### アニメーション
- スムーズなフェードイン・スライドアップアニメーション
- タスクのリサイズ時のトランジション効果
- 触覚フィードバック対応（対応デバイスのみ）

### パフォーマンス
- 効率的な再レンダリング
- スムーズなスクロール（-webkit-overflow-scrolling: touch）

## 使用方法

### コンポーネントのインポート
```jsx
import { MobileWeeklyPlanner } from './components/MobileWeeklyPlanner'
```

### 基本的な使用例
```jsx
function MyApp() {
  const [tasks, setTasks] = useState([])

  const handleTaskAdd = (newTask) => {
    setTasks([...tasks, newTask])
  }

  const handleTaskUpdate = (updatedTask) => {
    setTasks(tasks.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    ))
  }

  const handleTaskDelete = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId))
  }

  return (
    <MobileWeeklyPlanner
      tasks={tasks}
      onTaskAdd={handleTaskAdd}
      onTaskUpdate={handleTaskUpdate}
      onTaskDelete={handleTaskDelete}
    />
  )
}
```

### タスクのデータ構造
```javascript
{
  id: 1,
  title: 'タスク名',
  description: 'タスクの説明',
  priority: 'high' | 'medium' | 'low',
  date: '2025-01-15', // ISO形式の日付
  startTime: '09:00',
  duration: 2, // 時間単位
  completed: false
}
```

## デモページへのアクセス

開発環境でデモページを表示するには：
```
http://localhost:3000/?demo=mobile-weekly-planner
```

## カスタマイズ

### 色のカスタマイズ
優先度に応じた色は`getPriorityColor`関数で定義されています：
- 高優先度: 赤色 (bg-red-500)
- 中優先度: 黄色 (bg-yellow-500)
- 低優先度: 緑色 (bg-green-500)

### 時間範囲の変更
`START_HOUR`と`END_HOUR`定数を変更することで、表示する時間範囲を調整できます。

### タッチターゲットサイズ
モバイルでのタッチターゲットは最小44pxに設定されていますが、CSSで調整可能です。

## トラブルシューティング

### タスクが表示されない
- タスクの`date`プロパティが正しいISO形式であることを確認
- `startTime`が正しい形式（HH:MM）であることを確認

### ドラッグが機能しない
- タッチイベントハンドラーが正しく設定されているか確認
- CSSの`touch-action`プロパティが適切に設定されているか確認

### アニメーションが動作しない
- Tailwind CSSが正しくインポートされているか確認
- カスタムCSSクラスが正しく適用されているか確認