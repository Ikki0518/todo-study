// ユーザー種別
export enum UserRole {
  STUDENT = 'STUDENT',
  INSTRUCTOR = 'INSTRUCTOR'
}

// ユーザー情報
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

// 生徒情報（Userを拡張）
export interface Student extends User {
  role: UserRole.STUDENT;
  instructorId?: string; // 担当講師ID
  currentStreak: number; // 現在の連続学習日数
  lastStudiedAt?: Date; // 最後に学習した日
}

// 講師情報（Userを拡張）
export interface Instructor extends User {
  role: UserRole.INSTRUCTOR;
  studentIds: string[]; // 担当生徒IDリスト
}

// 長期目標
export interface Goal {
  id: string;
  studentId: string;
  title: string;
  description?: string;
  targetDate: Date; // 目標達成予定日
  createdAt: Date;
  updatedAt: Date;
  completed: boolean;
  completedAt?: Date;
}

// 学習教材
export interface StudyMaterial {
  id: string;
  goalId: string;
  title: string;
  description?: string;
  estimatedHours: number; // 推定学習時間
  order: number; // 学習順序
  createdAt: Date;
  updatedAt: Date;
}

// タスクの状態
export enum TaskStatus {
  PENDING = 'PENDING',       // 未着手
  IN_PROGRESS = 'IN_PROGRESS', // 進行中
  COMPLETED = 'COMPLETED',   // 完了
  OVERDUE = 'OVERDUE'       // 期限切れ
}

// タスクの種類
export enum TaskType {
  AI_GENERATED = 'AI_GENERATED', // AIが自動生成
  MANUAL = 'MANUAL'              // 手動で作成
}

// タスク
export interface Task {
  id: string;
  studentId: string;
  goalId: string;
  materialId?: string; // 関連する学習教材ID
  title: string;
  description?: string;
  type: TaskType;
  status: TaskStatus;
  estimatedMinutes: number; // 推定所要時間（分）
  actualMinutes?: number;   // 実際の所要時間（分）
  scheduledDate: Date;      // 予定日
  scheduledStartTime?: Date; // 予定開始時刻
  scheduledEndTime?: Date;   // 予定終了時刻
  completedAt?: Date;       // 完了日時
  createdAt: Date;
  updatedAt: Date;
  isOverdue: boolean;       // 未達成タスクプールに移動されたか
  googleCalendarEventId?: string; // Google Calendar イベントID
}

// コメント（講師から生徒へ）
export interface Comment {
  id: string;
  taskId: string;
  instructorId: string;
  studentId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// 通知タイプ
export enum NotificationType {
  OVERDUE_TASKS_THRESHOLD = 'OVERDUE_TASKS_THRESHOLD', // 未達成タスクが閾値超過
  STREAK_MILESTONE = 'STREAK_MILESTONE',               // ストリークのマイルストーン達成
  GOAL_DEADLINE_APPROACHING = 'GOAL_DEADLINE_APPROACHING' // 目標期限が近づいている
}

// 通知
export interface Notification {
  id: string;
  recipientId: string; // 受信者（講師）のID
  studentId: string;   // 関連する生徒のID
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// デイリープランナーのビューモデル
export interface DailyPlannerView {
  date: Date;
  student: Student;
  todayTasks: Task[];      // 本日のタスクプール
  overdueTasks: Task[];    // 未達成タスクプール
  timelineTasks: Task[];   // タイムラインに配置されたタスク
  comments: Comment[];     // 本日のタスクに関するコメント
}

// AI機能関連の型定義

// パーソナライズモード用のナレッジ構造
export interface UserKnowledge {
  user_profile: {
    name: string;
    goal: {
      name: string;
      deadline: string; // YYYY-MM-DD形式
    };
    current_status: {
      type: string; // 例: "偏差値", "スコア"
      value: string;
    };
    preferences: {
      study_hours: {
        weekday: string;
        holiday: string;
      };
      study_days_per_week: string;
      rest_days: string[];
      weak_subjects: string[];
    };
  };
  materials: Array<{
    name: string;
    type: string; // "ページ" or "問題数" など
    total_amount: number;
    current_progress: number;
  }>;
  session_data?: {
    streak_days: number;
  };
}

// AI会話の状態
export enum AIConversationState {
  INITIAL = 'INITIAL',
  GOAL_COLLECTION = 'GOAL_COLLECTION',
  CURRENT_STATUS = 'CURRENT_STATUS',
  MATERIALS = 'MATERIALS',
  STUDY_TIME = 'STUDY_TIME',
  STUDY_DAYS = 'STUDY_DAYS',
  WEAK_SUBJECTS = 'WEAK_SUBJECTS',
  COMPLETED = 'COMPLETED'
}

// AI会話セッション
export interface AIConversationSession {
  id: string;
  studentId: string;
  mode: 'PERSONALIZE' | 'COMPANION';
  state: AIConversationState;
  knowledge?: Partial<UserKnowledge>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// AI会話メッセージ
export interface AIMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

// AI API リクエスト/レスポンス
export interface AIPersonalizeRequest {
  studentId: string;
  message: string;
  sessionId?: string;
}

export interface AICompanionRequest {
  studentId: string;
  message: string;
  knowledge: UserKnowledge;
}

export interface AIResponse {
  message: string;
  sessionId?: string;
  knowledge?: UserKnowledge;
  isCompleted?: boolean;
  dailyTasks?: Array<{
    material: string;
    range: string;
    type: string;
  }>;
}

// API レスポンスの共通フォーマット
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}