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
exports.setupSocketServer = void 0;
var socket_io_1 = require("socket.io");
var jsonwebtoken_1 = require("jsonwebtoken");
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
var setupSocketServer = function (server) {
    var io = new socket_io_1.Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true,
        },
    });
    // Authentication middleware
    io.use(function (socket, next) { return __awaiter(void 0, void 0, void 0, function () {
        var token, decoded, user, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    token = socket.handshake.auth.token;
                    if (!token) {
                        return [2 /*return*/, next(new Error('Authentication error'))];
                    }
                    decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                    return [4 /*yield*/, prisma.user.findUnique({
                            where: { id: decoded.id },
                        })];
                case 1:
                    user = _a.sent();
                    if (!user) {
                        return [2 /*return*/, next(new Error('User not found'))];
                    }
                    socket.userId = user.id;
                    socket.userRole = user.role;
                    next();
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    next(new Error('Authentication error'));
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    io.on('connection', function (socket) {
        console.log("User ".concat(socket.userId, " connected"));
        // Join user to their own room
        socket.join(socket.userId);
        // Join project rooms
        socket.on('join-project', function (projectId) {
            socket.join("project-".concat(projectId));
        });
        // Leave project rooms
        socket.on('leave-project', function (projectId) {
            socket.leave("project-".concat(projectId));
        });
        // Handle new message
        socket.on('send-message', function (data) { return __awaiter(void 0, void 0, void 0, function () {
            var projectId, content, project, receiverId, message, error_2;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 3, , 4]);
                        projectId = data.projectId, content = data.content;
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
                        project = _b.sent();
                        if (!project) {
                            socket.emit('error', { message: 'Project not found' });
                            return [2 /*return*/];
                        }
                        receiverId = void 0;
                        if (project.client.user.id === socket.userId) {
                            if (!project.matchedInfluencer) {
                                socket.emit('error', { message: 'No matched influencer for this project' });
                                return [2 /*return*/];
                            }
                            receiverId = project.matchedInfluencer.user.id;
                        }
                        else if (((_a = project.matchedInfluencer) === null || _a === void 0 ? void 0 : _a.user.id) === socket.userId) {
                            receiverId = project.client.user.id;
                        }
                        else {
                            socket.emit('error', { message: 'Not authorized to send messages in this project' });
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, prisma.message.create({
                                data: {
                                    projectId: projectId,
                                    senderId: socket.userId,
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
                        message = _b.sent();
                        // Emit to project room
                        io.to("project-".concat(projectId)).emit('new-message', message);
                        // Emit to receiver's personal room for notifications
                        io.to(receiverId).emit('message-notification', {
                            projectId: projectId,
                            message: message,
                        });
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _b.sent();
                        console.error('Send message error:', error_2);
                        socket.emit('error', { message: 'Failed to send message' });
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        // Handle typing indicators
        socket.on('typing-start', function (projectId) {
            socket.to("project-".concat(projectId)).emit('user-typing', {
                userId: socket.userId,
                projectId: projectId,
            });
        });
        socket.on('typing-stop', function (projectId) {
            socket.to("project-".concat(projectId)).emit('user-stop-typing', {
                userId: socket.userId,
                projectId: projectId,
            });
        });
        // Handle message read status
        socket.on('mark-messages-read', function (projectId) { return __awaiter(void 0, void 0, void 0, function () {
            var error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, prisma.message.updateMany({
                                where: {
                                    projectId: projectId,
                                    receiverId: socket.userId,
                                    isRead: false,
                                },
                                data: {
                                    isRead: true,
                                },
                            })];
                    case 1:
                        _a.sent();
                        // Notify sender that messages were read
                        socket.to("project-".concat(projectId)).emit('messages-read', {
                            projectId: projectId,
                            readBy: socket.userId,
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_3 = _a.sent();
                        console.error('Mark messages read error:', error_3);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        // Handle online status
        socket.on('user-online', function () {
            socket.broadcast.emit('user-status', {
                userId: socket.userId,
                status: 'online',
            });
        });
        socket.on('disconnect', function () {
            console.log("User ".concat(socket.userId, " disconnected"));
            // Notify others that user went offline
            socket.broadcast.emit('user-status', {
                userId: socket.userId,
                status: 'offline',
            });
        });
    });
    return io;
};
exports.setupSocketServer = setupSocketServer;
