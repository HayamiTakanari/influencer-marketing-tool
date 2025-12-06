import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  addToFavorites,
  removeFromFavorites,
  getFavorites,
  isInFavorites,
  updateFavoriteNotes,
} from '../controllers/favorites.controller';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Add influencer to favorites
router.post('/', addToFavorites);

// Get company's favorites
router.get('/', getFavorites);

// Check if influencer is in favorites
router.get('/check/:influencerId', isInFavorites);

// Remove from favorites
router.delete('/:favoriteId', removeFromFavorites);

// Update favorite notes
router.put('/:favoriteId/notes', updateFavoriteNotes);

export default router;
