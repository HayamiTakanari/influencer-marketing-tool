"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const watchlist_controller_1 = require("../controllers/watchlist.controller");
const router = express_1.default.Router();
// All routes require authentication
router.use(auth_1.authenticate);
// Add project to watchlist
router.post('/', watchlist_controller_1.addToWatchlist);
// Get influencer's watchlist
router.get('/', watchlist_controller_1.getWatchlist);
// Check if project is in watchlist
router.get('/check/:projectId', watchlist_controller_1.isInWatchlist);
// Remove from watchlist
router.delete('/:watchlistId', watchlist_controller_1.removeFromWatchlist);
// Update watchlist notes
router.put('/:watchlistId/notes', watchlist_controller_1.updateWatchlistNotes);
exports.default = router;
//# sourceMappingURL=watchlist.routes.js.map