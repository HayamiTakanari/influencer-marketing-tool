"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const sns_verification_1 = require("../middleware/sns-verification");
const project_controller_1 = require("../controllers/project.controller");
const schedule_controller_1 = require("../controllers/schedule.controller");
const router = express_1.default.Router();
// All routes require authentication
router.use(auth_1.authenticate);
// Get available projects (for influencers)
router.get('/available', project_controller_1.getAvailableProjects);
// Apply to a project (for influencers) - SNS連携必須
router.post('/apply', sns_verification_1.verifySNSConnections, project_controller_1.applyToProject);
// Get my applications (for influencers)
router.get('/my-applications', project_controller_1.getMyApplications);
// Get applications for my projects (for clients)
router.get('/applications', project_controller_1.getApplicationsForMyProjects);
// Accept an application (for clients)
router.put('/applications/:applicationId/accept', project_controller_1.acceptApplication);
// Reject an application (for clients)
router.delete('/applications/:applicationId/reject', project_controller_1.rejectApplication);
// Get project categories
router.get('/categories', project_controller_1.getProjectCategories);
// Project CRUD operations
// Create a new project (for clients)
router.post('/', project_controller_1.createProject);
// Get my projects (for clients)
router.get('/my-projects', project_controller_1.getMyProjects);
// Get project by ID
router.get('/:projectId', project_controller_1.getProjectById);
// プロジェクトスケジュール関連ルート
router.get('/:projectId/schedule', schedule_controller_1.getProjectSchedule);
router.post('/:projectId/schedule', schedule_controller_1.createProjectSchedule);
router.put('/:projectId/schedule', schedule_controller_1.updateMilestone);
// Update project (for clients)
router.put('/:projectId', project_controller_1.updateProject);
// Update project status (for clients)
router.put('/:projectId/status', project_controller_1.updateProjectStatus);
// Delete project (for clients)
router.delete('/:projectId', project_controller_1.deleteProject);
exports.default = router;
//# sourceMappingURL=project.routes.js.map