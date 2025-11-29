"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const servicePricing_controller_1 = require("../controllers/servicePricing.controller");
const router = (0, express_1.Router)();
// v3.0 新機能: 料金体系管理ルート
// 料金設定作成
router.post('/', auth_1.authenticate, servicePricing_controller_1.createServicePricing);
// 料金設定一括作成
router.post('/bulk', auth_1.authenticate, servicePricing_controller_1.bulkCreateServicePricing);
// 自分の料金設定一覧取得
router.get('/my-pricing', auth_1.authenticate, servicePricing_controller_1.getMyServicePricing);
// 料金設定バリデーション
router.get('/validate', auth_1.authenticate, servicePricing_controller_1.validateServicePricing);
// 特定インフルエンサーの料金設定取得（公開情報）
router.get('/influencer/:influencerId', servicePricing_controller_1.getServicePricingByInfluencer);
// 料金設定更新
router.put('/:id', auth_1.authenticate, servicePricing_controller_1.updateServicePricing);
// 料金設定削除
router.delete('/:id', auth_1.authenticate, servicePricing_controller_1.deleteServicePricing);
exports.default = router;
