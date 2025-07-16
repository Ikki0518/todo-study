# 📅 カレンダー機能改善ガイド

## 🎯 実装した改善内容

### 1. モバイル対応の日付表示
**機能**: 画面サイズに応じて表示する日数を自動調整

**実装内容**:
```javascript
const getDates = () => {
  const today = new Date()
  const dates = []
  
  // モバイル判定（画面幅768px未満）
  const isMobile = window.innerWidth < 768
  
  if (isMobile) {
    // モバイル: 今日から2日後まで（3日間）
    for (let i = 0; i < 3; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push(date)
    }
  } else {
    // PC: 週間表示（weekOffsetを考慮）
    const dayOfWeek = today.getDay()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - dayOfWeek + (weekOffset * 7))
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      dates.push(date)
    }
  }
  
  return dates
}
```

**効果**:
- **モバイル**: 3日間表示で見やすさを向上
- **PC**: 従来通り7日間の週表示
- **レスポンシブ**: 画面サイズに応じて自動切り替え

### 2. 現在時刻インジケーター
**機能**: リアルタイムで現在時刻を視覚的に表示

**実装内容**:
```javascript
// 現在時刻インジケーター関連の関数
const getCurrentTimePosition = () => {
  const now = new Date()
  const hours = now.getHours()
  const minutes = now.getMinutes()
  
  // 24時間グリッドでの位置を計算（0時から24時まで）
  const totalMinutes = hours * 60 + minutes
  const pixelsPerMinute = 80 / 60 // 1時間あたり80px
  return totalMinutes * pixelsPerMinute
}

const getCurrentTimeString = () => {
  const now = new Date()
  return now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
}

const isCurrentTimeInGrid = () => {
  const now = new Date()
  const hours = now.getHours()
  return hours >= 0 && hours <= 23 // 24時間表示
}
```

**UI実装**:
```jsx
{/* 現在時刻インジケーター - 24時間グリッド内の場合のみ表示 */}
{isCurrentTimeInGrid() && (
  <div
    className="absolute left-0 right-0 pointer-events-none z-20"
    style={{
      top: `${getCurrentTimePosition()}px`,
      height: '2px'
    }}
  >
    <div className="calendar-grid" style={{gridTemplateColumns: `60px repeat(${dates.length}, 1fr)`}}>
      {/* 時間列のスペース */}
      <div className="relative">
        <div className="absolute right-2 -top-3 text-xs font-semibold text-blue-600 bg-white px-1 rounded shadow-sm">
          {getCurrentTimeString()}
        </div>
      </div>
      
      {/* 各日付列 - 全ての列に青い線を表示 */}
      {dates.map((date, dateIndex) => (
        <div key={dateIndex} className="relative">
          <div className="absolute inset-0 bg-blue-500 h-0.5 shadow-sm">
            {/* 現在時刻の青い線とドット */}
          </div>
        </div>
      ))}
    </div>
  </div>
)}
```

**効果**:
- **視覚的フィードバック**: 現在時刻が青い線で表示
- **時刻表示**: 現在時刻がテキストで表示
- **リアルタイム**: 時間の経過とともに線が移動
- **全列対応**: すべての日付列に線が表示

### 3. レスポンシブグリッドレイアウト
**機能**: 表示する日数に応じてグリッドレイアウトを動的調整

**実装内容**:
```javascript
// グリッドのカラム数を動的に設定
style={{gridTemplateColumns: `60px repeat(${dates.length}, 1fr)`}}
```

**効果**:
- **動的レイアウト**: 日数に応じてカラム数が自動調整
- **一貫性**: ヘッダーとボディのグリッドが同期
- **柔軟性**: モバイル3日、PC7日に対応

## 🔧 技術的詳細

### ファイル変更
- **[`src/App.jsx`](todo-study/src/App.jsx:312)**: メインのカレンダー機能

### 主要な変更点

#### 1. 関数の追加・修正
```javascript
// 新規追加
const getDates = () => { /* モバイル対応の日付生成 */ }
const getCurrentTimePosition = () => { /* 現在時刻の位置計算 */ }
const getCurrentTimeString = () => { /* 現在時刻の文字列取得 */ }
const isCurrentTimeInGrid = () => { /* 現在時刻がグリッド内かチェック */ }

// 既存関数は保持
const getWeekDates = (offset = 0, twoWeeks = false) => { /* 従来の週表示 */ }
```

#### 2. 表示ロジックの変更
```javascript
// 変更前
{weekDates.map((date, index) => { /* ... */ })}

// 変更後
{dates.map((date, index) => { /* ... */ })}
```

#### 3. グリッドレイアウトの動的調整
```javascript
// 変更前
style={{gridTemplateColumns: `60px repeat(7, 1fr)`}}

// 変更後
style={{gridTemplateColumns: `60px repeat(${dates.length}, 1fr)`}}
```

## 📱 ユーザーエクスペリエンス

### モバイルでの改善
- **表示最適化**: 3日間表示で画面に収まりやすく
- **操作性向上**: スクロールが少なく済む
- **視認性**: 重要な情報が見やすい

### PCでの改善
- **従来機能維持**: 7日間の週表示を継続
- **現在時刻表示**: リアルタイムで時間を把握
- **視覚的ガイド**: 青い線で現在時刻を明確に表示

### 共通改善
- **レスポンシブ**: 画面サイズに応じて自動調整
- **直感的**: 現在時刻が一目で分かる
- **一貫性**: デザインとレイアウトの統一

## 🎨 デザイン要素

### 現在時刻インジケーター
- **色**: 青色（`bg-blue-500`）で視認性を確保
- **太さ**: 2px（`h-0.5`）で適度な存在感
- **影**: `shadow-sm`で立体感を演出
- **位置**: `z-20`で他の要素より前面に表示

### 時刻表示
- **背景**: 白色（`bg-white`）で読みやすさを確保
- **文字色**: 青色（`text-blue-600`）でインジケーターと統一
- **フォント**: `font-semibold`で視認性を向上
- **パディング**: `px-1`で適度な余白

## 🚀 今後の拡張可能性

### 追加可能な機能
1. **タイムゾーン対応**: 複数のタイムゾーンに対応
2. **カスタム表示**: ユーザーが表示日数を選択可能
3. **アニメーション**: 時刻インジケーターの滑らかな移動
4. **通知機能**: 特定時刻での通知表示

### パフォーマンス最適化
1. **メモ化**: `useMemo`で計算結果をキャッシュ
2. **更新頻度**: 分単位での更新に最適化
3. **レンダリング**: 必要な部分のみ再描画

## 📊 実装効果

### 定量的効果
- **モバイル表示**: 3日間表示で画面利用効率向上
- **レスポンス性**: 画面サイズ変更に即座に対応
- **視認性**: 現在時刻が明確に表示

### 定性的効果
- **ユーザビリティ**: 直感的な時間把握が可能
- **モダン感**: 現代的なUIデザイン
- **一貫性**: デザインシステムとの統合

ユーザーからの要求に応じて、カレンダー機能を大幅に改善し、モバイル対応と現在時刻表示機能を実装しました。