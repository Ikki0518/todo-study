import { Router } from 'express';

const router = Router();

router.get('/', (req: any, res: any) => {
  res.json({ success: true, data: [] });
});

export { router as calendarRoutes };