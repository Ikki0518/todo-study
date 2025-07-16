// ドラッグ＆ドロップとリサイズのユーティリティ関数

/**
 * マウスイベントとタッチイベントから座標を取得する共通関数
 * @param {MouseEvent|TouchEvent} event 
 * @returns {{x: number, y: number}}
 */
export function getEventCoordinates(event) {
  if (event.touches && event.touches.length > 0) {
    // タッチイベントの場合
    return {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY
    };
  } else if (event.changedTouches && event.changedTouches.length > 0) {
    // touchendイベントの場合
    return {
      x: event.changedTouches[0].clientX,
      y: event.changedTouches[0].clientY
    };
  } else {
    // マウスイベントの場合
    return {
      x: event.clientX,
      y: event.clientY
    };
  }
}

/**
 * ドラッグ開始時の共通処理
 * @param {HTMLElement} element ドラッグ対象の要素
 * @param {Object} options オプション設定
 */
export function startDrag(element, options = {}) {
  const {
    onMove,
    onEnd,
    zIndex = 1000,
    opacity = 0.8,
    cursor = 'grabbing',
    maintainSize = true
  } = options;

  // ドラッグ開始時の要素のサイズを保存
  const originalWidth = element.offsetWidth;
  const originalHeight = element.offsetHeight;

  // 要素のスタイルを設定
  element.style.zIndex = zIndex;
  element.style.opacity = opacity;
  element.style.cursor = cursor;
  element.style.userSelect = 'none';
  element.style.webkitUserSelect = 'none';
  
  // サイズを固定（オプションで制御可能）
  if (maintainSize) {
    element.style.width = `${originalWidth}px`;
    element.style.height = `${originalHeight}px`;
  }

  // ドラッグ中の処理
  const handleMove = (e) => {
    // スクロールを防止
    if (e.type.includes('touch')) {
      e.preventDefault();
    }
    
    const coords = getEventCoordinates(e);
    if (onMove) {
      onMove(coords, e);
    }
  };

  // ドラッグ終了の処理
  const handleEnd = (e) => {
    // 要素のスタイルをリセット
    element.style.zIndex = '';
    element.style.opacity = '';
    element.style.cursor = '';
    element.style.userSelect = '';
    element.style.webkitUserSelect = '';
    element.style.width = '';
    element.style.height = '';

    // イベントリスナーを削除
    document.removeEventListener('mousemove', handleMove);
    document.removeEventListener('mouseup', handleEnd);
    document.removeEventListener('touchmove', handleMove, { passive: false });
    document.removeEventListener('touchend', handleEnd);
    document.removeEventListener('touchcancel', handleEnd);

    const coords = getEventCoordinates(e);
    if (onEnd) {
      onEnd(coords, e);
    }
  };

  // イベントリスナーを登録
  document.addEventListener('mousemove', handleMove);
  document.addEventListener('mouseup', handleEnd);
  document.addEventListener('touchmove', handleMove, { passive: false });
  document.addEventListener('touchend', handleEnd);
  document.addEventListener('touchcancel', handleEnd);

  return {
    handleMove,
    handleEnd
  };
}

/**
 * タスクドラッグの初期化
 * @param {HTMLElement} taskElement タスク要素
 * @param {Object} handlers イベントハンドラー
 */
export function initializeTaskDrag(taskElement, handlers) {
  const {
    onDragStart,
    onDragMove,
    onDragEnd,
    onResizeStart,
    onResizeMove,
    onResizeEnd
  } = handlers;

  // ドラッグ開始のハンドラー
  const handleDragStart = (e) => {
    // リサイズハンドルの場合は除外
    if (e.target.closest('.resize-handle')) {
      return;
    }

    e.preventDefault();
    const coords = getEventCoordinates(e);
    
    if (onDragStart) {
      onDragStart(coords, e);
    }

    startDrag(taskElement, {
      onMove: onDragMove,
      onEnd: onDragEnd,
      cursor: 'grabbing'
    });
  };

  // リサイズ開始のハンドラー
  const handleResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const coords = getEventCoordinates(e);
    
    if (onResizeStart) {
      onResizeStart(coords, e);
    }

    startDrag(taskElement, {
      onMove: onResizeMove,
      onEnd: onResizeEnd,
      cursor: 'ns-resize',
      opacity: 1
    });
  };

  // タスク要素にイベントリスナーを登録
  taskElement.addEventListener('mousedown', handleDragStart);
  taskElement.addEventListener('touchstart', handleDragStart, { passive: false });

  // リサイズハンドルがある場合
  const resizeHandle = taskElement.querySelector('.resize-handle');
  if (resizeHandle) {
    resizeHandle.addEventListener('mousedown', handleResizeStart);
    resizeHandle.addEventListener('touchstart', handleResizeStart, { passive: false });
  }

  // クリーンアップ関数を返す
  return () => {
    taskElement.removeEventListener('mousedown', handleDragStart);
    taskElement.removeEventListener('touchstart', handleDragStart);
    
    if (resizeHandle) {
      resizeHandle.removeEventListener('mousedown', handleResizeStart);
      resizeHandle.removeEventListener('touchstart', handleResizeStart);
    }
  };
}