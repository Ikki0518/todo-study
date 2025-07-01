import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.serverUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
  }

  // Socket.IO接続を初期化
  connect(token) {
    if (this.socket) {
      this.disconnect();
    }

    this.socket = io(this.serverUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
    return this.socket;
  }

  // 基本的なイベントハンドラーを設定
  setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.isConnected = true;
      this.emit('connection_status', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
      this.emit('connection_status', { connected: false, reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.emit('connection_error', error);
    });

    // タスク関連イベント
    this.socket.on('task_updated', (data) => {
      console.log('Task updated:', data);
      this.emit('task_updated', data);
    });

    this.socket.on('task_created', (data) => {
      console.log('Task created:', data);
      this.emit('task_created', data);
    });

    this.socket.on('task_deleted', (data) => {
      console.log('Task deleted:', data);
      this.emit('task_deleted', data);
    });

    // コメント関連イベント
    this.socket.on('comment_received', (data) => {
      console.log('Comment received:', data);
      this.emit('comment_received', data);
    });

    this.socket.on('comment_added', (data) => {
      console.log('Comment added:', data);
      this.emit('comment_added', data);
    });

    this.socket.on('comment_updated', (data) => {
      console.log('Comment updated:', data);
      this.emit('comment_updated', data);
    });

    this.socket.on('comment_deleted', (data) => {
      console.log('Comment deleted:', data);
      this.emit('comment_deleted', data);
    });

    // 通知関連イベント
    this.socket.on('notification_received', (data) => {
      console.log('Notification received:', data);
      this.emit('notification_received', data);
    });

    // プランナー更新イベント
    this.socket.on('planner_updated', (data) => {
      console.log('Planner updated:', data);
      this.emit('planner_updated', data);
    });

    // エラーハンドリング
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.emit('socket_error', error);
    });
  }

  // Socket.IO接続を切断
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  // イベントリスナーを追加
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // イベントリスナーを削除
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
      if (callbacks.length === 0) {
        this.listeners.delete(event);
      }
    }
  }

  // イベントを発火
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in socket listener:', error);
        }
      });
    }
  }

  // 講師が生徒のルームに参加
  joinStudentRoom(studentId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_room', studentId);
    }
  }

  // 講師が生徒のルームから退出
  leaveStudentRoom(studentId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_room', studentId);
    }
  }

  // タスク更新をサーバーに送信
  updateTask(taskId, updates) {
    if (this.socket && this.isConnected) {
      this.socket.emit('update_task', { taskId, updates });
    }
  }

  // コメント送信をサーバーに送信
  sendComment(taskId, studentId, content) {
    if (this.socket && this.isConnected) {
      this.socket.emit('send_comment', { taskId, studentId, content });
    }
  }

  // 接続状態を確認
  isSocketConnected() {
    return this.isConnected && this.socket && this.socket.connected;
  }

  // 再接続を試行
  reconnect() {
    if (this.socket) {
      this.socket.connect();
    }
  }

  // Socket.IOインスタンスを取得（高度な操作用）
  getSocket() {
    return this.socket;
  }
}

export default new SocketService();