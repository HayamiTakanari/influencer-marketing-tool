"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var auth_controller_1 = require("../controllers/auth.controller");
var validation_1 = require("../middleware/validation");
var auth_1 = require("../schemas/auth");
var security_1 = require("../middleware/security");
var command_injection_protection_1 = require("../middleware/command-injection-protection");
var router = (0, express_1.Router)();
// セキュリティヘッダーを全ての認証ルートに適用
router.use(security_1.securityHeaders);
// コマンドインジェクション対策を適用
router.use(command_injection_protection_1.protectFromCommandInjection);
router.use(command_injection_protection_1.preventSystemCommands);
// 入力サニタイゼーション
router.use(security_1.sanitizeInput);
// フィールドタイプ検証
var authFieldTypes = {
    email: 'email',
    companyName: 'text',
    contactName: 'text',
    displayName: 'text'
};
router.post('/register', security_1.authRateLimit, // レート制限
(0, command_injection_protection_1.validateFieldTypes)(authFieldTypes), // フィールドタイプ検証
(0, validation_1.validate)(auth_1.registerSchema), // スキーマ検証
auth_controller_1.register);
router.post('/login', security_1.authRateLimit, // レート制限
(0, command_injection_protection_1.validateFieldTypes)({ email: 'email' }), // フィールドタイプ検証
(0, validation_1.validate)(auth_1.loginSchema), // スキーマ検証
auth_controller_1.login);
exports.default = router;
