"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const ai_controller_1 = require("../controllers/ai.controller");
const router = express_1.default.Router();
// All routes require authentication
router.use(auth_1.authenticate);
// Get AI recommendations for a project
router.post('/recommend-influencers-for-project', ai_controller_1.recommendInfluencersForProject);
exports.default = router;
