import winston from 'winston';
import { config } from '../config';

// ログフォーマットの定義
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// コンソール用のフォーマット（開発環境）
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = '\n' + JSON.stringify(meta, null, 2);
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// ロガーの作成
export const logger = winston.createLogger({
  level: config.logLevel,
  format: logFormat,
  defaultMeta: { service: 'ai-study-planner' },
  transports: [
    // ファイルへの出力（エラーログ）
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // ファイルへの出力（全ログ）
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// 開発環境ではコンソールにも出力
if (config.isDevelopment) {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// HTTPリクエストログ用のミドルウェア
export const httpLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'ai-study-planner-http' },
  transports: [
    new winston.transports.File({
      filename: 'logs/http.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// 開発環境ではHTTPログもコンソールに出力
if (config.isDevelopment) {
  httpLogger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// エクスプレスミドルウェアとして使用するログ関数
export function requestLogger(req: any, res: any, next: any) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    httpLogger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  });
  
  next();
}