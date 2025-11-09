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
exports.getChatList = exports.getUnreadCount = exports.markMessagesAsRead = exports.getMessages = exports.sendMessage = void 0;
var client_1 = require("@prisma/client");
var zod_1 = require("zod");
var prisma = new client_1.PrismaClient();
var sendMessageSchema = zod_1.z.object({
    projectId: zod_1.z.string(),
    content: zod_1.z.string().min(1).max(1000),
});
var sendMessage = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, _a, projectId, content, project, receiverId, message, error_1;
    var _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 3, , 4]);
                userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
                _a = sendMessageSchema.parse(req.body), projectId = _a.projectId, content = _a.content;
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
                receiverId = void 0;
                if (project.client.user.id === userId) {
                    if (!project.matchedInfluencer) {
                        return [2 /*return*/, res.status(400).json({ error: 'No matched influencer for this project' })];
                    }
                    receiverId = project.matchedInfluencer.user.id;
                }
                else if (((_c = project.matchedInfluencer) === null || _c === void 0 ? void 0 : _c.user.id) === userId) {
                    receiverId = project.client.user.id;
                }
                else {
                    return [2 /*return*/, res.status(403).json({ error: 'Not authorized to send messages in this project' })];
                }
                return [4 /*yield*/, prisma.message.create({
                        data: {
                            projectId: projectId,
                            senderId: userId,
                            receiverId: receiverId,
                            content: content,
                        },
                        include: {
                            sender: {
                                select: {
                                    id: true,
                                    role: true,
                                },
                            },
                        },
                    })];
            case 2:
                message = _d.sent();
                res.json(message);
                return [3 /*break*/, 4];
            case 3:
                error_1 = _d.sent();
                console.error('Send message error:', error_1);
                res.status(500).json({ error: 'Failed to send message' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.sendMessage = sendMessage;
var getMessages = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, projectId, _a, _b, page, _c, limit, pageNum, limitNum, skip, project, hasAccess, messages, error_2;
    var _d, _e;
    return __generator(this, function (_f) {
        switch (_f.label) {
            case 0:
                _f.trys.push([0, 3, , 4]);
                userId = (_d = req.user) === null || _d === void 0 ? void 0 : _d.id;
                projectId = req.params.projectId;
                _a = req.query, _b = _a.page, page = _b === void 0 ? 1 : _b, _c = _a.limit, limit = _c === void 0 ? 50 : _c;
                pageNum = parseInt(page);
                limitNum = parseInt(limit);
                skip = (pageNum - 1) * limitNum;
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
                project = _f.sent();
                if (!project) {
                    return [2 /*return*/, res.status(404).json({ error: 'Project not found' })];
                }
                hasAccess = project.client.user.id === userId ||
                    ((_e = project.matchedInfluencer) === null || _e === void 0 ? void 0 : _e.user.id) === userId;
                if (!hasAccess) {
                    return [2 /*return*/, res.status(403).json({ error: 'Not authorized to view messages' })];
                }
                return [4 /*yield*/, prisma.message.findMany({
                        where: { projectId: projectId },
                        include: {
                            sender: {
                                select: {
                                    id: true,
                                    role: true,
                                },
                            },
                        },
                        orderBy: { createdAt: 'desc' },
                        skip: skip,
                        take: limitNum,
                    })];
            case 2:
                messages = _f.sent();
                res.json(messages.reverse());
                return [3 /*break*/, 4];
            case 3:
                error_2 = _f.sent();
                console.error('Get messages error:', error_2);
                res.status(500).json({ error: 'Failed to get messages' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getMessages = getMessages;
var markMessagesAsRead = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, projectId, project, hasAccess, error_3;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 3, , 4]);
                userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                projectId = req.params.projectId;
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
                project = _c.sent();
                if (!project) {
                    return [2 /*return*/, res.status(404).json({ error: 'Project not found' })];
                }
                hasAccess = project.client.user.id === userId ||
                    ((_b = project.matchedInfluencer) === null || _b === void 0 ? void 0 : _b.user.id) === userId;
                if (!hasAccess) {
                    return [2 /*return*/, res.status(403).json({ error: 'Not authorized to mark messages as read' })];
                }
                return [4 /*yield*/, prisma.message.updateMany({
                        where: {
                            projectId: projectId,
                            receiverId: userId,
                            isRead: false,
                        },
                        data: {
                            isRead: true,
                        },
                    })];
            case 2:
                _c.sent();
                res.json({ message: 'Messages marked as read' });
                return [3 /*break*/, 4];
            case 3:
                error_3 = _c.sent();
                console.error('Mark messages as read error:', error_3);
                res.status(500).json({ error: 'Failed to mark messages as read' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.markMessagesAsRead = markMessagesAsRead;
var getUnreadCount = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, unreadCount, error_4;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                return [4 /*yield*/, prisma.message.count({
                        where: {
                            receiverId: userId,
                            isRead: false,
                        },
                    })];
            case 1:
                unreadCount = _b.sent();
                res.json({ unreadCount: unreadCount });
                return [3 /*break*/, 3];
            case 2:
                error_4 = _b.sent();
                console.error('Get unread count error:', error_4);
                res.status(500).json({ error: 'Failed to get unread count' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getUnreadCount = getUnreadCount;
var getChatList = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId_1, userRole_1, projects, formattedChats, error_5;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 7, , 8]);
                userId_1 = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                userRole_1 = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
                projects = void 0;
                if (!(userRole_1 === 'CLIENT')) return [3 /*break*/, 2];
                return [4 /*yield*/, prisma.project.findMany({
                        where: {
                            client: {
                                user: { id: userId_1 },
                            },
                            status: {
                                in: ['MATCHED', 'IN_PROGRESS', 'COMPLETED'],
                            },
                        },
                        include: {
                            matchedInfluencer: {
                                select: {
                                    displayName: true,
                                    user: {
                                        select: {
                                            id: true,
                                            email: true,
                                            role: true,
                                        },
                                    },
                                },
                            },
                            messages: {
                                take: 1,
                                orderBy: { createdAt: 'desc' },
                            },
                        },
                        orderBy: {
                            updatedAt: 'desc',
                        },
                    })];
            case 1:
                projects = _c.sent();
                return [3 /*break*/, 5];
            case 2:
                if (!(userRole_1 === 'INFLUENCER')) return [3 /*break*/, 4];
                return [4 /*yield*/, prisma.project.findMany({
                        where: {
                            matchedInfluencer: {
                                user: { id: userId_1 },
                            },
                            status: {
                                in: ['MATCHED', 'IN_PROGRESS', 'COMPLETED'],
                            },
                        },
                        include: {
                            client: {
                                select: {
                                    companyName: true,
                                    contactName: true,
                                    user: {
                                        select: {
                                            id: true,
                                            email: true,
                                            role: true,
                                        },
                                    },
                                },
                            },
                            messages: {
                                take: 1,
                                orderBy: { createdAt: 'desc' },
                            },
                        },
                        orderBy: {
                            updatedAt: 'desc',
                        },
                    })];
            case 3:
                projects = _c.sent();
                return [3 /*break*/, 5];
            case 4: return [2 /*return*/, res.status(403).json({ error: 'Invalid user role' })];
            case 5: return [4 /*yield*/, Promise.all(projects.map(function (project) { return __awaiter(void 0, void 0, void 0, function () {
                    var unreadCount, lastMessage;
                    var _a, _b, _c, _d;
                    return __generator(this, function (_e) {
                        switch (_e.label) {
                            case 0: return [4 /*yield*/, prisma.message.count({
                                    where: {
                                        projectId: project.id,
                                        receiverId: userId_1,
                                        isRead: false,
                                    },
                                })];
                            case 1:
                                unreadCount = _e.sent();
                                lastMessage = project.messages[0];
                                return [2 /*return*/, {
                                        id: project.id,
                                        projectId: project.id,
                                        projectTitle: project.title,
                                        lastMessage: (lastMessage === null || lastMessage === void 0 ? void 0 : lastMessage.content) || '',
                                        lastMessageTime: (lastMessage === null || lastMessage === void 0 ? void 0 : lastMessage.createdAt.toISOString()) || project.updatedAt.toISOString(),
                                        unreadCount: unreadCount,
                                        sender: {
                                            name: userRole_1 === 'CLIENT'
                                                ? ((_a = project.matchedInfluencer) === null || _a === void 0 ? void 0 : _a.displayName) || 'インフルエンサー'
                                                : ((_b = project.client) === null || _b === void 0 ? void 0 : _b.companyName) || '企業',
                                            role: userRole_1 === 'CLIENT'
                                                ? ((_c = project.matchedInfluencer) === null || _c === void 0 ? void 0 : _c.user.role) || 'INFLUENCER'
                                                : ((_d = project.client) === null || _d === void 0 ? void 0 : _d.user.role) || 'CLIENT',
                                        },
                                    }];
                        }
                    });
                }); }))];
            case 6:
                formattedChats = _c.sent();
                res.json(formattedChats);
                return [3 /*break*/, 8];
            case 7:
                error_5 = _c.sent();
                console.error('Get chat list error:', error_5);
                res.status(500).json({ error: 'Failed to get chat list' });
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); };
exports.getChatList = getChatList;
