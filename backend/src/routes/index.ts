import { Express } from 'express';
import { authRoutes } from './auth.routes';
import { userRoutes } from './user.routes';
import { goalRoutes } from './goal.routes';
import { taskRoutes } from './task.routes';
import { commentRoutes } from './comment.routes';
import { notificationRoutes } from './notification.routes';
import { calendarRoutes } from './calendar.routes';
import { aiRoutes } from './aiRoutes';
import { authenticate } from '../middleware/auth';
import { requestLogger } from '../utils/logger';

export function setupRoutes(app: Express): void {
  // リクエストログミドルウェア
  app.use(requestLogger);
  
  // ヘルスチェックエンドポイント
  app.get('/health', (req, res) => {
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
      },
    });
  });
  
  // API バージョン
  const API_PREFIX = '/api/v1';
  
  // パブリックルート（認証不要）
  app.use(`${API_PREFIX}/auth`, authRoutes);
  
  // プライベートルート（認証必要）
  app.use(authenticate);
  app.use(`${API_PREFIX}/users`, userRoutes);
  app.use(`${API_PREFIX}/goals`, goalRoutes);
  app.use(`${API_PREFIX}/tasks`, taskRoutes);
  app.use(`${API_PREFIX}/comments`, commentRoutes);
  app.use(`${API_PREFIX}/notifications`, notificationRoutes);
  app.use(`${API_PREFIX}/calendar`, calendarRoutes);
  app.use(`${API_PREFIX}/ai`, aiRoutes);
  
  // 404ハンドラー
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource was not found',
      },
    });
  });
}