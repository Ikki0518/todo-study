import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';

export interface AuthenticatedRequest extends Request {
  user?: {
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
  };
}

export const authMiddleware = async (
  req: Request & { user?: any },
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '認証トークンが必要です'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const user = await AuthService.validateSession(token);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '無効または期限切れのトークンです'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '認証に失敗しました'
    });
  }
};

// 役割ベースのアクセス制御ミドルウェア
export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '認証が必要です'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'この操作を実行する権限がありません'
      });
    }

    next();
  };
};

// 管理者のみアクセス可能
export const requireAdmin = requireRole(['ADMIN']);

// 講師以上のアクセス権限
export const requireInstructor = requireRole(['ADMIN', 'INSTRUCTOR']);

// 後方互換性のため
export const authenticate = authMiddleware;