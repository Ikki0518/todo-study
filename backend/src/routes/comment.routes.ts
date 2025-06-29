import { Router, Request, Response } from 'express';
import { CommentService } from '../services/commentService';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

// 型定義
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

// タスクのコメント一覧を取得
router.get('/task/:taskId', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    
    const comments = await CommentService.getCommentsByTask(taskId);
    
    const response: ApiResponse<typeof comments> = {
      success: true,
      data: comments
    };
    
    res.json(response);
  } catch (error) {
    logger.error('Failed to get task comments:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get comments' }
    });
  }
});

// 生徒のコメント一覧を取得
router.get('/student/:studentId', async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { limit } = req.query;
    const { userId, userRole } = req.body.user;

    // 権限チェック: 生徒本人または担当講師のみ
    if (userRole === 'STUDENT' && userId !== studentId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      });
    }

    const comments = await CommentService.getCommentsByStudent(
      studentId,
      limit ? parseInt(limit as string) : undefined
    );
    
    const response: ApiResponse<typeof comments> = {
      success: true,
      data: comments
    };
    
    res.json(response);
  } catch (error) {
    logger.error('Failed to get student comments:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get comments' }
    });
  }
});

// コメントを作成（講師のみ）
router.post('/', async (req: Request, res: Response) => {
  try {
    const { taskId, studentId, content } = req.body;
    const { userId, userRole } = req.body.user;

    // 権限チェック: 講師のみ
    if (userRole !== 'INSTRUCTOR') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only instructors can create comments' }
      });
    }

    const comment = await CommentService.createComment({
      taskId,
      instructorId: userId,
      studentId,
      content
    });
    
    const response: ApiResponse<typeof comment> = {
      success: true,
      data: comment
    };
    
    res.status(201).json(response);
  } catch (error) {
    logger.error('Failed to create comment:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create comment' }
    });
  }
});

// コメントを更新
router.put('/:commentId', async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const { userId } = req.body.user;

    const comment = await CommentService.updateComment(commentId, content, userId);
    
    const response: ApiResponse<typeof comment> = {
      success: true,
      data: comment
    };
    
    res.json(response);
  } catch (error: any) {
    logger.error('Failed to update comment:', error);
    
    if (error.message && error.message.includes('Permission denied')) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: error.message }
      });
    } else if (error.message && error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: error.message }
      });
    } else {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to update comment' }
      });
    }
  }
});

// コメントを削除
router.delete('/:commentId', async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const { userId } = req.body.user;

    await CommentService.deleteComment(commentId, userId);
    
    const response: ApiResponse<null> = {
      success: true,
      data: null
    };
    
    res.json(response);
  } catch (error: any) {
    logger.error('Failed to delete comment:', error);
    
    if (error.message && error.message.includes('Permission denied')) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: error.message }
      });
    } else if (error.message && error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: error.message }
      });
    } else {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to delete comment' }
      });
    }
  }
});

// 講師のコメント統計を取得
router.get('/stats/:instructorId', async (req: Request, res: Response) => {
  try {
    const { instructorId } = req.params;
    const { period } = req.query;
    const { userId, userRole } = req.body.user;

    // 権限チェック: 講師本人のみ
    if (userRole !== 'INSTRUCTOR' || userId !== instructorId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      });
    }

    const stats = await CommentService.getCommentStats(instructorId, period as string);
    
    const response: ApiResponse<typeof stats> = {
      success: true,
      data: stats
    };
    
    res.json(response);
  } catch (error) {
    logger.error('Failed to get comment stats:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get comment stats' }
    });
  }
});

export { router as commentRoutes };