import { Router, Request, Response } from 'express';
import { aiService } from '../services/aiService';
import { 
  AIPersonalizeRequest, 
  AICompanionRequest, 
  ApiResponse, 
  AIResponse 
} from '../../../shared/src/types';
import { logger } from '../utils/logger';

const router = Router();

/**
 * パーソナライズモード - 学習計画の設計図作成
 * POST /api/ai/personalize
 */
router.post('/personalize', async (req: Request, res: Response) => {
  try {
    const request: AIPersonalizeRequest = req.body;
    
    // バリデーション
    if (!request.studentId || !request.message) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'studentId and message are required'
        }
      } as ApiResponse<never>);
    }

    const response = await aiService.processPersonalizeMode(request);
    
    res.json({
      success: true,
      data: response
    } as ApiResponse<AIResponse>);

  } catch (error) {
    logger.error('Error in personalize endpoint:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to process personalize request'
      }
    } as ApiResponse<never>);
  }
});

/**
 * 伴走モード - 日々の学習サポート
 * POST /api/ai/companion
 */
router.post('/companion', async (req: Request, res: Response) => {
  try {
    const request: AICompanionRequest = req.body;
    
    // バリデーション
    if (!request.studentId || !request.message || !request.knowledge) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'studentId, message, and knowledge are required'
        }
      } as ApiResponse<never>);
    }

    const response = await aiService.processCompanionMode(request);
    
    res.json({
      success: true,
      data: response
    } as ApiResponse<AIResponse>);

  } catch (error) {
    logger.error('Error in companion endpoint:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to process companion request'
      }
    } as ApiResponse<never>);
  }
});

/**
 * セッション情報取得
 * GET /api/ai/session/:sessionId
 */
router.get('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    const session = aiService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: 'Session not found'
        }
      } as ApiResponse<never>);
    }

    const messages = aiService.getMessages(sessionId);
    
    res.json({
      success: true,
      data: {
        session,
        messages
      }
    } as ApiResponse<{session: any, messages: any[]}>);

  } catch (error) {
    logger.error('Error in session endpoint:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get session'
      }
    } as ApiResponse<never>);
  }
});

/**
 * 進捗更新（伴走モード用）
 * POST /api/ai/progress
 */
router.post('/progress', async (req: Request, res: Response) => {
  try {
    const { studentId, materialName, completedAmount, knowledge } = req.body;
    
    // バリデーション
    if (!studentId || !materialName || completedAmount === undefined || !knowledge) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'studentId, materialName, completedAmount, and knowledge are required'
        }
      } as ApiResponse<never>);
    }

    // 進捗を更新
    const updatedKnowledge = { ...knowledge };
    const material = updatedKnowledge.materials.find((m: any) => m.name === materialName);
    if (material) {
      material.current_progress = completedAmount;
    }

    // ストリーク日数の更新（全てのタスクが完了した場合）
    const allCompleted = updatedKnowledge.materials.every((m: any) => {
      const today = new Date();
      const deadline = new Date(updatedKnowledge.user_profile.goal.deadline);
      const remainingDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const remaining = m.total_amount - m.current_progress;
      const dailyAmount = Math.ceil(remaining / remainingDays);
      return remaining <= dailyAmount;
    });

    if (allCompleted) {
      if (!updatedKnowledge.session_data) {
        updatedKnowledge.session_data = { streak_days: 0 };
      }
      updatedKnowledge.session_data.streak_days += 1;
    }

    res.json({
      success: true,
      data: {
        knowledge: updatedKnowledge,
        message: allCompleted 
          ? `素晴らしい！お疲れ様でした！今日の努力をしっかり記録しておきますね。連続学習${updatedKnowledge.session_data?.streak_days}日目達成です！🎉`
          : `${materialName}の進捗を更新しました。この調子で頑張りましょう！`
      }
    } as ApiResponse<{knowledge: any, message: string}>);

  } catch (error) {
    logger.error('Error in progress endpoint:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update progress'
      }
    } as ApiResponse<never>);
  }
});

export { router as aiRoutes };