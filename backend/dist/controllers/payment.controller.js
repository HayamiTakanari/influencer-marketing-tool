"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.handleStripeWebhook = exports.getPaymentStats = exports.refundPayment = exports.getPaymentHistory = exports.confirmPayment = exports.createPaymentIntent = void 0;
var client_1 = require("@prisma/client");
var stripe_1 = require("stripe");
var zod_1 = require("zod");
var prisma = new client_1.PrismaClient();
var stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-09-30.clover',
});
var createPaymentIntentSchema = zod_1.z.object({
    projectId: zod_1.z.string(),
    amount: zod_1.z.number().min(100), // Minimum amount in cents/yen
});
var confirmPaymentSchema = zod_1.z.object({
    paymentIntentId: zod_1.z.string(),
    projectId: zod_1.z.string(),
});
var createPaymentIntent = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, _a, projectId, amount, project, fee, totalAmount, paymentIntent, error_1;
    var _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 3, , 4]);
                userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
                _a = createPaymentIntentSchema.parse(req.body), projectId = _a.projectId, amount = _a.amount;
                return [4 /*yield*/, prisma.project.findUnique({
                        where: { id: projectId },
                        include: {
                            client: {
                                include: { user: true },
                            },
                            matchedInfluencer: {
                                include: { user: true },
                            },
                        },
                    })];
            case 1:
                project = _d.sent();
                if (!project) {
                    return [2 /*return*/, res.status(404).json({ error: 'Project not found' })];
                }
                if (project.client.user.id !== userId) {
                    return [2 /*return*/, res.status(403).json({ error: 'Not authorized to create payment for this project' })];
                }
                if (project.status !== 'IN_PROGRESS') {
                    return [2 /*return*/, res.status(400).json({ error: 'Project must be in progress to create payment' })];
                }
                fee = Math.round(amount * 0.1);
                totalAmount = amount + fee;
                return [4 /*yield*/, stripe.paymentIntents.create({
                        amount: totalAmount,
                        currency: 'jpy',
                        metadata: {
                            projectId: projectId,
                            clientId: project.client.id,
                            influencerId: ((_c = project.matchedInfluencer) === null || _c === void 0 ? void 0 : _c.id) || '',
                            originalAmount: amount.toString(),
                            fee: fee.toString(),
                        },
                    })];
            case 2:
                paymentIntent = _d.sent();
                res.json({
                    clientSecret: paymentIntent.client_secret,
                    paymentIntentId: paymentIntent.id,
                    amount: totalAmount,
                    fee: fee,
                });
                return [3 /*break*/, 4];
            case 3:
                error_1 = _d.sent();
                console.error('Create payment intent error:', error_1);
                res.status(500).json({ error: 'Failed to create payment intent' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.createPaymentIntent = createPaymentIntent;
var confirmPayment = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, _a, paymentIntentId, projectId, project, paymentIntent, existingTransaction, transaction, error_2;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 6, , 7]);
                userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
                _a = confirmPaymentSchema.parse(req.body), paymentIntentId = _a.paymentIntentId, projectId = _a.projectId;
                return [4 /*yield*/, prisma.project.findUnique({
                        where: { id: projectId },
                        include: {
                            client: {
                                include: { user: true },
                            },
                        },
                    })];
            case 1:
                project = _c.sent();
                if (!project) {
                    return [2 /*return*/, res.status(404).json({ error: 'Project not found' })];
                }
                if (project.client.user.id !== userId) {
                    return [2 /*return*/, res.status(403).json({ error: 'Not authorized to confirm payment for this project' })];
                }
                return [4 /*yield*/, stripe.paymentIntents.retrieve(paymentIntentId)];
            case 2:
                paymentIntent = _c.sent();
                if (paymentIntent.status !== 'succeeded') {
                    return [2 /*return*/, res.status(400).json({ error: 'Payment has not succeeded' })];
                }
                return [4 /*yield*/, prisma.transaction.findUnique({
                        where: { stripePaymentId: paymentIntentId },
                    })];
            case 3:
                existingTransaction = _c.sent();
                if (existingTransaction) {
                    return [2 /*return*/, res.status(400).json({ error: 'Transaction already recorded' })];
                }
                return [4 /*yield*/, prisma.transaction.create({
                        data: {
                            projectId: projectId,
                            amount: parseInt(paymentIntent.metadata.originalAmount),
                            fee: parseInt(paymentIntent.metadata.fee),
                            stripePaymentId: paymentIntentId,
                            status: 'completed',
                        },
                    })];
            case 4:
                transaction = _c.sent();
                // Update project status
                return [4 /*yield*/, prisma.project.update({
                        where: { id: projectId },
                        data: { status: 'COMPLETED' },
                    })];
            case 5:
                // Update project status
                _c.sent();
                res.json({
                    transaction: transaction,
                    message: 'Payment confirmed successfully',
                });
                return [3 /*break*/, 7];
            case 6:
                error_2 = _c.sent();
                console.error('Confirm payment error:', error_2);
                res.status(500).json({ error: 'Failed to confirm payment' });
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); };
exports.confirmPayment = confirmPayment;
var getPaymentHistory = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, userRole, whereClause, transactions, error_3;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
                userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
                whereClause = {};
                if (userRole === 'CLIENT' || userRole === 'COMPANY') {
                    whereClause = {
                        project: {
                            client: {
                                user: { id: userId },
                            },
                        },
                    };
                }
                else if (userRole === 'INFLUENCER') {
                    whereClause = {
                        project: {
                            matchedInfluencer: {
                                user: { id: userId },
                            },
                        },
                    };
                }
                else {
                    return [2 /*return*/, res.status(403).json({ error: 'Invalid user role' })];
                }
                return [4 /*yield*/, prisma.transaction.findMany({
                        where: whereClause,
                        include: {
                            project: {
                                include: {
                                    client: {
                                        select: {
                                            companyName: true,
                                            contactName: true,
                                        },
                                    },
                                    matchedInfluencer: {
                                        select: {
                                            displayName: true,
                                        },
                                    },
                                },
                            },
                        },
                        orderBy: { createdAt: 'desc' },
                    })];
            case 1:
                transactions = _c.sent();
                res.json({ transactions: transactions });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _c.sent();
                console.error('Get payment history error:', error_3);
                res.status(500).json({ error: 'Failed to get payment history' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getPaymentHistory = getPaymentHistory;
var refundPayment = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, transactionId, transaction, refund, error_4;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 5, , 6]);
                userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                transactionId = req.params.transactionId;
                return [4 /*yield*/, prisma.transaction.findUnique({
                        where: { id: transactionId },
                        include: {
                            project: {
                                include: {
                                    client: {
                                        include: { user: true },
                                    },
                                },
                            },
                        },
                    })];
            case 1:
                transaction = _b.sent();
                if (!transaction) {
                    return [2 /*return*/, res.status(404).json({ error: 'Transaction not found' })];
                }
                // Only client can request refund
                if (transaction.project.client.user.id !== userId) {
                    return [2 /*return*/, res.status(403).json({ error: 'Not authorized to refund this transaction' })];
                }
                if (transaction.status !== 'completed') {
                    return [2 /*return*/, res.status(400).json({ error: 'Only completed transactions can be refunded' })];
                }
                return [4 /*yield*/, stripe.refunds.create({
                        payment_intent: transaction.stripePaymentId,
                        amount: transaction.amount + transaction.fee,
                    })];
            case 2:
                refund = _b.sent();
                // Update transaction status
                return [4 /*yield*/, prisma.transaction.update({
                        where: { id: transactionId },
                        data: { status: 'refunded' },
                    })];
            case 3:
                // Update transaction status
                _b.sent();
                // Update project status
                return [4 /*yield*/, prisma.project.update({
                        where: { id: transaction.projectId },
                        data: { status: 'CANCELLED' },
                    })];
            case 4:
                // Update project status
                _b.sent();
                res.json({
                    refund: refund,
                    message: 'Payment refunded successfully',
                });
                return [3 /*break*/, 6];
            case 5:
                error_4 = _b.sent();
                console.error('Refund payment error:', error_4);
                res.status(500).json({ error: 'Failed to refund payment' });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.refundPayment = refundPayment;
var getPaymentStats = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, userRole, whereClause, now, startOfMonth, endOfMonth, _a, totalEarnings, currentMonthEarnings, completedProjects, recentProjects, totalEarned, currentMonthEarned, averageProjectValue, pendingPayments, formattedProjects, error_5;
    var _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 3, , 4]);
                userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
                userRole = (_c = req.user) === null || _c === void 0 ? void 0 : _c.role;
                if (userRole !== 'INFLUENCER') {
                    return [2 /*return*/, res.status(403).json({ error: 'Only influencers can access revenue stats' })];
                }
                whereClause = {
                    project: {
                        matchedInfluencer: {
                            user: { id: userId },
                        },
                    },
                    status: 'completed',
                };
                now = new Date();
                startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
                return [4 /*yield*/, Promise.all([
                        prisma.transaction.aggregate({
                            where: whereClause,
                            _sum: {
                                amount: true,
                            },
                        }),
                        prisma.transaction.aggregate({
                            where: __assign(__assign({}, whereClause), { createdAt: {
                                    gte: startOfMonth,
                                    lte: endOfMonth,
                                } }),
                            _sum: {
                                amount: true,
                            },
                        }),
                        prisma.transaction.count({
                            where: whereClause,
                        }),
                        prisma.project.findMany({
                            where: {
                                matchedInfluencer: {
                                    user: { id: userId },
                                },
                                status: 'COMPLETED',
                            },
                            include: {
                                client: {
                                    select: {
                                        companyName: true,
                                    },
                                },
                                transaction: {
                                    select: {
                                        amount: true,
                                    },
                                },
                            },
                            orderBy: {
                                updatedAt: 'desc',
                            },
                            take: 10,
                        }),
                    ])];
            case 1:
                _a = _d.sent(), totalEarnings = _a[0], currentMonthEarnings = _a[1], completedProjects = _a[2], recentProjects = _a[3];
                totalEarned = totalEarnings._sum.amount || 0;
                currentMonthEarned = currentMonthEarnings._sum.amount || 0;
                averageProjectValue = completedProjects > 0 ? Math.round(totalEarned / completedProjects) : 0;
                return [4 /*yield*/, prisma.project.count({
                        where: {
                            matchedInfluencer: {
                                user: { id: userId },
                            },
                            status: 'IN_PROGRESS',
                        },
                    })];
            case 2:
                pendingPayments = _d.sent();
                formattedProjects = recentProjects.map(function (project) {
                    var _a;
                    return ({
                        id: project.id,
                        title: project.title,
                        amount: ((_a = project.transaction) === null || _a === void 0 ? void 0 : _a.amount) || 0,
                        status: 'completed',
                        completedAt: project.updatedAt.toISOString(),
                        client: {
                            companyName: project.client.companyName,
                        },
                    });
                });
                res.json({
                    totalEarnings: totalEarned,
                    currentMonthEarnings: currentMonthEarned,
                    completedProjects: completedProjects,
                    pendingPayments: pendingPayments,
                    averageProjectValue: averageProjectValue,
                    recentProjects: formattedProjects,
                });
                return [3 /*break*/, 4];
            case 3:
                error_5 = _d.sent();
                console.error('Get payment stats error:', error_5);
                res.status(500).json({ error: 'Failed to get payment stats' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getPaymentStats = getPaymentStats;
// Webhook handler for Stripe events
var handleStripeWebhook = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var sig, event, _a, paymentIntent, failedPayment;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                sig = req.headers['stripe-signature'];
                try {
                    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
                }
                catch (err) {
                    console.log("Webhook signature verification failed.", err.message);
                    return [2 /*return*/, res.status(400).send("Webhook Error: ".concat(err.message))];
                }
                _a = event.type;
                switch (_a) {
                    case 'payment_intent.succeeded': return [3 /*break*/, 1];
                    case 'payment_intent.payment_failed': return [3 /*break*/, 2];
                }
                return [3 /*break*/, 4];
            case 1:
                paymentIntent = event.data.object;
                console.log('Payment succeeded:', paymentIntent.id);
                return [3 /*break*/, 5];
            case 2:
                failedPayment = event.data.object;
                console.log('Payment failed:', failedPayment.id);
                // Update transaction status to failed
                return [4 /*yield*/, prisma.transaction.updateMany({
                        where: { stripePaymentId: failedPayment.id },
                        data: { status: 'failed' },
                    })];
            case 3:
                // Update transaction status to failed
                _b.sent();
                return [3 /*break*/, 5];
            case 4:
                console.log("Unhandled event type ".concat(event.type));
                _b.label = 5;
            case 5:
                res.json({ received: true });
                return [2 /*return*/];
        }
    });
}); };
exports.handleStripeWebhook = handleStripeWebhook;
