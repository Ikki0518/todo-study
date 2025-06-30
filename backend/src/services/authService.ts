import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SALT_ROUNDS = 12;

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  avatar_url?: string;
  timezone: string;
  email_verified: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: 'STUDENT' | 'INSTRUCTOR';
  invited_by: string;
  instructor_id?: string;
  token: string;
  expires_at: string;
  used_at?: string;
  is_used: boolean;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  is_active: boolean;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  updated_at: string;
}

export class AuthService {
  // 招待リンクを生成
  static async createInvitation(
    email: string,
    role: 'STUDENT' | 'INSTRUCTOR',
    invitedBy: string,
    instructorId?: string,
    metadata: any = {}
  ): Promise<Invitation> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7日間有効

    const { data, error } = await supabase
      .from('invitations')
      .insert({
        email,
        role,
        invited_by: invitedBy,
        instructor_id: instructorId,
        token,
        expires_at: expiresAt.toISOString(),
        metadata
      })
      .select()
      .single();

    if (error) {
      throw new Error(`招待の作成に失敗しました: ${error.message}`);
    }

    return data;
  }

  // 招待リンクの検証
  static async validateInvitation(token: string): Promise<Invitation | null> {
    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  }

  // ユーザー登録（招待経由）
  static async registerWithInvitation(
    token: string,
    name: string,
    password: string,
    additionalData: any = {}
  ): Promise<{ user: User; sessionToken: string }> {
    const invitation = await this.validateInvitation(token);
    if (!invitation) {
      throw new Error('無効または期限切れの招待リンクです');
    }

    // 既存ユーザーチェック
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', invitation.email)
      .single();

    if (existingUser) {
      throw new Error('このメールアドレスは既に登録されています');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // ユーザー作成
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        email: invitation.email,
        name,
        role: invitation.role,
        password_hash: passwordHash,
        email_verified: true,
        timezone: additionalData.timezone || 'Asia/Tokyo'
      })
      .select()
      .single();

    if (userError) {
      throw new Error(`ユーザー作成に失敗しました: ${userError.message}`);
    }

    // 役割別テーブルに追加
    if (invitation.role === 'STUDENT') {
      await supabase.from('students').insert({
        id: user.id,
        instructor_id: invitation.instructor_id,
        grade_level: additionalData.gradeLevel,
        subjects: additionalData.subjects || [],
        learning_goals: additionalData.learningGoals
      });
    } else if (invitation.role === 'INSTRUCTOR') {
      await supabase.from('instructors').insert({
        id: user.id,
        specialties: additionalData.specialties || [],
        experience_years: additionalData.experienceYears || 0,
        max_students: additionalData.maxStudents || 50
      });
    }

    // 招待を使用済みにマーク
    await supabase
      .from('invitations')
      .update({
        is_used: true,
        used_at: new Date().toISOString()
      })
      .eq('id', invitation.id);

    // セッション作成
    const sessionToken = await this.createSession(user.id);

    return { user, sessionToken };
  }

  // ログイン
  static async login(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ user: User; sessionToken: string }> {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      throw new Error('メールアドレスまたはパスワードが正しくありません');
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('メールアドレスまたはパスワードが正しくありません');
    }

    // 最終ログイン時刻を更新
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    // セッション作成
    const sessionToken = await this.createSession(user.id, ipAddress, userAgent);

    return { user, sessionToken };
  }

  // セッション作成
  static async createSession(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<string> {
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await supabase.from('user_sessions').insert({
      user_id: userId,
      token,
      expires_at: expiresAt.toISOString(),
      ip_address: ipAddress,
      user_agent: userAgent
    });

    return token;
  }

  // セッション検証
  static async validateSession(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      
      // セッションがアクティブかチェック
      const { data: session } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('token', token)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (!session) {
        return null;
      }

      // ユーザー情報を取得
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .single();

      return user;
    } catch (error) {
      return null;
    }
  }

  // ログアウト
  static async logout(token: string): Promise<void> {
    await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('token', token);
  }

  // 招待一覧取得（管理者・講師用）
  static async getInvitations(userId: string): Promise<Invitation[]> {
    const { data, error } = await supabase
      .from('invitations')
      .select(`
        *,
        invited_by_user:users!invitations_invited_by_fkey(name, email),
        instructor:users!invitations_instructor_id_fkey(name, email)
      `)
      .eq('invited_by', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`招待一覧の取得に失敗しました: ${error.message}`);
    }

    return data || [];
  }

  // 招待の削除/無効化
  static async revokeInvitation(invitationId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('invitations')
      .delete()
      .eq('id', invitationId)
      .eq('invited_by', userId);

    if (error) {
      throw new Error(`招待の削除に失敗しました: ${error.message}`);
    }
  }

  // パスワードリセットトークン生成
  static async createPasswordResetToken(email: string): Promise<string> {
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (!user) {
      throw new Error('ユーザーが見つかりません');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1時間有効

    await supabase.from('password_reset_tokens').insert({
      user_id: user.id,
      token,
      expires_at: expiresAt.toISOString()
    });

    return token;
  }

  // パスワードリセット
  static async resetPassword(token: string, newPassword: string): Promise<void> {
    const { data: resetToken } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!resetToken) {
      throw new Error('無効または期限切れのリセットトークンです');
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', resetToken.user_id);

    await supabase
      .from('password_reset_tokens')
      .update({ is_used: true })
      .eq('id', resetToken.id);
  }
}