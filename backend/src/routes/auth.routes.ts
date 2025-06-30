import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthService } from '../services/authService';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 招待リンク作成（管理者・講師のみ）
router.post('/invite',
  authMiddleware,
  [
    body('email').isEmail().withMessage('有効なメールアドレスを入力してください'),
    body('role').isIn(['STUDENT', 'INSTRUCTOR']).withMessage('有効な役割を選択してください'),
    body('instructorId').optional().isUUID().withMessage('有効な講師IDを指定してください'),
    body('metadata').optional().isObject().withMessage('メタデータは有効なオブジェクトである必要があります')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'バリデーションエラー',
          errors: errors.array()
        });
      }

      const { email, role, instructorId, metadata = {} } = req.body;
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;

      // 権限チェック
      if (userRole !== 'ADMIN' && userRole !== 'INSTRUCTOR') {
        return res.status(403).json({
          success: false,
          message: '招待を作成する権限がありません'
        });
      }

      // 講師は学生のみ招待可能
      if (userRole === 'INSTRUCTOR' && role !== 'STUDENT') {
        return res.status(403).json({
          success: false,
          message: '講師は学生のみ招待できます'
        });
      }

      const invitation = await AuthService.createInvitation(
        email,
        role,
        userId,
        role === 'STUDENT' ? (instructorId || userId) : undefined,
        metadata
      );

      res.json({
        success: true,
        data: {
          invitation,
          inviteUrl: `${process.env.FRONTEND_URL}/register?token=${invitation.token}`
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '招待の作成に失敗しました'
      });
    }
  }
);

// 招待リンク検証
router.get('/invite/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const invitation = await AuthService.validateInvitation(token);

    if (!invitation) {
      return res.status(400).json({
        success: false,
        message: '無効または期限切れの招待リンクです'
      });
    }

    res.json({
      success: true,
      data: {
        email: invitation.email,
        role: invitation.role,
        metadata: invitation.metadata
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '招待の検証に失敗しました'
    });
  }
});

// ユーザー登録（招待経由）
router.post('/register',
  [
    body('token').notEmpty().withMessage('招待トークンが必要です'),
    body('name').isLength({ min: 1, max: 255 }).withMessage('名前は1文字以上255文字以下で入力してください'),
    body('password').isLength({ min: 8 }).withMessage('パスワードは8文字以上で入力してください'),
    body('additionalData').optional().isObject()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'バリデーションエラー',
          errors: errors.array()
        });
      }

      const { token, name, password, additionalData = {} } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      const result = await AuthService.registerWithInvitation(
        token,
        name,
        password,
        additionalData
      );

      res.json({
        success: true,
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            role: result.user.role,
            avatar_url: result.user.avatar_url,
            timezone: result.user.timezone
          },
          token: result.sessionToken
        }
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'ユーザー登録に失敗しました'
      });
    }
  }
);

// ログイン
router.post('/login',
  [
    body('email').isEmail().withMessage('有効なメールアドレスを入力してください'),
    body('password').notEmpty().withMessage('パスワードを入力してください')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'バリデーションエラー',
          errors: errors.array()
        });
      }

      const { email, password } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      const result = await AuthService.login(email, password, ipAddress, userAgent);

      res.json({
        success: true,
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            role: result.user.role,
            avatar_url: result.user.avatar_url,
            timezone: result.user.timezone
          },
          token: result.sessionToken
        }
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message || 'ログインに失敗しました'
      });
    }
  }
);

// ログアウト
router.post('/logout', authMiddleware, async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    await AuthService.logout(token);

    res.json({
      success: true,
      message: 'ログアウトしました'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'ログアウトに失敗しました'
    });
  }
});

// 現在のユーザー情報取得
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar_url: user.avatar_url,
          timezone: user.timezone,
          email_verified: user.email_verified,
          last_login_at: user.last_login_at
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'ユーザー情報の取得に失敗しました'
    });
  }
});

// 招待一覧取得（管理者・講師用）
router.get('/invitations', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'ADMIN' && userRole !== 'INSTRUCTOR') {
      return res.status(403).json({
        success: false,
        message: '招待一覧を表示する権限がありません'
      });
    }

    const invitations = await AuthService.getInvitations(userId);

    res.json({
      success: true,
      data: { invitations }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '招待一覧の取得に失敗しました'
    });
  }
});

// 招待の削除/無効化
router.delete('/invitations/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'ADMIN' && userRole !== 'INSTRUCTOR') {
      return res.status(403).json({
        success: false,
        message: '招待を削除する権限がありません'
      });
    }

    await AuthService.revokeInvitation(id, userId);

    res.json({
      success: true,
      message: '招待を削除しました'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '招待の削除に失敗しました'
    });
  }
});

// パスワードリセット要求
router.post('/forgot-password',
  [
    body('email').isEmail().withMessage('有効なメールアドレスを入力してください')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'バリデーションエラー',
          errors: errors.array()
        });
      }

      const { email } = req.body;
      const token = await AuthService.createPasswordResetToken(email);

      // 実際の実装では、ここでメール送信を行う
      res.json({
        success: true,
        message: 'パスワードリセットメールを送信しました',
        data: {
          resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${token}` // 開発用
        }
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'パスワードリセット要求に失敗しました'
      });
    }
  }
);

// 開発環境用の新規登録（招待なし）
router.post('/register-dev',
  [
    body('email').isEmail().withMessage('有効なメールアドレスを入力してください'),
    body('name').isLength({ min: 1, max: 255 }).withMessage('名前は1文字以上255文字以下で入力してください'),
    body('password').isLength({ min: 8 }).withMessage('パスワードは8文字以上で入力してください'),
    body('phoneNumber').optional().matches(/^\d{3}-\d{4}-\d{4}$/).withMessage('電話番号は000-0000-0000の形式で入力してください'),
    body('role').optional().isIn(['STUDENT', 'INSTRUCTOR']).withMessage('有効な役割を選択してください')
  ],
  async (req: Request, res: Response) => {
    // 一時的に環境チェックを無効化（本番環境でも動作させる）
    // TODO: 本番環境では招待制に移行する

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'バリデーションエラー',
          errors: errors.array()
        });
      }

      const { email, name, password, phoneNumber, role = 'STUDENT' } = req.body;
      
      // 直接ユーザーを作成
      const result = await AuthService.createUserDirectly(
        email,
        name,
        password,
        role,
        { phoneNumber }
      );

      res.json({
        success: true,
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            role: result.user.role,
            phoneNumber: result.user.phone_number
          },
          message: '登録が完了しました'
        }
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'ユーザー登録に失敗しました'
      });
    }
  }
);

// パスワードリセット実行
router.post('/reset-password',
  [
    body('token').notEmpty().withMessage('リセットトークンが必要です'),
    body('password').isLength({ min: 8 }).withMessage('パスワードは8文字以上で入力してください')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'バリデーションエラー',
          errors: errors.array()
        });
      }

      const { token, password } = req.body;
      await AuthService.resetPassword(token, password);

      res.json({
        success: true,
        message: 'パスワードをリセットしました'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'パスワードリセットに失敗しました'
      });
    }
  }
);

export { router as authRoutes };