import { getSupabase, query, transaction } from '../database/supabase';
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
      const supabase = getSupabase();
      
      let queryBuilder = supabase
        .from('tasks')
        .select(`
          *,
          goals!inner(title),
          study_materials(title)
        `)
        .eq('student_id', studentId);
      
      if (date) {
        queryBuilder = queryBuilder.eq('scheduled_date', date);
      }
      
      queryBuilder = queryBuilder.order('scheduled_date', { ascending: true })
                                 .order('scheduled_start_time', { ascending: true })
                                 .order('created_at', { ascending: true });
      
      const { data: tasks, error } = await queryBuilder;
      
      if (error) {
        throw error;
      }
      
      return tasks || [];
    } catch (error) {
      logger.error('Failed to get tasks by student:', error);
      throw error;
    }
  }

  // 講師が担当する生徒のタスクを取得
  static async getTasksByInstructor(instructorId: string, studentId?: string, date?: string): Promise<Task[]> {
    try {
      const supabase = getSupabase();
      
      let queryBuilder = supabase
        .from('tasks')
        .select(`
          *,
          goals!inner(title),
          study_materials(title),
          students!inner(
            instructor_id,
            users!inner(name)
          )
        `)
        .eq('students.instructor_id', instructorId);
      
      if (studentId) {
        queryBuilder = queryBuilder.eq('student_id', studentId);
      }
      
      if (date) {
        queryBuilder = queryBuilder.eq('scheduled_date', date);
      }
      
      queryBuilder = queryBuilder.order('scheduled_date', { ascending: true })
                                 .order('scheduled_start_time', { ascending: true })
                                 .order('created_at', { ascending: true });
      
      const { data: tasks, error } = await queryBuilder;
      
      if (error) {
        throw error;
      }
      
      return tasks || [];
    } catch (error) {
      logger.error('Failed to get tasks by instructor:', error);
      throw error;
    }
  }

  // タスクを作成
  static async createTask(taskData: Partial<Task>): Promise<Task> {
    try {
      const supabase = getSupabase();
      
      const taskInsert = {
        student_id: taskData.studentId,
        goal_id: taskData.goalId,
        material_id: taskData.materialId || null,
        title: taskData.title,
        description: taskData.description || null,
        type: taskData.type || TaskType.MANUAL,
        status: taskData.status || TaskStatus.PENDING,
        estimated_minutes: taskData.estimatedMinutes,
        scheduled_date: taskData.scheduledDate,
        scheduled_start_time: taskData.scheduledStartTime || null,
        scheduled_end_time: taskData.scheduledEndTime || null
      };
      
      const { data: result, error } = await supabase
        .from('tasks')
        .insert(taskInsert)
        .select()
        .single();

      if (error) {
        throw error;
      }

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
      const supabase = getSupabase();
      
      // 現在のタスクを取得
      const { data: currentTask, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();
      
      if (fetchError || !currentTask) {
        throw new Error('Task not found');
      }

      // 更新データの構築
      const updateData: any = {};
      
      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          // camelCaseをsnake_caseに変換
          const dbColumn = this.convertToCamelCase(key);
          updateData[dbColumn] = value;
        }
      }

      // 完了時刻の自動設定
      if (updates.status === TaskStatus.COMPLETED && !currentTask.completed_at) {
        updateData.completed_at = new Date().toISOString();
      }

      if (Object.keys(updateData).length === 0) {
        return currentTask;
      }

      updateData.updated_at = new Date().toISOString();

      const { data: result, error: updateError } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

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
      const supabase = getSupabase();
      
      // 削除前にstudentIdを取得
      const { data: task, error: fetchError } = await supabase
        .from('tasks')
        .select('student_id')
        .eq('id', taskId)
        .single();
      
      if (fetchError || !task) {
        throw new Error('Task not found');
      }

      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (deleteError) {
        throw deleteError;
      }

      logger.info('Task deleted:', { taskId, deletedBy });

      // リアルタイム通知
      if (io) {
        const notificationData = { taskId, deletedBy };
        notifyUser(io, task.student_id, 'task_deleted', notificationData);
        notifyStudentWatchers(io, task.student_id, 'task_deleted', notificationData);
      }
    } catch (error) {
      logger.error('Failed to delete task:', error);
      throw error;
    }
  }

  // 未達成タスクを取得
  static async getOverdueTasks(studentId: string): Promise<Task[]> {
    try {
      const supabase = getSupabase();
      
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select(`
          *,
          goals!inner(title),
          study_materials(title)
        `)
        .eq('student_id', studentId)
        .or(`status.eq.${TaskStatus.OVERDUE},is_overdue.eq.true`)
        .lt('scheduled_date', new Date().toISOString().split('T')[0])
        .order('scheduled_date', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return tasks || [];
    } catch (error) {
      logger.error('Failed to get overdue tasks:', error);
      throw error;
    }
  }

  // タスクの統計を取得
  static async getTaskStats(studentId: string, date?: string): Promise<any> {
    try {
      const supabase = getSupabase();
      
      let queryBuilder = supabase
        .from('tasks')
        .select('status, is_overdue')
        .eq('student_id', studentId);
      
      if (date) {
        queryBuilder = queryBuilder.eq('scheduled_date', date);
      }
      
      const { data: tasks, error } = await queryBuilder;
      
      if (error) {
        throw error;
      }
      
      const stats = {
        total_tasks: tasks?.length || 0,
        completed_tasks: tasks?.filter(t => t.status === TaskStatus.COMPLETED).length || 0,
        in_progress_tasks: tasks?.filter(t => t.status === TaskStatus.IN_PROGRESS).length || 0,
        pending_tasks: tasks?.filter(t => t.status === TaskStatus.PENDING).length || 0,
        overdue_tasks: tasks?.filter(t => t.is_overdue === true).length || 0
      };
      
      return stats;
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