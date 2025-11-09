"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var auth_1 = require("../middleware/auth");
var bulkInquiry_controller_1 = require("../controllers/bulkInquiry.controller");
var router = (0, express_1.Router)();
// v3.0 新機能: 一斉問い合わせルート
// 一斉問い合わせ作成
router.post('/', auth_1.authenticate, bulkInquiry_controller_1.createBulkInquiry);
// 自分の問い合わせ一覧取得（クライアント用）
router.get('/my-inquiries', auth_1.authenticate, bulkInquiry_controller_1.getMyBulkInquiries);
// 自分への問い合わせ一覧取得（インフルエンサー用）
router.get('/my-responses', auth_1.authenticate, bulkInquiry_controller_1.getMyInquiryResponses);
// 問い合わせ統計取得
router.get('/stats', auth_1.authenticate, bulkInquiry_controller_1.getInquiryStats);
// 問い合わせ詳細取得
router.get('/:id', auth_1.authenticate, bulkInquiry_controller_1.getBulkInquiryById);
// 問い合わせ回答更新
router.put('/response/:id', auth_1.authenticate, bulkInquiry_controller_1.updateInquiryResponse);
exports.default = router;
