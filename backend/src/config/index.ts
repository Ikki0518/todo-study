import dotenv from 'dotenv';

// 環境変数の読み込み
dotenv.config();

export const config = {
  // 環境設定
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  // サーバー設定
  port: parseInt(process.env.PORT || '3002', 10),
  
  // データベース設定
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'ai_study_planner',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  },
  
  // JWT設定
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  // OpenAI設定
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4',
  },
  
  // Google Calendar設定
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/auth/google/callback',
  },
  
  // CORS設定
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
  
  // タスク管理設定
  overdueTaskThreshold: parseInt(process.env.OVERDUE_TASK_THRESHOLD || '10', 10),
  
  // ログレベル
  logLevel: process.env.LOG_LEVEL || 'debug',
};

// 設定の検証
export function validateConfig() {
  const requiredEnvVars = [
    'DB_PASSWORD',
    'JWT_SECRET',
    'OPENAI_API_KEY',
  ];
  
  const missingVars = requiredEnvVars.filter(
    varName => !process.env[varName]
  );
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }
}