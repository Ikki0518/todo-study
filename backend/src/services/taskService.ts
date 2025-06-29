import { query, transaction } from '../database';
import { logger } from '../utils/logger';
import { io } from '../index';
import { notifyStudentWatchers, notifyUser } from '../socket';

// 型定義（一時的に直接定義）
enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  OVERDUE = 'OVERDUE'
}

enum TaskType {
  AI_GENERATED = 'AI_GENERATED',
  MANUAL = 'MANUAL'
}

interface Task {
  id: string;
  studentId: string;
  goalId: string;
  materialId?: string;
  title: string;
  description?: string;
  type: TaskType;
  status: TaskStatus;
  estimatedMinutes: number;
  actualMinutes?: number;
  scheduledDate: Date;
  scheduledStartTime?: Date;
  scheduledEndTime?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  isOverdue: boolean;
  googleCalendarEventId?: string;
}

interface Comment {
  id: string;
  taskId: string;
  instructorId: string;
  studentId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export class TaskService {
  // 生徒のタスク一覧を取得
  static async getTasksByStudent(studentId: string, date?: string): Promise<Task[]> {
    try {
      let queryText = `
        SELECT 
          t.*,
          g.title as goal_title,
          sm.title as material_title
        FROM tasks t
        LEFT JOIN goals g ON t.goal_id = g.id
        LEFT JOIN study_materials sm ON t.material_id = sm.id
        WHERE t.student_id = $1
      `;
      
      const params = [studentId];
      
      if (date) {
        queryText += ' AND t.scheduled_date = $2';
        params.push(date);
      }
      
      queryText += ' ORDER BY t.scheduled_date, t.scheduled_start_time, t.created_at';
      
      const tasks = await query<Task>(queryText, params);
      return tasks;
    } catch (error) {
      logger.error('Failed to get tasks by student:', error);
      throw error;
    }
  }

  // 講師が担当する生徒のタスクを取得
  static async getTasksByInstructor(instructorId: string, studentId?: string, date?: string): Promise<Task[]> {
    try {
      let queryText = `
        SELECT 
          t.*,
          g.title as goal_title,
          sm.title as material_title,
          u.name as student_name
        FROM tasks t
        LEFT JOIN goals g ON t.goal_id = g.id
        LEFT JOIN study_materials sm ON t.material_id = sm.id
        LEFT JOIN students s ON t.student_id = s.id
        LEFT JOIN users u ON s.id = u.id
        WHERE s.instructor_id = $1
      `;
      
      const params = [instructorId];
      let paramIndex = 2;
      
      if (studentId) {
        queryText += ` AND t.student_id = $${paramIndex}`;
        params.push(studentId);
        paramIndex++;
      }
      
      if (date) {
        queryText += ` AND t.scheduled_date = $${paramIndex}`;
        params.push(date);
      }
      
      queryText += ' ORDER BY t.scheduled_date, t.scheduled_start_time, t.created_at';
      
      const tasks = await query<Task>(queryText, params);
      return tasks;
    } catch (error) {
      logger.error('Failed to get tasks by instructor:', error);
      throw error;
    }
  }

  // タスクを作成
  static async createTask(taskData: Partial<Task>): Promise<Task> {
    try {
      const result = await transaction(async (client) => {
        const insertQuery = `
          INSERT INTO tasks (
            student_id, goal_id, material_id, title, description, 
            type, status, estimated_minutes, scheduled_date,
            scheduled_start_time, scheduled_end_time
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *
        `;
        
        const values = [
          taskData.studentId,
          taskData.goalId,
          taskData.materialId || null,
          taskData.title,
          taskData.description || null,
          taskData.type || TaskType.MANUAL,
          taskData.status || TaskStatus.PENDING,
          taskData.estimatedMinutes,
          taskData.scheduledDate,
          taskData.scheduledStartTime || null,
          taskData.scheduledEndTime || null
        ];
        
        const result = await client.query(insertQuery, values);
        return result.rows[0];
      });

      logger.info('Task created:', { taskId: result.id, studentId: taskData.studentId });

      // リアルタイム通知
      if (io) {
        notifyUser(io, taskData.studentId!, 'task_created', result);
        notifyStudentWatchers(io, taskData.studentId!, 'task_created', result);
      }

      return result;
    } catch (error) {
      logger.error('Failed to create task:', error);
      throw error;
    }
  }

  // タスクを更新
  static async updateTask(taskId: string, updates: Partial<Task>, updatedBy: string): Promise<Task> {
    try {
      const result = await transaction(async (client) => {
        // 現在のタスクを取得
        const currentTaskQuery = 'SELECT * FROM tasks WHERE id = $1';
        const currentTask = await client.query(currentTaskQuery, [taskId]);
        
        if (currentTask.rows.length === 0) {
          throw new Error('Task not found');
        }

        const task = currentTask.rows[0];
        
        // 更新フィールドの構築
        const updateFields = [];
        const values = [];
        let paramIndex = 1;

        for (const [key, value] of Object.entries(updates)) {
          if (value !== undefined) {
            const dbColumn = this.convertToCamelCase(key);
            updateFields.push(`${dbColumn} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
          }
        }

        // 完了時刻の自動設定
        if (updates.status === TaskStatus.COMPLETED && !task.completed_at) {
          updateFields.push(`completed_at = $${paramIndex}`);
          values.push(new Date());
          paramIndex++;
        }

        if (updateFields.length === 0) {
          return task;
        }

        updateFields.push(`updated_at = $${paramIndex}`);
        values.push(new Date());
        values.push(taskId);

        const updateQuery = `
          UPDATE tasks 
          SET ${updateFields.join(', ')}
          WHERE id = $${paramIndex + 1}
          RETURNING *
        `;

        const result = await client.query(updateQuery, values);
        return result.rows[0];
      });

      logger.info('Task updated:', { taskId, updatedBy });

      // リアルタイム通知
      if (io) {
        const notificationData = { taskId, updates, updatedBy, task: result };
        notifyUser(io, result.student_id, 'task_updated', notificationData);
        notifyStudentWatchers(io, result.student_id, 'task_updated', notificationData);
      }

      return result;
    } catch (error) {
      logger.error('Failed to update task:', error);
      throw error;
    }
  }

  // タスクを削除
  static async deleteTask(taskId: string, deletedBy: string): Promise<void> {
    try {
      const result = await query('DELETE FROM tasks WHERE id = $1 RETURNING student_id', [taskId]);
      
      if (result.length === 0) {
        throw new Error('Task not found');
      }

      const studentId = result[0].student_id;

      logger.info('Task deleted:', { taskId, deletedBy });

      // リアルタイム通知
      if (io) {
        const notificationData = { taskId, deletedBy };
        notifyUser(io, studentId, 'task_deleted', notificationData);
        notifyStudentWatchers(io, studentId, 'task_deleted', notificationData);
      }
    } catch (error) {
      logger.error('Failed to delete task:', error);
      throw error;
    }
  }

  // 未達成タスクを取得
  static async getOverdueTasks(studentId: string): Promise<Task[]> {
    try {
      const queryText = `
        SELECT 
          t.*,
          g.title as goal_title,
          sm.title as material_title
        FROM tasks t
        LEFT JOIN goals g ON t.goal_id = g.id
        LEFT JOIN study_materials sm ON t.material_id = sm.id
        WHERE t.student_id = $1 
          AND (t.status = $2 OR t.is_overdue = true)
          AND t.scheduled_date < CURRENT_DATE
        ORDER BY t.scheduled_date DESC
      `;
      
      const tasks = await query<Task>(queryText, [studentId, TaskStatus.OVERDUE]);
      return tasks;
    } catch (error) {
      logger.error('Failed to get overdue tasks:', error);
      throw error;
    }
  }

  // タスクの統計を取得
  static async getTaskStats(studentId: string, date?: string): Promise<any> {
    try {
      let queryText = `
        SELECT 
          COUNT(*) as total_tasks,
          COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_tasks,
          COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as in_progress_tasks,
          COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_tasks,
          COUNT(CASE WHEN is_overdue = true THEN 1 END) as overdue_tasks
        FROM tasks 
        WHERE student_id = $1
      `;
      
      const params = [studentId];
      
      if (date) {
        queryText += ' AND scheduled_date = $2';
        params.push(date);
      }
      
      const result = await query(queryText, params);
      return result[0];
    } catch (error) {
      logger.error('Failed to get task stats:', error);
      throw error;
    }
  }

  // カラム名をsnake_caseに変換
  private static convertToCamelCase(camelCase: string): string {
    return camelCase.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}