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
// Create a review
router.post('/', review_controller_1.createReview);
// Get reviews for a specific user (public)
router.get('/user/:userId', review_controller_1.getReviewsForUser);
// Get rating statistics for a user
router.get('/user/:userId/stats', review_controller_1.getRatingStats);
// Get my reviews (given or received)
router.get('/my-reviews', review_controller_1.getMyReviews);
// Get projects that can be reviewed
router.get('/reviewable-projects', review_controller_1.getReviewableProjects);
// Update a review
router.put('/:reviewId', review_controller_1.updateReview);
// Delete a review
router.delete('/:reviewId', review_controller_1.deleteReview);
exports.default = router;
