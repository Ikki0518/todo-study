import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';

// 環境変数の読み込み
dotenv.config();

// 設定とルーターのインポート
import { config } from './config';
import { logger } from './utils/logger';
import { setupDatabase } from './database';
import { setupRoutes } from './routes';
import { setupSocketHandlers } from './socket';
import { startScheduledJobs } from './jobs';

// Expressアプリケーションの初期化
const app = express();
const httpServer = createServer(app);

// Socket.IOサーバーの初期化
const io = new Server(httpServer, {
  cors: {
    origin: config.frontendUrl,
    credentials: true
  }
});

// ミドルウェアの設定
app.use(helmet());
app.use(cors({
  origin: config.frontendUrl,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静的ファイルの提供（アップロードされたファイルなど）
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ルートの設定
setupRoutes(app);

// Socket.IOハンドラーの設定
setupSocketHandlers(io);

// エラーハンドリング
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: config.isDevelopment ? err.message : 'Internal server error'
    }
  });
});

// サーバーの起動
async function startServer() {
  try {
    // データベースの接続
    await setupDatabase();
    logger.info('Database connected successfully');

    // スケジュールジョブの開始
    startScheduledJobs();
    logger.info('Scheduled jobs started');

    // HTTPサーバーの起動
    httpServer.listen(config.port, () => {
      logger.info(`Server is running on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`Frontend URL: ${config.frontendUrl}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// グレースフルシャットダウン
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// サーバーの起動
startServer();

// Socket.IOインスタンスをエクスポート（他のモジュールで使用）
export { io };