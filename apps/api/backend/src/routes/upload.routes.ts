import express from 'express';
import { upload } from '../middleware/upload';
import { authenticate } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const router = express.Router();

router.post('/profile-image', authenticate, upload.single('image'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    res.json({
      success: true,
      imageUrl: imageUrl,
      message: 'Profile image uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    res.status(500).json({ error: 'Failed to upload profile image' });
  }
});

router.post('/achievement-image', authenticate, upload.single('image'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    res.json({
      success: true,
      imageUrl: imageUrl,
      message: 'Achievement image uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading achievement image:', error);
    res.status(500).json({ error: 'Failed to upload achievement image' });
  }
});

export default router;
