import { Pool } from 'pg';
import { config } from '../config';
import { logger } from '../utils/logger';

// PostgreSQL接続プールの作成
export const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  max: 20, // 最大接続数
  idleTimeoutMillis: 30000, // アイドルタイムアウト
  connectionTimeoutMillis: 2000, // 接続タイムアウト
});

// データベース接続のセットアップ
export async function setupDatabase(): Promise<void> {
  try {
    // 接続テスト
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    
    logger.info('Database connection established');
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    throw error;
  }
}

// クエリ実行のヘルパー関数
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const start = Date.now();
  
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    logger.debug('Executed query', {
      text,
      duration,
      rows: result.rowCount,
    });
    
    return result.rows;
  } catch (error) {
    logger.error('Query error', {
      text,
      error,
    });
    throw error;
  }
}

// トランザクションのヘルパー関数
export async function transaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// データベース接続のクリーンアップ
export async function closeDatabase(): Promise<void> {
  await pool.end();
  logger.info('Database connections closed');
}