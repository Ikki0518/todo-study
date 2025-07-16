import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronDown, ChevronUp, X, Calendar, Clock, Tag } from 'lucide-react';

const TaskPoolManager = ({ tasks = [], onTaskSelect, onTaskUpdate, isMobile, onDragStart, onDragEnd }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt'); // createdAt, dueDate, priority, subject
  const [filterBy, setFilterBy] = useState('all'); // all, pending, completed, today, thisWeek
  const [expandedSections, setExpandedSections] = useState({
    search: true,
    filters: true,
    tasks: true
  });
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [draggingTask, setDraggingTask] = useState(null);

  // サンプルタスクデータ（実際のデータがない場合のデフォルト）
  const defaultTasks = [
    {
      id: '1',
      title: '数学の宿題',
      subject: '数学',
      description: '教科書p.45-50の問題を解く',
      dueDate: new Date().toISOString(),
      priority: 'high',
      status: 'pending',
      estimatedTime: 60,
      color: '#ef4444'
    },
    {
      id: '2',
      title: '英語の単語暗記',
      subject: '英語',
      description: '単語帳の50-100番を覚える',
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      priority: 'medium',
      status: 'pending',
      estimatedTime: 30,
      color: '#eab308'
    },
    {
      id: '3',
      title: '理科の実験レポート',
      subject: '理科',
      description: '実験結果をまとめる',
      dueDate: new Date(Date.now() + 172800000).toISOString(),
      priority: 'low',
      status: 'pending',
      estimatedTime: 90,
      color: '#22c55e'
    },
    {
      id: '4',
      title: '歴史の年表作成',
      subject: '歴史',
      description: '江戸時代の年表を作成',
      dueDate: new Date(Date.now() + 259200000).toISOString(),
      priority: 'medium',
      status: 'completed',
      estimatedTime: 45,
      color: '#3b82f6'
    }
  ];

  const allTasks = tasks.length > 0 ? tasks : defaultTasks;

  // 科目リストを取得
  const subjects = [...new Set(allTasks.map(task => task.subject))];

  // フィルタリング処理
  const filteredTasks = allTasks.filter(task => {
    // 検索フィルター
    if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !task.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // ステータスフィルター
    if (filterBy === 'pending' && task.status !== 'pending') return false;
    if (filterBy === 'completed' && task.status !== 'completed') return false;
    
    // 日付フィルター
    if (filterBy === 'today') {
      const today = new Date();
      const taskDate = new Date(task.dueDate);
      if (taskDate.toDateString() !== today.toDateString()) return false;
    }
    
    if (filterBy === 'thisWeek') {
      const today = new Date();
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() + 7);
      const taskDate = new Date(task.dueDate);
      if (taskDate > weekEnd) return false;
    }

    // 科目フィルター
    if (selectedSubjects.length > 0 && !selectedSubjects.includes(task.subject)) {
      return false;
    }

    return true;
  });

  // ソート処理
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sortBy) {
      case 'dueDate':
        return new Date(a.dueDate) - new Date(b.dueDate);
      case 'priority':
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      case 'subject':
        return a.subject.localeCompare(b.subject);
      case 'createdAt':
      default:
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleSubjectFilter = (subject) => {
    setSelectedSubjects(prev => 
      prev.includes(subject) 
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return '今日';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return '明日';
    } else {
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      high: '高',
      medium: '中',
      low: '低'
    };
    return labels[priority] || priority;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'text-red-600 bg-red-50',
      medium: 'text-yellow-600 bg-yellow-50',
      low: 'text-green-600 bg-green-50'
    };
    return colors[priority] || 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b px-4 py-3">
        <h2 className="text-lg font-semibold text-gray-800">タスクプール</h2>
        <p className="text-sm text-gray-600 mt-1">
          全{allTasks.length}件 / 表示中{sortedTasks.length}件
        </p>
      </div>

      {/* 検索セクション */}
      <div className="bg-white border-b">
        <button
          onClick={() => toggleSection('search')}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            <span className="font-medium">検索</span>
          </span>
          {expandedSections.search ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {expandedSections.search && (
          <div className="px-4 pb-3">
            <div className="relative">
              <input
                type="text"
                placeholder="タスク名や説明で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* フィルター・ソートセクション */}
      <div className="bg-white border-b">
        <button
          onClick={() => toggleSection('filters')}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <span className="font-medium">フィルター・並び替え</span>
          </span>
          {expandedSections.filters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {expandedSections.filters && (
          <div className="px-4 pb-3 space-y-3">
            {/* ステータスフィルター */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">ステータス</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: 'すべて' },
                  { value: 'pending', label: '未完了' },
                  { value: 'completed', label: '完了済み' },
                  { value: 'today', label: '今日' },
                  { value: 'thisWeek', label: '今週' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setFilterBy(option.value)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      filterBy === option.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 科目フィルター */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">科目</label>
              <div className="flex flex-wrap gap-2">
                {subjects.map(subject => (
                  <button
                    key={subject}
                    onClick={() => toggleSubjectFilter(subject)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      selectedSubjects.includes(subject)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>

            {/* ソート */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">並び替え</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="createdAt">作成日時</option>
                <option value="dueDate">期限日</option>
                <option value="priority">優先度</option>
                <option value="subject">科目</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* タスクリスト */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {sortedTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>該当するタスクがありません</p>
            </div>
          ) : (
            sortedTasks.map(task => (
              <div
                key={task.id}
                draggable={task.status !== 'completed'}
                onDragStart={(e) => {
                  if (task.status === 'completed') return;
                  
                  setDraggingTask(task);
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('task', JSON.stringify(task));
                  
                  // ドラッグ中のスタイル設定
                  e.currentTarget.style.opacity = '0.5';
                  
                  // カスタムドラッグイメージの作成
                  const dragImage = e.currentTarget.cloneNode(true);
                  dragImage.style.transform = 'rotate(2deg)';
                  dragImage.style.position = 'absolute';
                  dragImage.style.top = '-1000px';
                  dragImage.style.width = e.currentTarget.offsetWidth + 'px';
                  document.body.appendChild(dragImage);
                  e.dataTransfer.setDragImage(dragImage, e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                  setTimeout(() => document.body.removeChild(dragImage), 0);
                  
                  // 親コンポーネントに通知
                  if (onTaskSelect) {
                    onTaskSelect(task);
                  }
                }}
                onDragEnd={(e) => {
                  e.currentTarget.style.opacity = '1';
                  setDraggingTask(null);
                }}
                onClick={() => {
                  if (!draggingTask && onTaskSelect) {
                    onTaskSelect(task);
                  }
                }}
                className={`bg-white rounded-lg shadow-sm border p-4 cursor-move hover:shadow-md transition-all ${
                  task.status === 'completed' ? 'opacity-60 cursor-not-allowed' : ''
                } ${draggingTask?.id === task.id ? 'scale-105 shadow-lg' : ''}`}
                style={{ borderLeftWidth: '4px', borderLeftColor: task.color || '#6b7280' }}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className={`font-medium ${task.status === 'completed' ? 'line-through' : ''}`}>
                    {task.title}
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                    {getPriorityLabel(task.priority)}
                  </span>
                </div>
                
                {task.description && (
                  <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                )}
                
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {task.subject}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(task.dueDate)}
                  </span>
                  {task.estimatedTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {task.estimatedTime}分
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskPoolManager;