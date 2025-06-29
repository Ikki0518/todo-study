import { getSupabase, query, transaction } from '../database/supabase';
import { logger } from '../utils/logger';
import { io } from '../index';
import { notifyUser, notifyStudentWatchers } from '../socket';

// 型定義
interface Comment {
  id: string;
  taskId: string;
  instructorId: string;
  studentId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  instructorName?: string;
  taskTitle?: string;
}

export class CommentService {
  // タスクのコメント一覧を取得
  static async getCommentsByTask(taskId: string): Promise<Comment[]> {
    try {
      const supabase = getSupabase();
      
      const { data: comments, error } = await supabase
        .from('comments')
        .select(`
          *,
          users!instructor_id(name)
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      return comments || [];
    } catch (error) {
      logger.error('Failed to get comments by task:', error);
      throw error;
    }
  }

  // 生徒のコメント一覧を取得
  static async getCommentsByStudent(studentId: string, limit?: number): Promise<Comment[]> {
    try {
      const supabase = getSupabase();
      
      let queryBuilder = supabase
        .from('comments')
        .select(`
          *,
          users!instructor_id(name),
          tasks!task_id(title)
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
      
      if (limit) {
        queryBuilder = queryBuilder.limit(limit);
      }
      
      const { data: comments, error } = await queryBuilder;
      
      if (error) {
        throw error;
      }
      
      return comments || [];
    } catch (error) {
      logger.error('Failed to get comments by student:', error);
      throw error;
    }
  }

  // コメントを作成
  static async createComment(commentData: {
    taskId: string;
    instructorId: string;
    studentId: string;
    content: string;
  }): Promise<Comment> {
    try {
      const supabase = getSupabase();
      
      const commentInsert = {
        task_id: commentData.taskId,
        instructor_id: commentData.instructorId,
        student_id: commentData.studentId,
        content: commentData.content
      };
      
      const { data: result, error } = await supabase
        .from('comments')
        .insert(commentInsert)
        .select(`
          *,
          users!instructor_id(name),
          tasks!task_id(title)
        `)
        .single();

      if (error) {
        throw error;
      }

      logger.info('Comment created:', {
        commentId: result.id,
        taskId: commentData.taskId,
        instructorId: commentData.instructorId
      });

      // リアルタイム通知
      if (io) {
        // 生徒に通知
        notifyUser(io, commentData.studentId, 'comment_received', {
          comment: result,
          taskId: commentData.taskId
        });
        
        // タスクを監視している他の講師にも通知
        notifyStudentWatchers(io, commentData.studentId, 'comment_added', {
          comment: result,
          taskId: commentData.taskId
        });
      }

      return result;
    } catch (error) {
      logger.error('Failed to create comment:', error);
      throw error;
    }
  }

  // コメントを更新
  static async updateComment(commentId: string, content: string, updatedBy: string): Promise<Comment> {
    try {
      const supabase = getSupabase();
      
      // 権限チェック: コメント作成者のみ更新可能
      const { data: existingComment, error: checkError } = await supabase
        .from('comments')
        .select('instructor_id, student_id')
        .eq('id', commentId)
        .single();
      
      if (checkError || !existingComment) {
        throw new Error('Comment not found');
      }
      
      if (existingComment.instructor_id !== updatedBy) {
        throw new Error('Permission denied: Only comment author can update');
      }

      const { data: result, error: updateError } = await supabase
        .from('comments')
        .update({
          content,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .select(`
          *,
          users!instructor_id(name),
          tasks!task_id(title)
        `)
        .single();

      if (updateError) {
        throw updateError;
      }

      logger.info('Comment updated:', { commentId, updatedBy });

      // リアルタイム通知
      if (io) {
        const notificationData = { comment: result, updatedBy };
        notifyUser(io, result.student_id, 'comment_updated', notificationData);
        notifyStudentWatchers(io, result.student_id, 'comment_updated', notificationData);
      }

      return result;
    } catch (error) {
      logger.error('Failed to update comment:', error);
      throw error;
    }
  }

  // コメントを削除
  static async deleteComment(commentId: string, deletedBy: string): Promise<void> {
    try {
      const supabase = getSupabase();
      
      // 権限チェック: コメント作成者のみ削除可能
      const { data: existingComment, error: checkError } = await supabase
        .from('comments')
        .select('instructor_id, student_id')
        .eq('id', commentId)
        .single();
      
      if (checkError || !existingComment) {
        throw new Error('Comment not found');
      }
      
      if (existingComment.instructor_id !== deletedBy) {
        throw new Error('Permission denied: Only comment author can delete');
      }

      const { error: deleteError } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (deleteError) {
        throw deleteError;
      }

      logger.info('Comment deleted:', { commentId, deletedBy });

      // リアルタイム通知
      if (io) {
        const notificationData = { commentId, deletedBy };
        notifyUser(io, existingComment.student_id, 'comment_deleted', notificationData);
        notifyStudentWatchers(io, existingComment.student_id, 'comment_deleted', notificationData);
      }
    } catch (error) {
      logger.error('Failed to delete comment:', error);
      throw error;
    }
  }

  // 講師のコメント統計を取得
  static async getCommentStats(instructorId: string, period?: string): Promise<any> {
    try {
      const supabase = getSupabase();
      
      let queryBuilder = supabase
        .from('comments')
        .select('student_id, task_id, created_at')
        .eq('instructor_id', instructorId);
      
      const now = new Date();
      
      if (period === 'today') {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        queryBuilder = queryBuilder.gte('created_at', today.toISOString());
      } else if (period === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        queryBuilder = queryBuilder.gte('created_at', weekAgo.toISOString());
      } else if (period === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        queryBuilder = queryBuilder.gte('created_at', monthAgo.toISOString());
      }
      
      const { data: comments, error } = await queryBuilder;
      
      if (error) {
        throw error;
      }
      
      const stats = {
        total_comments: comments?.length || 0,
        students_commented: new Set(comments?.map(c => c.student_id)).size || 0,
        tasks_commented: new Set(comments?.map(c => c.task_id)).size || 0
      };
      
      return stats;
    } catch (error) {
      logger.error('Failed to get comment stats:', error);
      throw error;
    }
  }
}