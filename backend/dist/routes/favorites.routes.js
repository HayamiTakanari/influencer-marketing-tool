"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const favorites_controller_1 = require("../controllers/favorites.controller");
const router = express_1.default.Router();
// All routes require authentication
router.use(auth_1.authenticate);
// Add influencer to favorites
router.post('/', favorites_controller_1.addToFavorites);
// Get company's favorites
router.get('/', favorites_controller_1.getFavorites);
// Check if influencer is in favorites
router.get('/check/:influencerId', favorites_controller_1.isInFavorites);
// Remove from favorites
router.delete('/:favoriteId', favorites_controller_1.removeFromFavorites);
// Update favorite notes
router.put('/:favoriteId/notes', favorites_controller_1.updateFavoriteNotes);
exports.default = router;
//# sourceMappingURL=favorites.routes.js.map