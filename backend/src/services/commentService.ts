import { query, transaction } from '../database';
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
      const queryText = `
        SELECT 
          c.*,
          u.name as instructor_name
        FROM comments c
        LEFT JOIN users u ON c.instructor_id = u.id
        WHERE c.task_id = $1
        ORDER BY c.created_at ASC
      `;
      
      const comments = await query<Comment>(queryText, [taskId]);
      return comments;
    } catch (error) {
      logger.error('Failed to get comments by task:', error);
      throw error;
    }
  }

  // 生徒のコメント一覧を取得
  static async getCommentsByStudent(studentId: string, limit?: number): Promise<Comment[]> {
    try {
      let queryText = `
        SELECT 
          c.*,
          u.name as instructor_name,
          t.title as task_title
        FROM comments c
        LEFT JOIN users u ON c.instructor_id = u.id
        LEFT JOIN tasks t ON c.task_id = t.id
        WHERE c.student_id = $1
        ORDER BY c.created_at DESC
      `;
      
      const params = [studentId];
      
      if (limit) {
        queryText += ` LIMIT $2`;
        params.push(limit.toString());
      }
      
      const comments = await query<Comment>(queryText, params);
      return comments;
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
      const result = await transaction(async (client) => {
        const insertQuery = `
          INSERT INTO comments (task_id, instructor_id, student_id, content)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `;
        
        const values = [
          commentData.taskId,
          commentData.instructorId,
          commentData.studentId,
          commentData.content
        ];
        
        const result = await client.query(insertQuery, values);
        
        // 講師名も取得
        const commentWithInstructor = await client.query(`
          SELECT 
            c.*,
            u.name as instructor_name,
            t.title as task_title
          FROM comments c
          LEFT JOIN users u ON c.instructor_id = u.id
          LEFT JOIN tasks t ON c.task_id = t.id
          WHERE c.id = $1
        `, [result.rows[0].id]);
        
        return commentWithInstructor.rows[0];
      });

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
      const result = await transaction(async (client) => {
        // 権限チェック: コメント作成者のみ更新可能
        const checkQuery = 'SELECT instructor_id FROM comments WHERE id = $1';
        const checkResult = await client.query(checkQuery, [commentId]);
        
        if (checkResult.rows.length === 0) {
          throw new Error('Comment not found');
        }
        
        if (checkResult.rows[0].instructor_id !== updatedBy) {
          throw new Error('Permission denied: Only comment author can update');
        }

        const updateQuery = `
          UPDATE comments 
          SET content = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING *
        `;
        
        const result = await client.query(updateQuery, [content, commentId]);
        
        // 講師名と他の情報も取得
        const commentWithDetails = await client.query(`
          SELECT 
            c.*,
            u.name as instructor_name,
            t.title as task_title
          FROM comments c
          LEFT JOIN users u ON c.instructor_id = u.id
          LEFT JOIN tasks t ON c.task_id = t.id
          WHERE c.id = $1
        `, [commentId]);
        
        return commentWithDetails.rows[0];
      });

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
      const result = await transaction(async (client) => {
        // 権限チェック: コメント作成者のみ削除可能
        const checkQuery = 'SELECT instructor_id, student_id FROM comments WHERE id = $1';
        const checkResult = await client.query(checkQuery, [commentId]);
        
        if (checkResult.rows.length === 0) {
          throw new Error('Comment not found');
        }
        
        if (checkResult.rows[0].instructor_id !== deletedBy) {
          throw new Error('Permission denied: Only comment author can delete');
        }

        const deleteQuery = 'DELETE FROM comments WHERE id = $1';
        await client.query(deleteQuery, [commentId]);
        
        return checkResult.rows[0];
      });

      logger.info('Comment deleted:', { commentId, deletedBy });

      // リアルタイム通知
      if (io) {
        const notificationData = { commentId, deletedBy };
        notifyUser(io, result.student_id, 'comment_deleted', notificationData);
        notifyStudentWatchers(io, result.student_id, 'comment_deleted', notificationData);
      }
    } catch (error) {
      logger.error('Failed to delete comment:', error);
      throw error;
    }
  }

  // 講師のコメント統計を取得
  static async getCommentStats(instructorId: string, period?: string): Promise<any> {
    try {
      let queryText = `
        SELECT 
          COUNT(*) as total_comments,
          COUNT(DISTINCT c.student_id) as students_commented,
          COUNT(DISTINCT c.task_id) as tasks_commented
        FROM comments c
        WHERE c.instructor_id = $1
      `;
      
      const params = [instructorId];
      
      if (period === 'today') {
        queryText += ` AND c.created_at >= CURRENT_DATE`;
      } else if (period === 'week') {
        queryText += ` AND c.created_at >= CURRENT_DATE - INTERVAL '7 days'`;
      } else if (period === 'month') {
        queryText += ` AND c.created_at >= CURRENT_DATE - INTERVAL '30 days'`;
      }
      
      const result = await query(queryText, params);
      return result[0];
    } catch (error) {
      logger.error('Failed to get comment stats:', error);
      throw error;
    }
  }
}