"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const schedule_controller_1 = require("../controllers/schedule.controller");
const router = (0, express_1.Router)();
// v3.0 新機能: スケジュール管理ルート
// プロジェクトスケジュール作成
router.post('/', auth_1.authenticate, schedule_controller_1.createProjectSchedule);
// 今後のマイルストーン取得
router.get('/upcoming', auth_1.authenticate, schedule_controller_1.getUpcomingMilestones);
// マイルストーン通知送信（システム用）
router.post('/notifications', schedule_controller_1.sendMilestoneNotifications);
// プロジェクトスケジュール取得
router.get('/project/:projectId', auth_1.authenticate, schedule_controller_1.getProjectSchedule);
// マイルストーン更新
router.put('/milestone/:id', auth_1.authenticate, schedule_controller_1.updateMilestone);
exports.default = router;
//# sourceMappingURL=schedule.routes.js.map