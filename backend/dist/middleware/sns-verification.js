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
exports.verifySNSConnections = void 0;
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
var verifySNSConnections = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, user, connectedPlatforms, error_1;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    return [2 /*return*/, res.status(401).json({ error: '認証が必要です' })];
                }
                return [4 /*yield*/, prisma.user.findUnique({
                        where: { id: userId },
                        include: {
                            influencer: {
                                include: {
                                    socialAccounts: true,
                                },
                            },
                        },
                    })];
            case 1:
                user = _b.sent();
                // インフルエンサーのみチェック
                if ((user === null || user === void 0 ? void 0 : user.role) === 'INFLUENCER' && user.influencer) {
                    connectedPlatforms = user.influencer.socialAccounts
                        .filter(function (account) { return account.isConnected; })
                        .map(function (account) { return account.platform; });
                    // 少なくとも1つのSNSアカウントが連携されているかチェック
                    if (connectedPlatforms.length === 0) {
                        return [2 /*return*/, res.status(403).json({
                                error: 'SNSアカウントの連携が必要です',
                                message: '案件に応募するには、少なくとも1つのSNSアカウントを連携してください',
                            })];
                    }
                }
                next();
                return [3 /*break*/, 3];
            case 2:
                error_1 = _b.sent();
                console.error('SNS verification error:', error_1);
                res.status(500).json({ error: 'SNS連携の確認中にエラーが発生しました' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.verifySNSConnections = verifySNSConnections;
