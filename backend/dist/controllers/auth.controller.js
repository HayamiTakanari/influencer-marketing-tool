"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
var client_1 = require("@prisma/client");
var password_1 = require("../utils/password");
var jwt_1 = require("../utils/jwt");
var prisma = new client_1.PrismaClient({
    // SQLインジェクション対策として、ログレベルを設定
    log: ['warn', 'error'],
    // データベース接続の制限
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});
var register = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, email_1, password_2, role_1, companyName_1, contactName_1, displayName_1, result, token, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, email_1 = _a.email, password_2 = _a.password, role_1 = _a.role, companyName_1 = _a.companyName, contactName_1 = _a.contactName, displayName_1 = _a.displayName;
                return [4 /*yield*/, prisma.$transaction(function (tx) { return __awaiter(void 0, void 0, void 0, function () {
                        var existingUser, hashedPassword, user;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, tx.user.findUnique({
                                        where: { email: email_1 },
                                        select: { id: true } // 必要な情報のみ取得
                                    })];
                                case 1:
                                    existingUser = _a.sent();
                                    if (existingUser) {
                                        throw new Error('Email already registered');
                                    }
                                    return [4 /*yield*/, (0, password_1.hashPassword)(password_2)];
                                case 2:
                                    hashedPassword = _a.sent();
                                    return [4 /*yield*/, tx.user.create({
                                            data: {
                                                email: email_1.toLowerCase().trim(), // 正規化
                                                password: hashedPassword,
                                                role: role_1,
                                            },
                                            select: {
                                                id: true,
                                                email: true,
                                                role: true,
                                                createdAt: true
                                            }
                                        })];
                                case 3:
                                    user = _a.sent();
                                    if (!(role_1 === 'CLIENT' && companyName_1 && contactName_1)) return [3 /*break*/, 5];
                                    return [4 /*yield*/, tx.client.create({
                                            data: {
                                                userId: user.id,
                                                companyName: companyName_1.trim(),
                                                contactName: contactName_1.trim(),
                                            },
                                        })];
                                case 4:
                                    _a.sent();
                                    return [3 /*break*/, 7];
                                case 5:
                                    if (!(role_1 === 'INFLUENCER' && displayName_1)) return [3 /*break*/, 7];
                                    return [4 /*yield*/, tx.influencer.create({
                                            data: {
                                                userId: user.id,
                                                displayName: displayName_1.trim(),
                                                isRegistered: true,
                                            },
                                        })];
                                case 6:
                                    _a.sent();
                                    _a.label = 7;
                                case 7: return [2 /*return*/, user];
                            }
                        });
                    }); })];
            case 1:
                result = _b.sent();
                token = (0, jwt_1.generateToken)(result);
                // セキュリティログ
                console.log("User registered: ".concat(result.id, " (").concat(result.email, ") - Role: ").concat(result.role));
                res.status(201).json({
                    message: 'User registered successfully',
                    token: token,
                    user: {
                        id: result.id,
                        email: result.email,
                        role: result.role,
                    },
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _b.sent();
                console.error('Registration error:', error_1);
                if (error_1 instanceof Error && error_1.message === 'Email already registered') {
                    res.status(400).json({ error: 'Email already registered' });
                    return [2 /*return*/];
                }
                res.status(500).json({ error: 'Internal server error' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.register = register;
var login = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, email, password, clientIP, user, isPasswordValid, tokenUser, token, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                _a = req.body, email = _a.email, password = _a.password;
                clientIP = req.ip || req.connection.remoteAddress || 'unknown';
                return [4 /*yield*/, prisma.user.findUnique({
                        where: { email: email.toLowerCase().trim() },
                        select: {
                            id: true,
                            email: true,
                            password: true,
                            role: true,
                            isVerified: true,
                            client: {
                                select: {
                                    id: true,
                                    companyName: true,
                                    contactName: true
                                }
                            },
                            influencer: {
                                select: {
                                    id: true,
                                    displayName: true,
                                    isRegistered: true
                                }
                            }
                        },
                    })];
            case 1:
                user = _b.sent();
                if (!user) {
                    // セキュリティログ：失敗した認証試行
                    console.warn("Failed login attempt for email: ".concat(email, " from IP: ").concat(clientIP));
                    res.status(401).json({ error: 'Invalid credentials' });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, (0, password_1.comparePassword)(password, user.password)];
            case 2:
                isPasswordValid = _b.sent();
                if (!isPasswordValid) {
                    // セキュリティログ：パスワード不一致
                    console.warn("Invalid password for user: ".concat(user.id, " from IP: ").concat(clientIP));
                    res.status(401).json({ error: 'Invalid credentials' });
                    return [2 /*return*/];
                }
                tokenUser = {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    isVerified: user.isVerified
                };
                token = (0, jwt_1.generateToken)(tokenUser);
                // 成功ログ
                console.log("Successful login: ".concat(user.id, " (").concat(user.email, ") from IP: ").concat(clientIP));
                res.json({
                    message: 'Login successful',
                    token: token,
                    user: {
                        id: user.id,
                        email: user.email,
                        role: user.role,
                        profile: user.client || user.influencer,
                    },
                });
                return [3 /*break*/, 4];
            case 3:
                error_2 = _b.sent();
                console.error('Login error:', error_2);
                res.status(500).json({ error: 'Internal server error' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.login = login;
