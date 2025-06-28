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