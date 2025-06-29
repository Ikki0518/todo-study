import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';

// Socket イベント定数
export enum SocketEvent {
  JOIN_ROOM = 'join_room',
  LEAVE_ROOM = 'leave_room',
  UPDATE_TASK = 'update_task',
  TASK_UPDATED = 'task_updated',
  SEND_COMMENT = 'send_comment',
  COMMENT_RECEIVED = 'comment_received',
}

// 簡易認証（後で適切な認証に置き換え）
function authenticateSocket(socket: Socket, next: any) {
  // 一時的に認証をスキップ
  socket.data.userId = 'temp-user-id';
  socket.data.userRole = 'INSTRUCTOR';
  next();
}

export function setupSocketHandlers(io: Server): void {
  // Socket.IO認証ミドルウェア
  io.use(authenticateSocket);
  
  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId;
    const userRole = socket.data.userRole;
    
    logger.info('Socket connected', {
      socketId: socket.id,
      userId,
      userRole,
    });
    
    // ユーザーを自分専用のルームに参加させる
    socket.join(`user:${userId}`);
    
    // 講師の場合、担当生徒のルームにも参加
    if (userRole === 'INSTRUCTOR') {
      socket.on(SocketEvent.JOIN_ROOM, (studentId: string) => {
        socket.join(`student:${studentId}`);
        logger.debug('Instructor joined student room', {
          instructorId: userId,
          studentId,
        });
      });
      
      socket.on(SocketEvent.LEAVE_ROOM, (studentId: string) => {
        socket.leave(`student:${studentId}`);
        logger.debug('Instructor left student room', {
          instructorId: userId,
          studentId,
        });
      });
    }
    
    // タスク更新イベント
    socket.on(SocketEvent.UPDATE_TASK, async (data: any) => {
      try {
        const { taskId, updates } = data;
        
        // タスク更新処理（実際の処理は別モジュールで実装）
        // const updatedTask = await updateTask(taskId, updates, userId);
        
        // 関連するユーザーに通知
        if (userRole === 'STUDENT') {
          // 生徒が更新した場合、講師にも通知
          io.to(`student:${userId}`).emit(SocketEvent.TASK_UPDATED, {
            taskId,
            updates,
            updatedBy: userId,
          });
        }
        
        // 更新者自身にも通知
        socket.emit(SocketEvent.TASK_UPDATED, {
          taskId,
          updates,
          updatedBy: userId,
        });
        
      } catch (error) {
        logger.error('Failed to update task via socket', error);
        socket.emit('error', {
          message: 'Failed to update task',
        });
      }
    });
    
    // コメント送信イベント（講師のみ）
    socket.on(SocketEvent.SEND_COMMENT, async (data: any) => {
      try {
        if (userRole !== 'INSTRUCTOR') {
          throw new Error('Only instructors can send comments');
        }
        
        const { taskId, studentId, content } = data;
        
        // コメント作成処理（実際の処理は別モジュールで実装）
        // const comment = await createComment({
        //   taskId,
        //   instructorId: userId,
        //   studentId,
        //   content,
        // });
        
        // 生徒に通知
        io.to(`user:${studentId}`).emit(SocketEvent.COMMENT_RECEIVED, {
          taskId,
          instructorId: userId,
          content,
          createdAt: new Date(),
        });
        
      } catch (error) {
        logger.error('Failed to send comment via socket', error);
        socket.emit('error', {
          message: 'Failed to send comment',
        });
      }
    });
    
    // 切断処理
    socket.on('disconnect', () => {
      logger.info('Socket disconnected', {
        socketId: socket.id,
        userId,
      });
    });
  });
}

// 特定のユーザーに通知を送信するヘルパー関数
export function notifyUser(io: Server, userId: string, event: string, data: any): void {
  io.to(`user:${userId}`).emit(event, data);
}

// 生徒の更新を監視している講師全員に通知するヘルパー関数
export function notifyStudentWatchers(io: Server, studentId: string, event: string, data: any): void {
  io.to(`student:${studentId}`).emit(event, data);
}