import { Router, Response } from 'express';
import { Category } from '../models';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// ─── GET /api/categories ──────────────────────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const categories = await Category.find({ userId: req.userId })
      .sort({ type: 1, name: 1 })
      .lean();
    return res.json({ success: true, data: categories });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
});

// ─── POST /api/categories ─────────────────────────────────────────────────────
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, icon, color, type } = req.body;
    if (!name || !type) {
      return res.status(400).json({ success: false, message: 'name and type are required' });
    }
    const cat = await Category.create({
      userId: req.userId,
      name,
      icon:  icon  ?? 'ellipse-outline',
      color: color ?? '#7C3AED',
      type,
    });
    return res.status(201).json({ success: true, data: cat });
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Category already exists' });
    }
    return res.status(500).json({ success: false, message: 'Failed to create category' });
  }
});

// ─── PUT /api/categories/:id ──────────────────────────────────────────────────
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const cat = await Category.findOne({ _id: req.params.id, userId: req.userId });
    if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });
    if (cat.isSystem) return res.status(403).json({ success: false, message: 'Cannot edit system category' });

    const { name, icon, color } = req.body;
    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      { ...(name && { name }), ...(icon && { icon }), ...(color && { color }) },
      { new: true, runValidators: true }
    );
    return res.json({ success: true, data: updated });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to update category' });
  }
});

// ─── DELETE /api/categories/:id ───────────────────────────────────────────────
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const cat = await Category.findOne({ _id: req.params.id, userId: req.userId });
    if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });
    if (cat.isSystem) return res.status(403).json({ success: false, message: 'Cannot delete system category' });

    await Category.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Category deleted' });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to delete category' });
  }
});

export default router;
