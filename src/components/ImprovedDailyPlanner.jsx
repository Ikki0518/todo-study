import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ChevronDown, 
  Plus,
  Calendar,
  X,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Sparkles // Gemini API機能用のアイコン
} from 'lucide-react';

// === ★★★ タイムゾーン問題を解決するためのヘルパー関数です ★★★ ===
const toYYYYMMDD = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// === ★★★ Gemini API 機能を追加した DailyTaskPool コンポーネントです ★★★ ===
const DailyTaskPool = ({
  dailyTasks = [],
  overdueTasks = [],
  onTaskDragStart,
  draggingTaskId,
  onTasksUpdate // タスクリストを更新するための関数
}) => {
  const [breakingDownTaskId, setBreakingDownTaskId] = useState(null);

  const handleBreakdownTask = async (taskToBreakdown) => {
    setBreakingDownTaskId(taskToBreakdown.id);
    try {
      const prompt = `以下のタスクを、実行可能な具体的なサブタスクに分割してください： 「${taskToBreakdown.title}」。結果は「subtasks」というキーを持つJSONオブジェクトで、値はサブタスク名の文字列の配列にしてください。`;
      
      const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
      const payload = {
        contents: chatHistory,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              "subtasks": {
                "type": "ARRAY",
                "items": { "type": "STRING" }
              }
            },
          }
        }
      };

      const apiKey = ""; // APIキーは不要です
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.candidates && result.candidates[0].content && result.candidates[0].content.parts[0]) {
        const jsonText = result.candidates[0].content.parts[0].text;
        const parsedJson = JSON.parse(jsonText);
        const subtasks = parsedJson.subtasks || [];

        const newTasks = subtasks.map(subtaskTitle => ({
          id: Date.now().toString() + Math.random(), // ユニークなIDを生成
          title: subtaskTitle,
          // 元のタスクの他のプロパティを継承することもできます
        }));

        // 元のタスクを削除し、新しいサブタスクを追加
        const updatedTasks = dailyTasks.filter(t => t.id !== taskToBreakdown.id);
        onTasksUpdate([...updatedTasks, ...newTasks]);
      } else {
        console.error("No valid content received from Gemini API");
      }

    } catch (error) {
      console.error("Error breaking down task:", error);
      // ここでユーザーにエラーを通知するUIを表示することもできます
    } finally {
      setBreakingDownTaskId(null);
    }
  };

  return (
    <div>
      {overdueTasks.length > 0 && (
        <div className="mb-4">
          <h3 className="font-bold text-red-600 mb-2">期限切れのタスク</h3>
          {overdueTasks.map(task => (
            <div
              key={task.id}
              draggable
              onDragStart={(e) => onTaskDragStart(e, task)}
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
            onDragStart={(e) => onTaskDragStart(e, task)}
            className={`p-2 mb-2 rounded border-l-4 ${draggingTaskId === task.id ? 'opacity-50' : ''} border-blue-500 bg-blue-50 cursor-grab flex justify-between items-center`}
          >
            <p className="font-semibold">{task.title}</p>
            <button 
              onClick={() => handleBreakdownTask(task)} 
              className="p-1 hover:bg-blue-200 rounded-full disabled:opacity-50"
              disabled={breakingDownTaskId === task.id}
              title="タスクを自動分割する ✨"
            >
              {breakingDownTaskId === task.id ? (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Sparkles className="w-4 h-4 text-blue-500" />
              )}
            </button>
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

// NewTaskPopupコンポーネント
const NewTaskPopup = ({ taskInfo, onSave, onCancel }) => {
    const [title, setTitle] = useState('');
    
    if (!taskInfo || taskInfo.startHour === null) return null;

    const start = Math.min(taskInfo.startHour, taskInfo.endHour);
    const end = Math.max(taskInfo.startHour, taskInfo.endHour) + 1;

    const handleSave = () => {
        if (title.trim()) {
            onSave({
                title: title,
                // === ★★★ タイムゾーン問題を解決 ★★★ ===
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
  const [showTaskPool, setShowTaskPool] = useState(false);
  const scrollContainerRef = useRef(null);
  
  const [scheduledTasks, setScheduledTasks] = useState(initialScheduledTasks);

  const [newTaskInfo, setNewTaskInfo] = useState({ date: null, startHour: null, endHour: null, isCreating: false });
  const [showNewTaskPopup, setShowNewTaskPopup] = useState(false);
  const longPressTimer = useRef(null);
  
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

  const handleTaskDragStart = (e, task) => {
    setDraggingTask(task);
    setDraggingTaskId(task.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify(task));
  };
  const handleDrop = (e, targetDate, targetHour, isAllDay = false) => {
    e.preventDefault();
    if (!draggingTask) return;
    const scheduledTask = {
      ...draggingTask,
      // === ★★★ タイムゾーン問題を解決 ★★★ ===
      scheduledDate: toYYYYMMDD(targetDate),
      scheduledHour: isAllDay ? undefined : targetHour,
      allDay: isAllDay,
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
    
    if (onTaskUpdate) {
        const updatedTasks = dailyTaskPool.filter(task => task.id !== draggingTask.id);
        onTaskUpdate(updatedTasks);
    }
    setDraggingTask(null);
    setDraggingTaskId(null);
  };
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
    <div className="flex flex-col h-screen bg-white text-gray-800 font-sans">
      
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
      <div ref={scrollContainerRef} className="flex-1 overflow-auto">
        <div className="grid grid-cols-[64px_1fr]">
          
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
                        <div key={task.id} className="absolute inset-x-0 z-10 p-1" style={{ top: `${parseInt(hour) * 56}px`, height: `${(task.duration || 1) * 56}px` }}>
                          <div className="bg-blue-200 text-blue-900 h-full rounded-lg p-2 text-xs overflow-hidden">
                            <p className="font-bold">{task.title}</p>
                          </div>
                        </div>
                      ));
                    })}
                    {hours.map(hour => (
                      <div 
                        key={hour} 
                        className="h-14" 
                        onDrop={(e) => handleDrop(e, date, hour)} 
                        onDragOver={(e) => e.preventDefault()}
                        onTouchStart={(e) => handleCellTouchStart(e, date, hour)}
                        onTouchMove={(e) => handleCellTouchMove(e, date, hour)}
                        onTouchEnd={handleCellTouchEnd}
                        onMouseDown={(e) => handleCellMouseDown(e, date, hour)}
                        onMouseMove={(e) => handleCellMouseMove(e, date, hour)}
                      ></div>
                    ))}
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
            </div>
          </div>
        </div>
      </div>
      
      {/* フローティングアクションボタン */}
      <div className="fixed bottom-24 right-6 flex flex-col gap-3 z-30">
        <button
          className="w-12 h-12 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center shadow-lg transition-colors"
          onClick={() => setShowTaskPool(true)}
          title="タスクプール表示"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </button>
        <button
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-lg transition-colors"
          title="新規タスク追加"
        >
          <Plus className="w-6 h-6 text-white" />
        </button>
      </div>


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

      {/* タスクプールモーダル */}
      {showTaskPool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">タスクプール</h2>
              <button
                onClick={() => setShowTaskPool(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <DailyTaskPool
                dailyTasks={dailyTaskPool}
                overdueTasks={overdueTasks}
                onTaskDragStart={handleTaskDragStart}
                draggingTaskId={draggingTaskId}
                onTasksUpdate={onTaskUpdate}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImprovedDailyPlanner;