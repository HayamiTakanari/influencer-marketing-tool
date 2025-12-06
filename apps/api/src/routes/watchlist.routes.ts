import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist,
  isInWatchlist,
  updateWatchlistNotes,
} from '../controllers/watchlist.controller';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Add project to watchlist
router.post('/', addToWatchlist);

// Get influencer's watchlist
router.get('/', getWatchlist);

// Check if project is in watchlist
router.get('/check/:projectId', isInWatchlist);

// Remove from watchlist
router.delete('/:watchlistId', removeFromWatchlist);

// Update watchlist notes
router.put('/:watchlistId/notes', updateWatchlistNotes);

export default router;
