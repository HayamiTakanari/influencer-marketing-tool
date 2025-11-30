"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const submission_controller_1 = require("../controllers/submission.controller");
const router = express_1.default.Router();
// All routes require authentication
router.use(auth_1.authenticate);
// Create submission (influencer submits deliverable)
router.post('/', submission_controller_1.createSubmission);
// Get influencer's own submissions
router.get('/influencer/my-submissions', submission_controller_1.getInfluencerSubmissions);
// Get submissions for a specific project (company view)
router.get('/project/:projectId', submission_controller_1.getProjectSubmissions);
// Approve a submission
router.put('/:submissionId/approve', submission_controller_1.approveSubmission);
// Request revision on submission
router.put('/:submissionId/revision', submission_controller_1.requestRevision);
// Reject a submission
router.put('/:submissionId/reject', submission_controller_1.rejectSubmission);
exports.default = router;
//# sourceMappingURL=submission.routes.js.map