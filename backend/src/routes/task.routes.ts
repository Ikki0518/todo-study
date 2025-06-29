import { Router, Request, Response } from 'express';
import { TaskService } from '../services/taskService';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

// 型定義（一時的に直接定義）
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

const router = Router();

// 認証ミドルウェアを適用
router.use(authenticate);

// 生徒のタスク一覧を取得
router.get('/student/:studentId', async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { date } = req.query;
    const { userId, userRole } = req.body.user;

    // 権限チェック: 生徒本人または担当講師のみ
    if (userRole === 'STUDENT' && userId !== studentId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      });
    }

    if (userRole === 'INSTRUCTOR') {
      // 講師の場合、担当生徒かどうかチェック（実際のチェックは省略）
    }

    const tasks = await TaskService.getTasksByStudent(studentId, date as string);
    
    const response: ApiResponse<typeof tasks> = {
      success: true,
      data: tasks
    };
    
    res.json(response);
  } catch (error) {
    logger.error('Failed to get student tasks:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get tasks' }
    });
  }
});

// 講師の担当生徒タスクを取得
router.get('/instructor/:instructorId', async (req: Request, res: Response) => {
  try {
    const { instructorId } = req.params;
    const { studentId, date } = req.query;
    const { userId, userRole } = req.body.user;

    // 権限チェック: 講師本人のみ
    if (userRole !== 'INSTRUCTOR' || userId !== instructorId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      });
    }

    const tasks = await TaskService.getTasksByInstructor(
      instructorId,
      studentId as string,
      date as string
    );
    
    const response: ApiResponse<typeof tasks> = {
      success: true,
      data: tasks
    };
    
    res.json(response);
  } catch (error) {
    logger.error('Failed to get instructor tasks:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get tasks' }
    });
  }
});

// タスクを作成
router.post('/', async (req: Request, res: Response) => {
  try {
    const taskData = req.body.taskData;
    const { userId, userRole } = req.body.user;

    // 権限チェック
    if (userRole === 'STUDENT' && taskData.studentId !== userId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      });
    }

    const task = await TaskService.createTask(taskData);
    
    const response: ApiResponse<typeof task> = {
      success: true,
      data: task
    };
    
    res.status(201).json(response);
  } catch (error) {
    logger.error('Failed to create task:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create task' }
    });
  }
});

// タスクを更新
router.put('/:taskId', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { updates } = req.body;
    const { userId } = req.body.user;

    const task = await TaskService.updateTask(taskId, updates, userId);
    
    const response: ApiResponse<typeof task> = {
      success: true,
      data: task
    };
    
    res.json(response);
  } catch (error) {
    logger.error('Failed to update task:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update task' }
    });
  }
});

// タスクを削除
router.delete('/:taskId', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { userId } = req.body.user;

    await TaskService.deleteTask(taskId, userId);
    
    const response: ApiResponse<null> = {
      success: true,
      data: null
    };
    
    res.json(response);
  } catch (error) {
    logger.error('Failed to delete task:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete task' }
    });
  }
});

// 未達成タスクを取得
router.get('/overdue/:studentId', async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { userId, userRole } = req.body.user;

    // 権限チェック
    if (userRole === 'STUDENT' && userId !== studentId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      });
    }

    const tasks = await TaskService.getOverdueTasks(studentId);
    
    const response: ApiResponse<typeof tasks> = {
      success: true,
      data: tasks
    };
    
    res.json(response);
  } catch (error) {
    logger.error('Failed to get overdue tasks:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get overdue tasks' }
    });
  }
});

// タスク統計を取得
router.get('/stats/:studentId', async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { date } = req.query;
    const { userId, userRole } = req.body.user;

    // 権限チェック
    if (userRole === 'STUDENT' && userId !== studentId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      });
    }

    const stats = await TaskService.getTaskStats(studentId, date as string);
    
    const response: ApiResponse<typeof stats> = {
      success: true,
      data: stats
    };
    
    res.json(response);
  } catch (error) {
    logger.error('Failed to get task stats:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get task stats' }
    });
  }
});

export { router as taskRoutes };