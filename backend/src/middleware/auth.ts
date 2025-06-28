import { Request, Response, NextFunction } from 'express';

export const authenticate = (req: any, res: any, next: NextFunction) => {
  // 簡単な認証ミドルウェア（実装は省略）
  req.user = { id: '1', name: 'テストユーザー', role: 'STUDENT' };
  next();
};