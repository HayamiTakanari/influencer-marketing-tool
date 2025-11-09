"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var auth_1 = require("../middleware/auth");
var achievement_controller_1 = require("../controllers/achievement.controller");
var router = (0, express_1.Router)();
// v3.0 新機能: 実績管理ルート
// 実績作成
router.post('/', auth_1.authenticate, achievement_controller_1.createAchievement);
// 自分の実績一覧取得
router.get('/my-achievements', auth_1.authenticate, achievement_controller_1.getMyAchievements);
// 実績統計取得
router.get('/stats', auth_1.authenticate, achievement_controller_1.getAchievementStats);
// 特定インフルエンサーの実績一覧取得（公開情報）
router.get('/influencer/:influencerId', achievement_controller_1.getAchievementsByInfluencer);
// 実績更新
router.put('/:id', auth_1.authenticate, achievement_controller_1.updateAchievement);
// 実績削除
router.delete('/:id', auth_1.authenticate, achievement_controller_1.deleteAchievement);
exports.default = router;
