import * as cron from 'node-cron';
import { logger } from '../utils/logger';

// 未達成タスクチェック関数
async function checkOverdueTasks(): Promise<void> {
  logger.info('Checking overdue tasks...');
  // TODO: Supabaseでの実装
}

// ストリーク更新関数
async function updateStreaks(): Promise<void> {
  logger.info('Updating streaks...');
  // TODO: Supabaseでの実装
}

export function startScheduledJobs(): void {
  logger.info('Starting scheduled jobs...');
  
  // 毎日深夜0時に未達成タスクをチェック
  cron.schedule('0 0 * * *', async () => {
    logger.info('Running overdue tasks check job');
    try {
      await checkOverdueTasks();
    } catch (error) {
      logger.error('Failed to check overdue tasks', error);
    }
  }, {
    timezone: 'Asia/Tokyo'
  });
  
  // 毎日深夜0時5分にストリークを更新
  cron.schedule('5 0 * * *', async () => {
    logger.info('Running streak update job');
    try {
      await updateStreaks();
    } catch (error) {
      logger.error('Failed to update streaks', error);
    }
  }, {
    timezone: 'Asia/Tokyo'
  });
  
  logger.info('Scheduled jobs started successfully');
}