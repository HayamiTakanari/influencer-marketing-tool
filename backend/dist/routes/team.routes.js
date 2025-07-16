"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const team_controller_1 = require("../controllers/team.controller");
const router = express_1.default.Router();
// All routes require authentication
router.use(auth_1.authenticate);
// Create a new team
router.post('/', team_controller_1.createTeam);
// Get my team information
router.get('/my-team', team_controller_1.getMyTeam);
// Update team information
router.put('/:teamId', team_controller_1.updateTeam);
// Add a member to the team
router.post('/:teamId/members', team_controller_1.addTeamMember);
// Remove a member from the team
router.delete('/:teamId/members/:memberId', team_controller_1.removeTeamMember);
// Update member role (owner/member)
router.put('/:teamId/members/:memberId/role', team_controller_1.updateMemberRole);
// Delete team
router.delete('/:teamId', team_controller_1.deleteTeam);
exports.default = router;
