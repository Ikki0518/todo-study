import cron from 'node-cron';
import { logger } from '../utils/logger';
import { checkOverdueTasks } from './overdueTasksJob';
import { updateStreaks } from './streakUpdateJob';

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