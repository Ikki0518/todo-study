import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ChevronDown, 
  Plus,
  Calendar,
  X,
  ChevronUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// === ★★★ タイムゾーン問題を解決するためのヘルパー関数です ★★★ ===
const toYYYYMMDD = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// DailyTaskPoolコンポーネント（変更なし）
const DailyTaskPool = ({
  dailyTasks = [],
  overdueTasks = [],
  onTaskDragStart,
  draggingTaskId
}) => {
  return (
    <div>
      {overdueTasks.length > 0 && (
        <div className="mb-4">
          <h3 className="font-bold text-red-600 mb-2">期限切れのタスク</h3>
          {overdueTasks.map(task => (
            <div
              key={task.id}
              draggable
              onDragStart={(e) => onTaskDragStart(e, task, 'overdueTasks')}
              className={`p-2 mb-2 rounded border-l-4 ${draggingTaskId === task.id ? 'opacity-50' : ''} border-red-500 bg-red-50 cursor-grab flex justify-between items-center`}
            >
              <p className="font-semibold">{task.title}</p>
            </div>
          ))}
        </div>
      )}
      
      <h3 className="font-bold text-gray-800 mb-2">今日のタスク</h3>
      {dailyTasks.length > 0 ? (
        dailyTasks.map(task => (
          <div
            key={task.id}
            draggable
            onDragStart={(e) => onTaskDragStart(e, task, 'taskPool')}
            className={`p-2 mb-2 rounded border-l-4 ${draggingTaskId === task.id ? 'opacity-50' : ''} border-blue-500 bg-blue-50 cursor-grab flex justify-between items-center`}
          >
            <p className="font-semibold">{task.title}</p>
          </div>
        ))
      ) : (
        <p className="text-gray-500 text-sm">タスクはありません。</p>
      )}
    </div>
  );
};

// MonthViewコンポーネント（変更なし）
const MonthView = ({ initialDate, onDateSelect }) => {
  const [displayDate, setDisplayDate] = useState(new Date(initialDate));
  const [touchStartY, setTouchStartY] = useState(null);
  const [touchEndY, setTouchEndY] = useState(null);
  const minSwipeDistance = 50;

  const handleTouchStart = (e) => {
    setTouchEndY(null);
    setTouchStartY(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e) => {
    setTouchEndY(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!touchStartY || !touchEndY) return;
    const distance = touchStartY - touchEndY;
    const isSwipeUp = distance > minSwipeDistance;
    const isSwipeDown = distance < -minSwipeDistance;

    if (isSwipeUp) {
      goToNextMonth();
    } else if (isSwipeDown) {
      goToPreviousMonth();
    }

    setTouchStartY(null);
    setTouchEndY(null);
  };

  const goToPreviousMonth = () => {
    setDisplayDate(current => {
      const prevMonth = new Date(current);
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      return prevMonth;
    });
  };

  const goToNextMonth = () => {
    setDisplayDate(current => {
      const nextMonth = new Date(current);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      return nextMonth;
    });
  };

  const displayMonthName = useMemo(() => displayDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), [displayDate]);

  const daysInMonth = useMemo(() => {
    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [displayDate]);

  const firstDayOfMonth = useMemo(() => daysInMonth.length > 0 ? daysInMonth[0].getDay() : 0, [daysInMonth]);
  const today = new Date();

  return (
    <div
      className="p-4 bg-white border-b animate-slide-down"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex justify-between items-center mb-2">
        <button onClick={goToPreviousMonth} className="p-2 rounded-full hover:bg-gray-100"><ChevronLeft className="w-5 h-5" /></button>
        <h3 className="font-bold text-lg">{displayMonthName}</h3>
        <button onClick={goToNextMonth} className="p-2 rounded-full hover:bg-gray-100"><ChevronRight className="w-5 h-5" /></button>
      </div>
      <div className="grid grid-cols-7 text-center text-xs text-gray-500 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => <div key={day}>{day}</div>)}
      </div>
      <div className="grid grid-cols-7 text-center text-sm">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`}></div>)}
        {daysInMonth.map(day => {
          const isToday = day.toDateString() === today.toDateString();
          return (
            <div key={day.toISOString()} className="p-1">
              <button
                onClick={() => onDateSelect(day)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  isToday 
                    ? 'bg-red-500 text-white' 
                    : 'hover:bg-gray-100'
                }`}
              >
                {day.getDate()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// NewTaskPopupコンポーネント（変更なし）
const NewTaskPopup = ({ taskInfo, onSave, onCancel }) => {
    const [title, setTitle] = useState('');
    
    if (!taskInfo || taskInfo.startHour === null) return null;

    const start = Math.min(taskInfo.startHour, taskInfo.endHour);
    const end = Math.max(taskInfo.startHour, taskInfo.endHour) + 1;

    const handleSave = () => {
        if (title.trim()) {
            onSave({
                title: title,
                scheduledDate: toYYYYMMDD(taskInfo.date),
                scheduledHour: start,
                duration: end - start,
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="p-4 border-b">
                    <h2 className="text-lg font-semibold">新規タスク追加</h2>
                </div>
                <div className="p-4">
                    <p className="mb-2 text-sm text-gray-600">日付: {taskInfo.date.toLocaleDateString('ja-JP')}</p>
                    <p className="mb-4 text-sm text-gray-600">時間: {`${String(start).padStart(2, '0')}:00 - ${String(end).padStart(2, '0')}:00`}</p>
                    <input 
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="タスク名を入力"
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                    />
                </div>
                <div className="p-3 bg-gray-50 border-t flex justify-end space-x-2">
                    <button onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">キャンセル</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">保存</button>
                </div>
            </div>
        </div>
    );
};

const ImprovedDailyPlanner = ({ 
  dailyTaskPool = [], 
  onTaskUpdate,
  scheduledTasks: initialScheduledTasks = [],
  onScheduledTaskUpdate,
  selectedDate,
  overdueTasks = []
}) => {
  const [weekOffset, setWeekOffset] = useState(0); 
  const [draggingTask, setDraggingTask] = useState(null);
  const [draggingTaskId, setDraggingTaskId] = useState(null);
  const [showMonthView, setShowMonthView] = useState(false);
  const scrollContainerRef = useRef(null);
  
  const [scheduledTasks, setScheduledTasks] = useState(Array.isArray(initialScheduledTasks) ? initialScheduledTasks : []);

  const [newTaskInfo, setNewTaskInfo] = useState({ 
    date: null, 
    startHour: null, 
    endHour: null, 
    isCreating: false, 
    isSelected: false 
  });
  const [forceUpdate, setForceUpdate] = useState(0);
  const [showNewTaskPopup, setShowNewTaskPopup] = useState(false);
  const [showTaskPoolForSelection, setShowTaskPoolForSelection] = useState(false);
  const longPressTimer = useRef(null);
  
  const [interaction, setInteraction] = useState({ mode: null, task: null, startY: 0 });

  const startOfWeek = useMemo(() => {
    const today = new Date();
    const adjustedDate = new Date(today);
    adjustedDate.setDate(today.getDate() + (weekOffset * 3));
    adjustedDate.setHours(0, 0, 0, 0);
    return adjustedDate;
  }, [weekOffset]); 

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 3; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }
    return days;
  }, [startOfWeek]);

  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const today = new Date();
  const todayDateString = today.toDateString();
  const currentMonth = today.toLocaleDateString('en-US', { month: 'long' });
  
  useEffect(() => {
    if (scrollContainerRef.current && weekOffset === 0) {
      const currentHour = new Date().getHours();
      const targetHour = Math.max(0, currentHour - 1);
      const scrollPosition = targetHour * 56;
      setTimeout(() => {
        scrollContainerRef.current.scrollTo({ top: scrollPosition, behavior: 'smooth' });
      }, 100);
    }
  }, [weekOffset]);

  const tasksByDateAndHour = useMemo(() => {
    const grouped = {};
    if (Array.isArray(scheduledTasks)) {
      scheduledTasks.forEach(task => {
        if (task.scheduledDate) {
          const dateParts = task.scheduledDate.split('-').map(Number);
          const localDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
          const dateKey = localDate.toDateString();
          
          if (!grouped[dateKey]) grouped[dateKey] = {};
          
          if (task.allDay) {
            if (!grouped[dateKey].allDay) grouped[dateKey].allDay = [];
            grouped[dateKey].allDay.push(task);
          } else if (task.scheduledHour !== undefined) {
            const hourKey = task.scheduledHour;
            if (!grouped[dateKey][hourKey]) grouped[dateKey][hourKey] = [];
            grouped[dateKey][hourKey].push(task);
          }
        }
      });
    }
    return grouped;
  }, [scheduledTasks]);

  const handleTaskDragStart = (e, task, from) => {
    setDraggingTask({ ...task, from });
    setDraggingTaskId(task.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ ...task, from }));
    
    // 時間範囲選択をリセット
    setNewTaskInfo({ date: null, startHour: null, endHour: null, isCreating: false, isSelected: false });
  };
  
  const handleDrop = (e, targetDate, targetHour, isAllDay = false) => {
    e.preventDefault();
    const taskData = JSON.parse(e.dataTransfer.getData('text/plain'));
    if (!taskData) return;

    const updatedTask = {
      ...taskData,
      scheduledDate: toYYYYMMDD(targetDate),
      scheduledHour: isAllDay ? undefined : targetHour,
      allDay: isAllDay,
    };
    delete updatedTask.from;

    let newScheduledTasks = scheduledTasks.filter(t => t.id !== updatedTask.id);
    newScheduledTasks.push(updatedTask);
    
    setScheduledTasks(newScheduledTasks);
    if(onScheduledTaskUpdate) onScheduledTaskUpdate(newScheduledTasks);
    
    if (taskData.from === 'taskPool' || taskData.from === 'overdueTasks') {
        if(onTaskUpdate) onTaskUpdate(dailyTaskPool.filter(t => t.id !== taskData.id));
    }

    setDraggingTask(null);
    setDraggingTaskId(null);
    
    // 時間範囲選択をリセット
    setNewTaskInfo({ date: null, startHour: null, endHour: null, isCreating: false, isSelected: false });
  };
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleCellTouchStart = (e, date, hour) => {
    e.preventDefault();
    longPressTimer.current = setTimeout(() => {
      // 前の選択をクリア
      setNewTaskInfo({ date: null, startHour: null, endHour: null, isCreating: false, isSelected: false });
      
      setNewTaskInfo({ 
        date, 
        startHour: hour, 
        endHour: hour, 
        isCreating: true, 
        isSelected: false 
      });
    }, 500);
  };

  const handleCellTouchMove = (e, date, hour) => {
    e.preventDefault();
    clearTimeout(longPressTimer.current);
    if (newTaskInfo.isCreating && newTaskInfo.date.toDateString() === date.toDateString()) {
      setNewTaskInfo(prev => ({ ...prev, endHour: hour }));
    }
  };

  const handleCellTouchEnd = (e) => {
    e.preventDefault();
    clearTimeout(longPressTimer.current);
    if (newTaskInfo.isCreating) {
      setNewTaskInfo(prev => ({ ...prev, isCreating: false, isSelected: true }));
    }
  };

  const handleCellMouseDown = (e, date, hour) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    // 長押しタイマーを開始
    longPressTimer.current = setTimeout(() => {
      console.log('長押し検出:', date, hour);
      // 前の選択をクリア
      setNewTaskInfo({ date: null, startHour: null, endHour: null, isCreating: false, isSelected: false });
      
      const newState = { 
        date, 
        startHour: hour, 
        endHour: hour, 
        isCreating: true, 
        isSelected: false 
      };
      console.log('新しい状態を設定:', newState);
      setNewTaskInfo(newState);
      setForceUpdate(prev => prev + 1);
    }, 200);
  };
  
  const handleCellMouseMove = (e, date, hour) => {
    if (newTaskInfo.isCreating && newTaskInfo.date.toDateString() === date.toDateString()) {
      e.preventDefault();
      e.stopPropagation();
      setNewTaskInfo(prev => ({ ...prev, endHour: hour }));
    }
  };

  useEffect(() => {
    const handleMouseUpGlobal = (e) => {
      if (newTaskInfo.isCreating) {
        console.log('グローバルマウスアップ - 選択状態に移行');
        const updatedState = { 
          ...newTaskInfo, 
          isCreating: false, 
          isSelected: true 
        };
        console.log('グローバル更新後の状態:', updatedState);
        setNewTaskInfo(updatedState);
      }
    };
    const handleMouseMoveGlobal = (e) => {
      if (newTaskInfo.isCreating) {
        // マウス移動時の処理は必要に応じて追加
      }
    };
    
    window.addEventListener('mouseup', handleMouseUpGlobal);
    window.addEventListener('mousemove', handleMouseMoveGlobal);
    return () => {
      window.removeEventListener('mouseup', handleMouseUpGlobal);
      window.removeEventListener('mousemove', handleMouseMoveGlobal);
    };
  }, [newTaskInfo]);

  // 強制レンダリング用のuseEffect
  useEffect(() => {
    console.log('強制レンダリング:', forceUpdate);
  }, [forceUpdate]);

  // === ★★★ ここに、削除されていたリサイズ機能のロジックを再度追加しました ★★★ ===
  const handleResizeStart = (e, task) => {
    e.stopPropagation();
    setInteraction({
      mode: 'resize',
      task: task,
      startY: e.clientY || e.touches[0].clientY,
    });
    
    // 時間範囲選択をリセット
    setNewTaskInfo({ date: null, startHour: null, endHour: null, isCreating: false, isSelected: false });
  };

  useEffect(() => {
    const handleInteractionMove = (e) => {
      if (interaction.mode !== 'resize' || !interaction.task) return;
      
      const currentY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : interaction.startY);
      const deltaY = currentY - interaction.startY;
      const hourDelta = Math.round(deltaY / 56);

      const originalDuration = interaction.task.duration || 1;
      let newDuration = originalDuration + hourDelta;
      
      if (newDuration < 1) newDuration = 1;
      
      setScheduledTasks(currentTasks => 
        currentTasks.map(t => 
          t.id === interaction.task.id ? { ...t, duration: newDuration } : t
        )
      );
    };

    const handleInteractionEnd = () => {
      if (interaction.mode) {
        if (onScheduledTaskUpdate) {
          onScheduledTaskUpdate(scheduledTasks);
        }
        setInteraction({ mode: null, task: null, startY: 0 });
        
        // 時間範囲選択をリセット
        setNewTaskInfo({ date: null, startHour: null, endHour: null, isCreating: false, isSelected: false });
      }
    };

    window.addEventListener('mousemove', handleInteractionMove);
    window.addEventListener('touchmove', handleInteractionMove);
    window.addEventListener('mouseup', handleInteractionEnd);
    window.addEventListener('touchend', handleInteractionEnd);

    return () => {
      window.removeEventListener('mousemove', handleInteractionMove);
      window.removeEventListener('touchmove', handleInteractionMove);
      window.removeEventListener('mouseup', handleInteractionEnd);
      window.removeEventListener('touchend', handleInteractionEnd);
    };
  }, [interaction, scheduledTasks, onScheduledTaskUpdate]);

  return (
    <div className="flex flex-col h-screen bg-white text-gray-800 font-sans">
      {/* デバッグ情報 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-0 left-0 bg-black bg-opacity-75 text-white p-2 text-xs z-50">
          <div>状態: {newTaskInfo.isCreating ? '作成中' : newTaskInfo.isSelected ? '選択済み' : 'なし'}</div>
          <div>時間: {newTaskInfo.startHour !== null ? `${newTaskInfo.startHour}:00-${newTaskInfo.endHour}:00` : 'なし'}</div>
          <div>日付: {newTaskInfo.date ? newTaskInfo.date.toDateString() : 'なし'}</div>
          <div>選択日付: {newTaskInfo.date ? newTaskInfo.date.toDateString() : 'なし'}</div>
          <div>表示条件: {(newTaskInfo.isCreating || newTaskInfo.isSelected) && newTaskInfo.date ? 'OK' : 'NG'}</div>
          <div>日付一致: {newTaskInfo.date && newTaskInfo.date.toDateString() === 'Thu Jul 24 2025' ? 'OK' : 'NG'}</div>
          <div>現在列: {weekDays[0] ? weekDays[0].toDateString() : 'なし'}</div>
          <div>選択列: {newTaskInfo.date ? newTaskInfo.date.toDateString() : 'なし'}</div>
          <div>Z-Index: 30</div>
          <div>色: {newTaskInfo.isCreating ? '赤色' : newTaskInfo.isSelected ? '緑色' : 'なし'}</div>
          <div>強制更新: {forceUpdate}</div>
          <div>キー: selection-{forceUpdate}-{newTaskInfo.isCreating}-{newTaskInfo.isSelected}</div>
          <div>条件1: {newTaskInfo.isCreating || newTaskInfo.isSelected ? 'OK' : 'NG'}</div>
          <div>条件2: {newTaskInfo.date ? 'OK' : 'NG'}</div>
          <div>条件3: {newTaskInfo.date && newTaskInfo.date.toDateString() === newTaskInfo.date.toDateString() ? 'OK' : 'NG'}</div>
          <div>時間値: startHour={newTaskInfo.startHour}, endHour={newTaskInfo.endHour}</div>
          <button 
            onClick={() => {
              setNewTaskInfo({ date: null, startHour: null, endHour: null, isCreating: false, isSelected: false });
              setForceUpdate(0);
            }}
            className="mt-1 px-2 py-1 bg-red-600 text-white text-xs rounded"
          >
            リセット
          </button>
          <button 
            onClick={() => {
              setNewTaskInfo({ date: null, startHour: null, endHour: null, isCreating: false, isSelected: false });
              setForceUpdate(prev => prev + 1);
            }}
            className="mt-1 px-2 py-1 bg-blue-600 text-white text-xs rounded"
          >
            選択クリア
          </button>
        </div>
      )}
      
      {/* トップヘッダー */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b z-30 bg-white">
        <div className="flex items-center space-x-3">
          <div 
            className="flex items-center space-x-1 cursor-pointer"
            onClick={() => setShowMonthView(!showMonthView)}
          >
            <h1 className="text-xl font-bold">{currentMonth}</h1>
            {showMonthView ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button onClick={() => setWeekOffset(offset => offset - 1)} className="p-1 rounded-full hover:bg-gray-100">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button 
            onClick={() => setWeekOffset(0)}
            className="w-8 h-8 text-sm font-semibold text-gray-700 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200"
          >
            {today.getDate()}
          </button>
          <button onClick={() => setWeekOffset(offset => offset + 1)} className="p-1 rounded-full hover:bg-gray-100">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </header>
      
      {showMonthView && (
        <MonthView 
          initialDate={today} 
          onDateSelect={(date) => {
            const today = new Date();
            today.setHours(0,0,0,0);
            const selected = new Date(date);
            selected.setHours(0,0,0,0);
            const diffTime = selected - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setWeekOffset(Math.floor(diffDays / 3));
            setShowMonthView(false);
          }}
        />
      )}

      {/* カレンダー本体（スクロールエリア） */}
      <div 
        ref={scrollContainerRef} 
        className="flex-1 overflow-y-auto"
        style={{ 
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <div className="grid grid-cols-[64px_1fr]" style={{ minHeight: '1440px' }}>
          
          {/* --- 左列：時間軸 --- */}
          <div className="sticky left-0 z-10 bg-white">
            <div className="sticky top-0 z-20 bg-white">
              <div className="h-20 border-r border-b"></div>
              <div className="h-10 border-r border-b flex items-center justify-center text-xs text-gray-500">All-day</div>
            </div>
            <div>
              {hours.map(hour => (
                <div key={hour} className="h-14 text-right pr-2 text-xs text-gray-400 border-r relative">
                  <span className="absolute top-0 right-2 -translate-y-1/2 bg-white px-1">
                    {hour > 0 ? `${String(hour).padStart(2, '0')}:00` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* --- 右列：日付ヘッダーと時間グリッド本体 --- */}
          <div className="col-start-2">
            <div className="sticky top-0 bg-white z-10">
              <div className="grid grid-cols-3">
                {weekDays.map((date) => {
                  const isToday = date.toDateString() === todayDateString;
                  return (
                    <div key={date.toISOString()} className="text-center p-2 border-b border-r last:border-r-0 h-20 flex flex-col justify-center">
                      <div className="text-xs text-gray-500">{dayNames[date.getDay()].toUpperCase()}</div>
                      <div className={`mt-1 text-lg font-semibold ${isToday ? 'bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto' : ''}`}>
                        {date.getDate()}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-3">
                {weekDays.map((date) => (
                  <div 
                    key={date.toISOString()} 
                    className="border-b border-r last:border-r-0 p-1 min-h-[40px]"
                    onDrop={(e) => handleDrop(e, date, null, true)}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    {(tasksByDateAndHour[date.toDateString()]?.allDay || []).map(task => (
                      <div key={task.id} className="bg-green-100 text-green-800 text-xs p-1 rounded truncate mb-1">
                        {task.title}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="grid grid-cols-3">
                {weekDays.map((date) => (
                  <div key={date.toISOString()} className="relative border-r last:border-r-0">
                    {hours.map(hour => (
                      <div key={hour} className="h-14 border-b"></div>
                    ))}
                  </div>
                ))}
              </div>
              
              <div className="absolute inset-0 grid grid-cols-3">
                {weekDays.map((date) => (
                  <div key={date.toISOString()} className="relative">
                    {Object.entries(tasksByDateAndHour[date.toDateString()] || {}).flatMap(([hour, tasks]) => {
                      if (hour === 'allDay') return [];
                      return tasks.map(task => (
                        <div 
                          key={task.id} 
                          className="absolute inset-x-0 z-10 p-1" 
                          style={{ top: `${parseInt(hour) * 56}px`, height: `${(task.duration || 1) * 56}px` }}
                          draggable
                          onDragStart={(e) => handleTaskDragStart(e, task, 'calendar')}
                        >
                          <div className="bg-blue-200 text-blue-900 h-full rounded-lg p-2 text-xs overflow-hidden flex flex-col justify-between">
                            <p className="font-bold">{task.title}</p>
                            <div 
                              className="self-end w-full h-4 cursor-ns-resize flex items-end justify-center"
                              onMouseDown={(e) => handleResizeStart(e, task)}
                              onTouchStart={(e) => handleResizeStart(e, task)}
                            >
                              <div className="w-6 h-1 bg-blue-400 rounded-full"></div>
                            </div>
                          </div>
                        </div>
                      ));
                    })}
                    {hours.map(hour => (
                      <div 
                        key={hour} 
                        className="h-14 cursor-pointer hover:bg-gray-50" 
                        onDrop={(e) => handleDrop(e, date, hour)} 
                        onDragOver={(e) => e.preventDefault()}
                        onTouchStart={(e) => handleCellTouchStart(e, date, hour)}
                        onTouchMove={(e) => handleCellTouchMove(e, date, hour)}
                        onTouchEnd={handleCellTouchEnd}
                        onMouseDown={(e) => handleCellMouseDown(e, date, hour)}
                        onMouseMove={(e) => handleCellMouseMove(e, date, hour)}
                        onMouseUp={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // 長押しタイマーをクリア
                          if (longPressTimer.current) {
                            clearTimeout(longPressTimer.current);
                            longPressTimer.current = null;
                          }
                          // 作成中の場合、選択状態に移行
                          if (newTaskInfo.isCreating) {
                            console.log('選択状態に移行:', newTaskInfo);
                            const updatedState = { 
                              ...newTaskInfo, 
                              isCreating: false, 
                              isSelected: true 
                            };
                            console.log('更新後の状態:', updatedState);
                            setNewTaskInfo(updatedState);
                            setForceUpdate(prev => prev + 1);
                          }
                        }}
                        onMouseEnter={(e) => {
                          if (newTaskInfo.isCreating && newTaskInfo.date.toDateString() === date.toDateString()) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const relativeY = e.clientY - rect.top;
                            const hourFromY = Math.floor(relativeY / 56);
                            setNewTaskInfo(prev => ({ ...prev, endHour: hourFromY }));
                          }
                        }}
                      ></div>
                    ))}
                    {/* 時間範囲選択の表示 */}
                    {(newTaskInfo.isCreating || newTaskInfo.isSelected) && newTaskInfo.date && newTaskInfo.date.toDateString() === date.toDateString() && (
                        <div 
                            key={`selection-${forceUpdate}-${newTaskInfo.isCreating}-${newTaskInfo.isSelected}`}
                            className={`absolute w-full border-4 rounded-lg shadow-lg ${
                              newTaskInfo.isCreating 
                                ? 'bg-blue-300 bg-opacity-90 border-blue-600 pointer-events-none' 
                                : 'bg-green-400 bg-opacity-90 border-green-600 cursor-pointer hover:bg-green-500'
                            }`}
                            style={{
                                top: `${Math.min(newTaskInfo.startHour || 0, newTaskInfo.endHour || 0) * 56}px`,
                                height: `${(Math.abs((newTaskInfo.endHour || 0) - (newTaskInfo.startHour || 0)) + 1) * 56}px`,
                                zIndex: 30,
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (newTaskInfo.isSelected) {
                                console.log('タスクプールを開きます:', newTaskInfo);
                                setShowTaskPoolForSelection(true);
                              }
                            }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                        >
                            <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">
                                {newTaskInfo.isCreating 
                                  ? `${String(Math.min(newTaskInfo.startHour || 0, newTaskInfo.endHour || 0)).padStart(2, '0')}:00 - ${String(Math.max(newTaskInfo.startHour || 0, newTaskInfo.endHour || 0) + 1).padStart(2, '0')}:00`
                                  : 'タップしてタスクを選択'
                                }
                            </div>
                        </div>
                    )}
                    {/* デバッグ用の強制表示 */}
                    {process.env.NODE_ENV === 'development' && newTaskInfo.isSelected && newTaskInfo.date && newTaskInfo.date.toDateString() === date.toDateString() && (
                        <div 
                            className="absolute w-full border-2 border-green-500 bg-green-200 bg-opacity-70 cursor-pointer hover:bg-green-300"
                            style={{
                                top: `${Math.min(newTaskInfo.startHour || 0, newTaskInfo.endHour || 0) * 56}px`,
                                height: `${(Math.abs((newTaskInfo.endHour || 0) - (newTaskInfo.startHour || 0)) + 1) * 56}px`,
                                zIndex: 25,
                            }}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('タスクプールを開きます:', newTaskInfo);
                                setShowTaskPoolForSelection(true);
                            }}
                        >
                            <div className="absolute inset-0 flex items-center justify-center text-green-700 font-bold text-xs">
                                タップしてタスクを選択
                            </div>
                        </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* フローティングアクションボタン */}
      <div className="fixed bottom-6 right-20 z-40">
        <button 
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-lg transition-colors"
          title="新規タスク追加"
          onClick={() => {
            // 現在の時間を取得して新規タスク作成
            const now = new Date();
            const currentHour = now.getHours();
            setNewTaskInfo({ 
              date: now, 
              startHour: currentHour, 
              endHour: currentHour + 1, 
              isCreating: false, 
              isSelected: false 
            });
            setShowNewTaskPopup(true);
          }}
        >
          <Plus className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* 通常のタスクプール（削除） */}
      {/* 選択された時間範囲用のタスクプール */}
      {showTaskPoolForSelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">タスクを選択</h2>
              <button onClick={() => {
                console.log('タスクプールを閉じます');
                setShowTaskPoolForSelection(false);
                setNewTaskInfo({ date: null, startHour: null, endHour: null, isCreating: false, isSelected: false });
              }} className="p-2 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  選択時間: {newTaskInfo.date?.toLocaleDateString('ja-JP')} {String(Math.min(newTaskInfo.startHour, newTaskInfo.endHour)).padStart(2, '0')}:00 - {String(Math.max(newTaskInfo.startHour, newTaskInfo.endHour) + 1).padStart(2, '0')}:00
                </p>
              </div>
              <DailyTaskPool
                dailyTasks={dailyTaskPool}
                overdueTasks={overdueTasks}
                onTaskDragStart={(e, task, from) => {
                  // タスクを選択された時間範囲にスケジュール
                  const updatedTask = {
                    ...task,
                    scheduledDate: toYYYYMMDD(newTaskInfo.date),
                    scheduledHour: Math.min(newTaskInfo.startHour, newTaskInfo.endHour),
                    duration: Math.abs(newTaskInfo.endHour - newTaskInfo.startHour) + 1,
                  };
                  
                  const newScheduledTasks = [...(Array.isArray(scheduledTasks) ? scheduledTasks : []), updatedTask];
                  setScheduledTasks(newScheduledTasks);
                  if (onScheduledTaskUpdate) {
                    onScheduledTaskUpdate(newScheduledTasks);
                  }
                  
                  // タスクプールから削除
                  if (onTaskUpdate) {
                    const updatedTasks = dailyTaskPool.filter(t => t.id !== task.id);
                    onTaskUpdate(updatedTasks);
                  }
                  
                  setShowTaskPoolForSelection(false);
                  setNewTaskInfo({ date: null, startHour: null, endHour: null, isCreating: false, isSelected: false });
                }}
                draggingTaskId={draggingTaskId}
              />
              <div className="mt-4 pt-4 border-t">
                <button 
                  onClick={() => {
                    setShowTaskPoolForSelection(false);
                    setShowNewTaskPopup(true);
                  }}
                  className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  新しいタスクを作成
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {showNewTaskPopup && (
        <NewTaskPopup 
            taskInfo={newTaskInfo}
            onCancel={() => {
                setShowNewTaskPopup(false);
                setNewTaskInfo({ date: null, startHour: null, endHour: null, isCreating: false, isSelected: false });
            }}
            onSave={(newTaskData) => {
                const newTask = {
                    id: Date.now().toString(),
                    ...newTaskData,
                };
                
                const newScheduledTasks = [...(Array.isArray(scheduledTasks) ? scheduledTasks : []), newTask];
                setScheduledTasks(newScheduledTasks);
                if (onScheduledTaskUpdate) {
                    onScheduledTaskUpdate(newScheduledTasks);
                }

                setShowNewTaskPopup(false);
                setNewTaskInfo({ date: null, startHour: null, endHour: null, isCreating: false, isSelected: false });
            }}
        />
      )}
    </div>
  );
};

export default ImprovedDailyPlanner;