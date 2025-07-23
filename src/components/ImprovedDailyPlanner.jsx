import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ChevronDown,
  Plus,
  Calendar,
  X,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Move,
  GripVertical
} from 'lucide-react';
import { DailyTaskPool } from './DailyTaskPool';

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

  const displayMonthName = useMemo(() => {
    const month = displayDate.toLocaleDateString('en-US', { month: 'long' });
    const year = displayDate.getFullYear();
    return `${month} ${year}`;
  }, [displayDate]);

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

  // カレンダーグリッドの総セル数を計算（6週間分 = 42セル）
  const totalCells = 42;
  const calendarDays = useMemo(() => {
    const days = [];
    
    // 前月の日付を追加
    const firstDay = new Date(displayDate.getFullYear(), displayDate.getMonth(), 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDayOfMonth);
    
    for (let i = 0; i < totalCells; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      days.push(currentDate);
    }
    
    return days;
  }, [displayDate, firstDayOfMonth]);

  return (
    <div
      className="p-6 bg-white border-b animate-slide-down"
      style={{ height: '500px' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex justify-between items-center mb-4">
        <button onClick={goToPreviousMonth} className="p-2 rounded-full hover:bg-gray-100"><ChevronLeft className="w-5 h-5" /></button>
        <h3 className="font-bold text-xl">{displayMonthName}</h3>
        <button onClick={goToNextMonth} className="p-2 rounded-full hover:bg-gray-100"><ChevronRight className="w-5 h-5" /></button>
      </div>
      <div className="grid grid-cols-7 text-center text-sm text-gray-500 mb-3">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="font-medium">{day}</div>)}
      </div>
      <div className="grid grid-cols-7 text-center text-sm" style={{ 
        height: '400px',
        gridTemplateRows: 'repeat(6, 1fr)',
        gap: '8px',
        display: 'grid'
      }}>
        {calendarDays.map((day, index) => {
          const isToday = day.toDateString() === today.toDateString();
          const isCurrentMonth = day.getMonth() === displayDate.getMonth();
          const isCurrentYear = day.getFullYear() === displayDate.getFullYear();
          const isCurrentMonthDay = isCurrentMonth && isCurrentYear;
          
          return (
            <div 
              key={`${day.toISOString()}-${index}`} 
              className="flex items-center justify-center"
              style={{ 
                height: 'calc(100% / 6)',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                boxSizing: 'border-box',
                gridRow: Math.floor(index / 7) + 1,
                gridColumn: (index % 7) + 1,
                minHeight: '60px'
              }}
            >
              <button
                onClick={() => onDateSelect(day)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors text-sm font-medium ${
                  isToday 
                    ? 'bg-red-500 text-white' 
                    : isCurrentMonthDay
                    ? 'hover:bg-gray-100'
                    : 'text-gray-400 hover:bg-gray-50'
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

const NewTaskPopup = ({ taskInfo, onSave, onCancel }) => {
    const [title, setTitle] = useState('');
    
    if (!taskInfo || taskInfo.startHour === null) return null;

    const start = Math.min(taskInfo.startHour, taskInfo.endHour);
    const end = Math.max(taskInfo.startHour, taskInfo.endHour) + 1;

    const handleSave = () => {
        if (title.trim()) {
            onSave({
                title: title,
                scheduledDate: taskInfo.date.toISOString().split('T')[0],
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

const TimeIndicator = () => {
  const [timeData, setTimeData] = useState({ top: 0, time: '' });

  useEffect(() => {
    const calculatePosition = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();
      const newPosition = (hours + minutes / 60 + seconds / 3600) * 56;
      
      setTimeData({
        top: newPosition,
        time: now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
      });
    };

    calculatePosition();
    const intervalId = setInterval(calculatePosition, 1000); 

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="absolute left-0 right-0 flex items-center" style={{ top: `${timeData.top}px`, transform: 'translateY(-50%)', zIndex: 25 }}>
      <div className="absolute right-full pr-2">
        <span className="text-xs text-red-500 font-semibold bg-white px-1">
          {timeData.time}
        </span>
      </div>
      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
      <div className="flex-1 h-px bg-red-500"></div>
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
  const [showTaskPool, setShowTaskPool] = useState(false);
  const [showMonthView, setShowMonthView] = useState(false);
  const [taskPoolMode, setTaskPoolMode] = useState('popup'); // 'popup' or 'sidebar'
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const scrollContainerRef = useRef(null);
  
  const [scheduledTasks, setScheduledTasks] = useState(Array.isArray(initialScheduledTasks) ? initialScheduledTasks : []);

  const [newTaskInfo, setNewTaskInfo] = useState({ date: null, startHour: null, endHour: null, isCreating: false });
  const [showNewTaskPopup, setShowNewTaskPopup] = useState(false);
  const longPressTimer = useRef(null);
  
  // リサイズ機能用の状態
  const [resizingTask, setResizingTask] = useState(null);
  const [resizeHandle, setResizeHandle] = useState(null); // 'top' or 'bottom'
  const [resizeStartY, setResizeStartY] = useState(0);
  const [resizeOriginalHeight, setResizeOriginalHeight] = useState(0);
  const [resizeOriginalTop, setResizeOriginalTop] = useState(0);
  const [hoveredTask, setHoveredTask] = useState(null);
  
  // ドラッグオーバー状態の管理
  const [dragOverCell, setDragOverCell] = useState(null);
  const [dragScrollInterval, setDragScrollInterval] = useState(null);
  
  // 統合機能用の状態
  const [showTaskStats, setShowTaskStats] = useState(true);
  const [autoScheduleMode, setAutoScheduleMode] = useState(false);
  
  // モバイル対応用の状態
  const [isMobile, setIsMobile] = useState(false);
  const [touchStartData, setTouchStartData] = useState(null);
  const [longPressMenuTask, setLongPressMenuTask] = useState(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [isDraggingOnMobile, setIsDraggingOnMobile] = useState(false);
  
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
  
  // モバイル検出
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

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
          const dateKey = new Date(task.scheduledDate).toDateString();
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

  // モバイル用の長押しメニュー処理
  const handleTaskLongPress = (e, task) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenuPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    });
    setLongPressMenuTask(task);
    
    // バイブレーション
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  // タスクのリサイズ処理
  const handleResizeStart = (e, task, handle) => {
    e.preventDefault();
    e.stopPropagation();
    
    setResizingTask(task);
    setResizeHandle(handle);
    setResizeStartY(e.clientY || e.touches?.[0]?.clientY);
    setResizeOriginalHeight((task.duration || 1) * 56);
    setResizeOriginalTop((task.scheduledHour || 0) * 56);
    
    // マウスイベントリスナーを追加
    if (isMobile) {
      document.addEventListener('touchmove', handleResizeMove, { passive: false });
      document.addEventListener('touchend', handleResizeEnd);
    } else {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
    }
  };

  const handleResizeMove = (e) => {
    if (!resizingTask || !resizeHandle) return;
    
    e.preventDefault();
    const currentY = e.clientY || e.touches?.[0]?.clientY;
    const deltaY = currentY - resizeStartY;
    const deltaHours = Math.round(deltaY / 56);
    
    let newScheduledHour = resizingTask.scheduledHour || 0;
    let newDuration = resizingTask.duration || 1;
    
    if (resizeHandle === 'top') {
      // 上端をリサイズ：開始時間を変更
      newScheduledHour = Math.max(0, Math.min(23, (resizingTask.scheduledHour || 0) + deltaHours));
      newDuration = Math.max(1, (resizingTask.duration || 1) - deltaHours);
    } else if (resizeHandle === 'bottom') {
      // 下端をリサイズ：終了時間を変更
      const maxEndHour = 24;
      const newEndHour = Math.min(maxEndHour, Math.max(newScheduledHour + 1, (resizingTask.scheduledHour || 0) + (resizingTask.duration || 1) + deltaHours));
      newDuration = newEndHour - newScheduledHour;
    }
    
    // タスクを更新
    const updatedTask = {
      ...resizingTask,
      scheduledHour: newScheduledHour,
      duration: newDuration
    };
    
    const newScheduledTasks = scheduledTasks.map(task => 
      task.id === resizingTask.id ? updatedTask : task
    );
    
    setScheduledTasks(newScheduledTasks);
  };

  const handleResizeEnd = () => {
    if (resizingTask && onScheduledTaskUpdate) {
      onScheduledTaskUpdate(scheduledTasks);
    }
    
    setResizingTask(null);
    setResizeHandle(null);
    setResizeStartY(0);
    setResizeOriginalHeight(0);
    setResizeOriginalTop(0);
    
    // イベントリスナーを削除
    if (isMobile) {
      document.removeEventListener('touchmove', handleResizeMove);
      document.removeEventListener('touchend', handleResizeEnd);
    } else {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    }
  };

  // モバイル用タッチドラッグ処理
  const handleTaskTouchStart = (e, task) => {
    const touch = e.touches[0];
    setTouchStartData({
      startTime: Date.now(),
      startX: touch.clientX,
      startY: touch.clientY,
      task: task,
      element: e.currentTarget
    });
    
    // 長押し検出
    const longPressTimer = setTimeout(() => {
      handleTaskLongPress(e, task);
    }, 500);
    
    setTouchStartData(prev => ({ ...prev, longPressTimer }));
  };

  const handleTaskTouchMove = (e) => {
    if (!touchStartData) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartData.startX);
    const deltaY = Math.abs(touch.clientY - touchStartData.startY);
    
    // 移動距離が一定以上の場合、ドラッグモードに移行
    if ((deltaX > 15 || deltaY > 15) && !isDraggingOnMobile) {
      clearTimeout(touchStartData.longPressTimer);
      setIsDraggingOnMobile(true);
      
      // ドラッグ開始
      setDraggingTask(touchStartData.task);
      setDraggingTaskId(touchStartData.task.id);
      
      // 既存のスケジュールされたタスクを一時的に削除
      if (scheduledTasks.some(t => t.id === touchStartData.task.id)) {
        const tempTasks = scheduledTasks.filter(t => t.id !== touchStartData.task.id);
        setScheduledTasks(tempTasks);
      }
      
      // 視覚的フィードバック
      touchStartData.element.style.opacity = '0.7';
      touchStartData.element.style.transform = 'scale(1.05)';
      touchStartData.element.style.zIndex = '100';
      
      // バイブレーション
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    }
  };

  const handleTaskTouchEnd = (e) => {
    if (!touchStartData) return;
    
    clearTimeout(touchStartData.longPressTimer);
    
    if (isDraggingOnMobile) {
      // ドロップ位置を検出
      const touch = e.changedTouches[0];
      const dropElement = document.elementFromPoint(touch.clientX, touch.clientY);
      
      // ドロップ先のセルを見つける
      let dropCell = dropElement;
      while (dropCell && !dropCell.dataset?.date && !dropCell.dataset?.hour) {
        dropCell = dropCell.parentElement;
      }
      
      if (dropCell?.dataset?.date) {
        const targetDate = new Date(dropCell.dataset.date);
        const targetHour = dropCell.dataset.hour ? parseInt(dropCell.dataset.hour) : null;
        const isAllDay = dropCell.dataset.allday === 'true';
        
        handleDrop({
          preventDefault: () => {},
          dataTransfer: { dropEffect: 'move' }
        }, targetDate, targetHour, isAllDay);
      }
      
      // スタイルをリセット
      touchStartData.element.style.opacity = '1';
      touchStartData.element.style.transform = 'scale(1)';
      touchStartData.element.style.zIndex = '10';
      
      setIsDraggingOnMobile(false);
    }
    
    setTouchStartData(null);
  };

  // 既存タスクのドラッグ処理
  const handleScheduledTaskDragStart = (e, task) => {
    setDraggingTask(task);
    setDraggingTaskId(task.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify(task));
    
    // 既存のスケジュールされたタスクを一時的に削除
    const tempTasks = scheduledTasks.filter(t => t.id !== task.id);
    setScheduledTasks(tempTasks);
  };

  // ドラッグ中の自動スクロール機能
  const handleDragScroll = (direction) => {
    if (dragScrollInterval) return;
    
    const interval = setInterval(() => {
      if (direction === 'left') {
        setWeekOffset(prev => prev - 1);
      } else if (direction === 'right') {
        setWeekOffset(prev => prev + 1);
      }
    }, 500);
    
    setDragScrollInterval(interval);
  };

  const stopDragScroll = () => {
    if (dragScrollInterval) {
      clearInterval(dragScrollInterval);
      setDragScrollInterval(null);
    }
  };

  // ドラッグオーバー処理の改善
  const handleDragOver = (e, targetDate, targetHour, isAllDay = false) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // 現在のドラッグオーバーセルを設定
    const cellKey = `${targetDate.toDateString()}-${isAllDay ? 'allday' : targetHour}`;
    setDragOverCell(cellKey);
    
    // 画面端での自動スクロール判定
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = scrollContainerRef.current?.getBoundingClientRect();
    
    if (containerRect) {
      if (e.clientX < containerRect.left + 50) {
        handleDragScroll('left');
      } else if (e.clientX > containerRect.right - 50) {
        handleDragScroll('right');
      } else {
        stopDragScroll();
      }
    }
  };

  const handleDragLeave = (e, targetDate, targetHour, isAllDay = false) => {
    const cellKey = `${targetDate.toDateString()}-${isAllDay ? 'allday' : targetHour}`;
    if (dragOverCell === cellKey) {
      setDragOverCell(null);
    }
    stopDragScroll();
  };

  const handleTaskDragStart = (e, task) => {
    setDraggingTask(task);
    setDraggingTaskId(task.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify(task));
  };

  const handleDrop = (e, targetDate, targetHour, isAllDay = false) => {
    e.preventDefault();
    stopDragScroll();
    setDragOverCell(null);
    
    if (!draggingTask) return;
    
    let duration = draggingTask.duration || 1;
    
    // 既存のスケジュールされたタスクの場合、元の長さを保持
    if (scheduledTasks.some(t => t.id === draggingTask.id)) {
      duration = draggingTask.duration || 1;
    }
    
    const scheduledTask = {
      ...draggingTask,
      scheduledDate: targetDate.toISOString().split('T')[0],
      scheduledHour: isAllDay ? undefined : targetHour,
      allDay: isAllDay,
      duration: isAllDay ? undefined : duration,
      id: draggingTask.id || Date.now().toString(),
    };
    
    const newScheduledTasks = [...(scheduledTasks || [])];
    const existingIndex = newScheduledTasks.findIndex(task => task.id === draggingTask.id);
    if (existingIndex >= 0) {
        newScheduledTasks[existingIndex] = scheduledTask;
    } else {
        newScheduledTasks.push(scheduledTask);
    }
    setScheduledTasks(newScheduledTasks);
    if (onScheduledTaskUpdate) {
        onScheduledTaskUpdate(newScheduledTasks);
    }
    
    // タスクプールからの移動の場合のみ、プールから削除
    if (onTaskUpdate && !scheduledTasks.some(t => t.id === draggingTask.id)) {
        const updatedTasks = dailyTaskPool.filter(task => task.id !== draggingTask.id);
        onTaskUpdate(updatedTasks);
    }
    
    setDraggingTask(null);
    setDraggingTaskId(null);
  };

  // 自動スケジューリング機能
  const handleAutoSchedule = () => {
    const unscheduledTasks = dailyTaskPool.filter(task => 
      !task.completed && !scheduledTasks.some(st => st.id === task.id)
    );
    
    if (unscheduledTasks.length === 0) return;
    
    const newScheduledTasks = [...scheduledTasks];
    let currentHour = 9; // 開始時間
    const today = new Date();
    
    unscheduledTasks.forEach(task => {
      // 既存のタスクとの競合をチェック
      while (currentHour < 22) { // 22時まで
        const hasConflict = newScheduledTasks.some(st => 
          st.scheduledDate === today.toISOString().split('T')[0] &&
          st.scheduledHour <= currentHour &&
          (st.scheduledHour + (st.duration || 1)) > currentHour
        );
        
        if (!hasConflict) break;
        currentHour++;
      }
      
      if (currentHour < 22) {
        const scheduledTask = {
          ...task,
          id: task.id || Date.now().toString() + Math.random(),
          scheduledDate: today.toISOString().split('T')[0],
          scheduledHour: currentHour,
          duration: task.estimatedDuration || 1,
          allDay: false
        };
        
        newScheduledTasks.push(scheduledTask);
        currentHour += (task.estimatedDuration || 1);
      }
    });
    
    setScheduledTasks(newScheduledTasks);
    if (onScheduledTaskUpdate) {
      onScheduledTaskUpdate(newScheduledTasks);
    }
    
    // タスクプールから移動
    if (onTaskUpdate) {
      const updatedTasks = dailyTaskPool.filter(task => 
        task.completed || newScheduledTasks.some(st => st.id === task.id)
      );
      onTaskUpdate(updatedTasks);
    }
  };

  // タスク統計の計算
  const taskStats = useMemo(() => {
    const totalTasks = dailyTaskPool.length;
    const completedTasks = dailyTaskPool.filter(task => task.completed).length;
    const scheduledTasksCount = scheduledTasks.filter(task => {
      const taskDate = new Date(task.scheduledDate);
      return weekDays.some(day => day.toDateString() === taskDate.toDateString());
    }).length;
    
    return {
      total: totalTasks,
      completed: completedTasks,
      scheduled: scheduledTasksCount,
      unscheduled: totalTasks - completedTasks - scheduledTasksCount,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    };
  }, [dailyTaskPool, scheduledTasks, weekDays]);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleCellTouchStart = (e, date, hour) => {
    longPressTimer.current = setTimeout(() => {
      setNewTaskInfo({ date, startHour: hour, endHour: hour, isCreating: true });
    }, 500);
  };

  const handleCellTouchMove = (e, date, hour) => {
    clearTimeout(longPressTimer.current);
    if (newTaskInfo.isCreating && newTaskInfo.date.toDateString() === date.toDateString()) {
      setNewTaskInfo(prev => ({ ...prev, endHour: hour }));
    }
  };

  const handleCellTouchEnd = () => {
    clearTimeout(longPressTimer.current);
    if (newTaskInfo.isCreating) {
      setShowNewTaskPopup(true);
    }
  };

  const handleCellMouseDown = (e, date, hour) => {
    if (e.button !== 0) return;
    setNewTaskInfo({ date, startHour: hour, endHour: hour, isCreating: true });
  };
  
  const handleCellMouseMove = (e, date, hour) => {
    if (newTaskInfo.isCreating && newTaskInfo.date.toDateString() === date.toDateString()) {
      setNewTaskInfo(prev => ({ ...prev, endHour: hour }));
    }
  };

  useEffect(() => {
    const handleMouseUpGlobal = () => {
      if (newTaskInfo.isCreating) {
        setShowNewTaskPopup(true);
      }
    };
    window.addEventListener('mouseup', handleMouseUpGlobal);
    return () => {
      window.removeEventListener('mouseup', handleMouseUpGlobal);
    };
  }, [newTaskInfo]);

  return (
    <div className="flex h-screen bg-white text-gray-800 font-sans">
      {/* サイドバー形式のタスクプール */}
      {showTaskPool && taskPoolMode === 'sidebar' && (
        <div 
          className="flex-shrink-0 border-r bg-gray-50 flex flex-col"
          style={{ width: `${sidebarWidth}px` }}
        >
          <div className="flex items-center justify-between p-4 border-b bg-white">
            <h2 className="text-lg font-semibold">タスクプール</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setTaskPoolMode('popup')}
                className="p-1 rounded-full hover:bg-gray-100"
                title="ポップアップモードに切り替え"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
              <button 
                onClick={() => setShowTaskPool(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
          
          {/* タスク統計 */}
          {showTaskStats && (
            <div className="p-3 bg-white border-b">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-center p-2 bg-blue-50 rounded">
                  <div className="font-semibold text-blue-600">{taskStats.total}</div>
                  <div className="text-gray-600">総タスク</div>
                </div>
                <div className="text-center p-2 bg-green-50 rounded">
                  <div className="font-semibold text-green-600">{taskStats.completed}</div>
                  <div className="text-gray-600">完了</div>
                </div>
                <div className="text-center p-2 bg-purple-50 rounded">
                  <div className="font-semibold text-purple-600">{taskStats.scheduled}</div>
                  <div className="text-gray-600">スケジュール済</div>
                </div>
                <div className="text-center p-2 bg-orange-50 rounded">
                  <div className="font-semibold text-orange-600">{taskStats.unscheduled}</div>
                  <div className="text-gray-600">未スケジュール</div>
                </div>
              </div>
              <div className="mt-2 text-center">
                <div className="text-sm font-semibold">進捗率: {taskStats.completionRate}%</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${taskStats.completionRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          
          {/* 自動スケジューリング */}
          <div className="p-3 border-b bg-white">
            <button
              onClick={handleAutoSchedule}
              className="w-full bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 text-sm"
              disabled={taskStats.unscheduled === 0}
            >
              🤖 自動スケジュール ({taskStats.unscheduled}件)
            </button>
          </div>
          
          <div className="flex-1 overflow-auto">
            <DailyTaskPool
              dailyTasks={dailyTaskPool}
              onTasksUpdate={onTaskUpdate || (() => {})}
              onTaskDragStart={handleTaskDragStart}
              selectedDate={selectedDate}
              overdueTasks={overdueTasks}
              draggingTaskId={draggingTaskId}
            />
          </div>
        </div>
      )}
      
      {/* メインカレンダーエリア */}
      <div className="flex flex-col flex-1">
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
            
            {/* タスク統計表示（ヘッダー内） */}
            {!showTaskPool && showTaskStats && (
              <div className="flex items-center space-x-2 text-xs">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  📋 {taskStats.total}
                </span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                  ✅ {taskStats.completed}
                </span>
                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                  ⏱️ {taskStats.unscheduled}
                </span>
              </div>
            )}
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
        <div ref={scrollContainerRef} className="flex-1 overflow-auto">
          <div className="grid grid-cols-[72px_1fr]">
            
            {/* --- 左列：時間軸 --- */}
            <div>
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
                  {weekDays.map((date) => {
                    const cellKey = `${date.toDateString()}-allday`;
                    const isDragOver = dragOverCell === cellKey;
                    
                    return (
                      <div 
                        key={date.toISOString()} 
                        className={`border-b border-r last:border-r-0 p-1 min-h-[40px] transition-colors ${
                          isDragOver ? 'bg-blue-100 border-blue-300' : ''
                        }`}
                        onDrop={(e) => handleDrop(e, date, null, true)}
                        onDragOver={(e) => handleDragOver(e, date, null, true)}
                        onDragLeave={(e) => handleDragLeave(e, date, null, true)}
                      >
                        {(tasksByDateAndHour[date.toDateString()]?.allDay || []).map(task => (
                          <div 
                            key={task.id} 
                            className="bg-green-100 text-green-800 text-xs p-1 rounded truncate mb-1 cursor-move"
                            draggable
                            onDragStart={(e) => handleScheduledTaskDragStart(e, task)}
                          >
                            {task.title}
                          </div>
                        ))}
                        {isDragOver && (
                          <div className="absolute inset-0 bg-blue-200 bg-opacity-30 border-2 border-blue-400 border-dashed rounded pointer-events-none">
                            <div className="flex items-center justify-center h-full text-blue-600 text-xs font-semibold">
                              ここにドロップ
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                            className="absolute w-full p-1 z-10 group" 
                            style={{ top: `${parseInt(hour) * 56}px`, height: `${(task.duration || 1) * 56}px` }}
                            onMouseEnter={() => setHoveredTask(task.id)}
                            onMouseLeave={() => setHoveredTask(null)}
                          >
                            <div 
                              className="bg-blue-200 text-blue-900 h-full rounded-lg p-2 text-xs overflow-hidden relative cursor-move hover:bg-blue-300 transition-colors"
                              draggable
                              onDragStart={(e) => handleScheduledTaskDragStart(e, task)}
                            >
                              {/* 上部リサイズハンドル */}
                              <div
                                className={`absolute top-0 left-0 right-0 h-2 cursor-n-resize bg-blue-400 rounded-t-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center ${
                                  hoveredTask === task.id ? 'opacity-100' : ''
                                }`}
                                onMouseDown={(e) => handleResizeStart(e, task, 'top')}
                                onTouchStart={(e) => handleResizeStart(e, task, 'top')}
                              >
                                <GripVertical className="w-3 h-3 text-white" />
                              </div>
                              
                              {/* タスク内容 */}
                              <div className="pt-2 pb-2">
                                <p className="font-bold truncate">{task.title}</p>
                                <p className="text-[10px] opacity-80">
                                  {String(task.scheduledHour || 0).padStart(2, '0')}:00 - {String((task.scheduledHour || 0) + (task.duration || 1)).padStart(2, '0')}:00
                                </p>
                              </div>
                              
                              {/* 下部リサイズハンドル */}
                              <div
                                className={`absolute bottom-0 left-0 right-0 h-2 cursor-s-resize bg-blue-400 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center ${
                                  hoveredTask === task.id ? 'opacity-100' : ''
                                }`}
                                onMouseDown={(e) => handleResizeStart(e, task, 'bottom')}
                                onTouchStart={(e) => handleResizeStart(e, task, 'bottom')}
                              >
                                <GripVertical className="w-3 h-3 text-white" />
                              </div>
                              
                              {/* 移動ハンドル */}
                              <div className={`absolute top-1/2 left-1 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity ${
                                  hoveredTask === task.id ? 'opacity-100' : ''
                                }`}>
                                <Move className="w-3 h-3 text-blue-600" />
                              </div>
                            </div>
                          </div>
                        ));
                      })}
                      {hours.map(hour => {
                        const cellKey = `${date.toDateString()}-${hour}`;
                        const isDragOver = dragOverCell === cellKey;
                        
                        return (
                          <div 
                            key={hour} 
                            className={`h-14 relative transition-colors ${
                              isDragOver ? 'bg-blue-100' : ''
                            }`} 
                            onDrop={(e) => handleDrop(e, date, hour)} 
                            onDragOver={(e) => handleDragOver(e, date, hour)}
                            onDragLeave={(e) => handleDragLeave(e, date, hour)}
                            onTouchStart={(e) => handleCellTouchStart(e, date, hour)}
                            onTouchMove={(e) => handleCellTouchMove(e, date, hour)}
                            onTouchEnd={handleCellTouchEnd}
                            onMouseDown={(e) => handleCellMouseDown(e, date, hour)}
                            onMouseMove={(e) => handleCellMouseMove(e, date, hour)}
                          >
                            {isDragOver && (
                              <div className="absolute inset-0 bg-blue-200 bg-opacity-30 border-2 border-blue-400 border-dashed rounded pointer-events-none">
                                <div className="flex items-center justify-center h-full text-blue-600 text-xs font-semibold">
                                  {String(hour).padStart(2, '0')}:00
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {newTaskInfo.isCreating && newTaskInfo.date.toDateString() === date.toDateString() && (
                          <div 
                              className="absolute w-full bg-blue-200 bg-opacity-50 border-2 border-blue-500 rounded-lg pointer-events-none"
                              style={{
                                  top: `${Math.min(newTaskInfo.startHour, newTaskInfo.endHour) * 56}px`,
                                  height: `${(Math.abs(newTaskInfo.endHour - newTaskInfo.startHour) + 1) * 56}px`,
                                  zIndex: 20,
                              }}
                          ></div>
                      )}
                    </div>
                  ))}
                </div>

                {weekDays.some(day => day.toDateString() === todayDateString) && <TimeIndicator />}
              </div>
            </div>
          </div>
        </div>
        
        {/* フローティングアクションボタン */}
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-30">
          <button 
            className="w-12 h-12 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center shadow-lg transition-colors"
            onClick={() => {
              if (showTaskPool && taskPoolMode === 'sidebar') {
                setShowTaskPool(false);
              } else {
                setShowTaskPool(true);
                setTaskPoolMode('sidebar');
              }
            }}
            title={showTaskPool && taskPoolMode === 'sidebar' ? 'タスクプールを閉じる' : 'タスクプール（サイドバー）'}
          >
            <Calendar className="w-6 h-6 text-white" />
          </button>
          <button 
            className="w-10 h-10 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center shadow-lg transition-colors"
            onClick={() => {
              setShowTaskPool(true);
              setTaskPoolMode('popup');
            }}
            title="タスクプール（ポップアップ）"
          >
            <Plus className="w-4 h-4 text-white" />
          </button>
          <button 
            className="w-8 h-8 bg-orange-600 hover:bg-orange-700 rounded-full flex items-center justify-center shadow-lg transition-colors"
            onClick={handleAutoSchedule}
            title="自動スケジュール"
            disabled={taskStats.unscheduled === 0}
          >
            <span className="text-white text-xs">🤖</span>
          </button>
        </div>
      </div>

      {/* ポップアップ形式のタスクプール */}
      {showTaskPool && taskPoolMode === 'popup' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">タスクプール</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setTaskPoolMode('sidebar')}
                  className="p-1 rounded-full hover:bg-gray-100"
                  title="サイドバーモードに切り替え"
                >
                  <Move className="w-4 h-4 text-gray-600" />
                </button>
                <button onClick={() => setShowTaskPool(false)} className="p-2 rounded-full hover:bg-gray-100">
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <DailyTaskPool
                dailyTasks={dailyTaskPool}
                onTasksUpdate={onTaskUpdate || (() => {})}
                onTaskDragStart={handleTaskDragStart}
                selectedDate={selectedDate}
                overdueTasks={overdueTasks}
                draggingTaskId={draggingTaskId}
              />
            </div>
          </div>
        </div>
      )}
      {showNewTaskPopup && (
        <NewTaskPopup 
            taskInfo={newTaskInfo}
            onCancel={() => {
                setShowNewTaskPopup(false);
                setNewTaskInfo({ date: null, startHour: null, endHour: null, isCreating: false });
            }}
            onSave={(newTaskData) => {
                const newTask = {
                    id: Date.now().toString(),
                    ...newTaskData,
                };
                
                const newScheduledTasks = [...(scheduledTasks || []), newTask];
                setScheduledTasks(newScheduledTasks);
                if (onScheduledTaskUpdate) {
                    onScheduledTaskUpdate(newScheduledTasks);
                }

                setShowNewTaskPopup(false);
                setNewTaskInfo({ date: null, startHour: null, endHour: null, isCreating: false });
            }}
        />
      )}
    </div>
  );
};

export default ImprovedDailyPlanner;