import { Router } from 'express';

const router = Router();

// 基本的な認証ルート（実装は省略）
router.post('/login', (req, res) => {
  res.json({ success: true, data: { token: 'dummy-token', user: { id: '1', name: 'テストユーザー', role: 'STUDENT' } } });
});

router.post('/register', (req, res) => {
  res.json({ success: true, data: { message: 'User registered successfully' } });
});

export { router as authRoutes };