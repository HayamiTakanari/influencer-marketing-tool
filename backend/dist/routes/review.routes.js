"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const review_controller_1 = require("../controllers/review.controller");
const router = express_1.default.Router();
// All routes require authentication
router.use(auth_1.authenticate);
// Create review (Chapter 8)
router.post('/', review_controller_1.createReview);
// Get my reviews
router.get('/my-reviews', review_controller_1.getMyReviews);
// Get user's reviews
router.get('/user/:userId', review_controller_1.getUserReviews);
// Get average rating for user
router.get('/rating/:userId', review_controller_1.getAverageRating);
// Update review
router.put('/:reviewId', review_controller_1.updateReview);
// Delete review
router.delete('/:reviewId', review_controller_1.deleteReview);
exports.default = router;
//# sourceMappingURL=review.routes.js.map