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
exports.updateProjectStatus = exports.deleteProject = exports.updateProject = exports.getProjectById = exports.getMyProjects = exports.createProject = exports.getProjectCategories = exports.rejectApplication = exports.acceptApplication = exports.getApplicationsForMyProjects = exports.getMyApplications = exports.applyToProject = exports.getAvailableProjects = void 0;
var client_1 = require("@prisma/client");
var zod_1 = require("zod");
var notification_service_1 = require("../services/notification.service");
var prisma = new client_1.PrismaClient();
var getAvailableProjectsSchema = zod_1.z.object({
    category: zod_1.z.string().optional(),
    minBudget: zod_1.z.number().optional(),
    maxBudget: zod_1.z.number().optional(),
    platforms: zod_1.z.array(zod_1.z.nativeEnum(client_1.Platform)).optional(),
    prefecture: zod_1.z.string().optional(),
    page: zod_1.z.number().default(1),
    limit: zod_1.z.number().default(20),
});
var applyToProjectSchema = zod_1.z.object({
    projectId: zod_1.z.string(),
    message: zod_1.z.string().min(1, 'Message is required'),
    proposedPrice: zod_1.z.number().min(0, 'Proposed price must be positive'),
});
var getAvailableProjects = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, userRole, query, skip, influencer_1, where, connectedPlatforms, _a, projects, total, projectsWithMatchInfo, totalPages, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                userId = req.user.userId;
                userRole = req.user.role;
                if (userRole !== 'INFLUENCER') {
                    return [2 /*return*/, res.status(403).json({ error: 'Only influencers can view available projects' })];
                }
                query = getAvailableProjectsSchema.parse(req.query);
                skip = (query.page - 1) * query.limit;
                return [4 /*yield*/, prisma.influencer.findUnique({
                        where: { userId: userId },
                        include: {
                            socialAccounts: true,
                        },
                    })];
            case 1:
                influencer_1 = _b.sent();
                if (!influencer_1) {
                    return [2 /*return*/, res.status(404).json({ error: 'Influencer profile not found' })];
                }
                where = {
                    status: 'PENDING',
                    endDate: { gte: new Date() }, // Only show projects that haven't ended
                };
                if (query.category) {
                    where.category = query.category;
                }
                if (query.minBudget !== undefined || query.maxBudget !== undefined) {
                    where.budget = {};
                    if (query.minBudget !== undefined) {
                        where.budget.gte = query.minBudget;
                    }
                    if (query.maxBudget !== undefined) {
                        where.budget.lte = query.maxBudget;
                    }
                }
                if (query.platforms && query.platforms.length > 0) {
                    where.targetPlatforms = { hasSome: query.platforms };
                }
                if (query.prefecture) {
                    where.targetPrefecture = query.prefecture;
                }
                connectedPlatforms = influencer_1.socialAccounts
                    .filter(function (acc) { return acc.isConnected; })
                    .map(function (acc) { return acc.platform; });
                // 連携しているプラットフォームを使用する案件のみ表示
                if (connectedPlatforms.length > 0) {
                    where.OR = [
                        { targetPlatforms: { isEmpty: true } }, // プラットフォーム指定なしの案件
                        { targetPlatforms: { hasSome: connectedPlatforms } } // 連携済みプラットフォームを含む案件
                    ];
                }
                else {
                    // 連携していない場合はプラットフォーム指定なしの案件のみ
                    where.targetPlatforms = { isEmpty: true };
                }
                return [4 /*yield*/, Promise.all([
                        prisma.project.findMany({
                            where: where,
                            include: {
                                client: {
                                    include: {
                                        user: {
                                            select: {
                                                email: true,
                                            },
                                        },
                                    },
                                },
                                applications: {
                                    where: {
                                        influencerId: influencer_1.id,
                                    },
                                },
                            },
                            skip: skip,
                            take: query.limit,
                            orderBy: { createdAt: 'desc' },
                        }),
                        prisma.project.count({ where: where }),
                    ])];
            case 2:
                _a = _b.sent(), projects = _a[0], total = _a[1];
                projectsWithMatchInfo = projects.map(function (project) {
                    var isApplied = project.applications.length > 0;
                    // Check if influencer matches project criteria
                    var matchesProfile = true;
                    // Check age requirements
                    if (project.targetAgeMin && project.targetAgeMax && influencer_1.birthDate) {
                        var age = new Date().getFullYear() - influencer_1.birthDate.getFullYear();
                        if (age < project.targetAgeMin || age > project.targetAgeMax) {
                            matchesProfile = false;
                        }
                    }
                    // Check gender requirements
                    if (project.targetGender && project.targetGender !== influencer_1.gender) {
                        matchesProfile = false;
                    }
                    // Check location requirements
                    if (project.targetPrefecture && project.targetPrefecture !== '全国' &&
                        project.targetPrefecture !== influencer_1.prefecture) {
                        matchesProfile = false;
                    }
                    // Check platform requirements - インフルエンサーが連携していないSNSを使用する案件は除外
                    if (project.targetPlatforms.length > 0) {
                        var connectedPlatforms_1 = influencer_1.socialAccounts
                            .filter(function (acc) { return acc.isConnected; })
                            .map(function (acc) { return acc.platform; });
                        var hasMatchingPlatform = project.targetPlatforms.some(function (platform) {
                            return connectedPlatforms_1.includes(platform);
                        });
                        if (!hasMatchingPlatform) {
                            matchesProfile = false;
                        }
                    }
                    // Check follower count requirements
                    if (project.targetFollowerMin || project.targetFollowerMax) {
                        var totalFollowers = influencer_1.socialAccounts.reduce(function (sum, acc) { return sum + acc.followerCount; }, 0);
                        if (project.targetFollowerMin && totalFollowers < project.targetFollowerMin) {
                            matchesProfile = false;
                        }
                        if (project.targetFollowerMax && totalFollowers > project.targetFollowerMax) {
                            matchesProfile = false;
                        }
                    }
                    return __assign(__assign({}, project), { isApplied: isApplied, matchesProfile: matchesProfile, applications: undefined });
                });
                totalPages = Math.ceil(total / query.limit);
                res.json({
                    projects: projectsWithMatchInfo,
                    pagination: {
                        page: query.page,
                        limit: query.limit,
                        total: total,
                        totalPages: totalPages,
                    },
                });
                return [3 /*break*/, 4];
            case 3:
                error_1 = _b.sent();
                console.error('Get available projects error:', error_1);
                res.status(500).json({ error: 'Failed to get available projects' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getAvailableProjects = getAvailableProjects;
var applyToProject = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, userRole, _a, projectId, message, proposedPrice, influencer, project, existingApplication, application, error_2, error_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 9, , 10]);
                userId = req.user.userId;
                userRole = req.user.role;
                if (userRole !== 'INFLUENCER') {
                    return [2 /*return*/, res.status(403).json({ error: 'Only influencers can apply to projects' })];
                }
                _a = applyToProjectSchema.parse(req.body), projectId = _a.projectId, message = _a.message, proposedPrice = _a.proposedPrice;
                return [4 /*yield*/, prisma.influencer.findUnique({
                        where: { userId: userId },
                    })];
            case 1:
                influencer = _b.sent();
                if (!influencer) {
                    return [2 /*return*/, res.status(404).json({ error: 'Influencer profile not found' })];
                }
                return [4 /*yield*/, prisma.project.findUnique({
                        where: { id: projectId },
                        include: {
                            client: true,
                        },
                    })];
            case 2:
                project = _b.sent();
                if (!project) {
                    return [2 /*return*/, res.status(404).json({ error: 'Project not found' })];
                }
                if (project.status !== 'PENDING') {
                    return [2 /*return*/, res.status(400).json({ error: 'Project is no longer available for applications' })];
                }
                if (project.endDate < new Date()) {
                    return [2 /*return*/, res.status(400).json({ error: 'Project application deadline has passed' })];
                }
                return [4 /*yield*/, prisma.application.findUnique({
                        where: {
                            projectId_influencerId: {
                                projectId: projectId,
                                influencerId: influencer.id,
                            },
                        },
                    })];
            case 3:
                existingApplication = _b.sent();
                if (existingApplication) {
                    return [2 /*return*/, res.status(400).json({ error: 'You have already applied to this project' })];
                }
                return [4 /*yield*/, prisma.application.create({
                        data: {
                            projectId: projectId,
                            influencerId: influencer.id,
                            clientId: project.clientId,
                            message: message,
                            proposedPrice: proposedPrice,
                        },
                        include: {
                            influencer: {
                                include: {
                                    user: {
                                        select: {
                                            email: true,
                                        },
                                    },
                                    socialAccounts: true,
                                },
                            },
                            project: {
                                include: {
                                    client: {
                                        include: {
                                            user: {
                                                select: {
                                                    email: true,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    })];
            case 4:
                application = _b.sent();
                _b.label = 5;
            case 5:
                _b.trys.push([5, 7, , 8]);
                return [4 /*yield*/, notification_service_1.NotificationService.createApplicationReceivedNotification(project.client.userId, project.title, application.influencer.displayName, application.id)];
            case 6:
                _b.sent();
                return [3 /*break*/, 8];
            case 7:
                error_2 = _b.sent();
                console.error('Failed to send application notification:', error_2);
                return [3 /*break*/, 8];
            case 8:
                res.status(201).json(application);
                return [3 /*break*/, 10];
            case 9:
                error_3 = _b.sent();
                console.error('Apply to project error:', error_3);
                res.status(500).json({ error: 'Failed to apply to project' });
                return [3 /*break*/, 10];
            case 10: return [2 /*return*/];
        }
    });
}); };
exports.applyToProject = applyToProject;
var getMyApplications = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, userRole, influencer, applications, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                userId = req.user.userId;
                userRole = req.user.role;
                if (userRole !== 'INFLUENCER') {
                    return [2 /*return*/, res.status(403).json({ error: 'Only influencers can view their applications' })];
                }
                return [4 /*yield*/, prisma.influencer.findUnique({
                        where: { userId: userId },
                    })];
            case 1:
                influencer = _a.sent();
                if (!influencer) {
                    return [2 /*return*/, res.status(404).json({ error: 'Influencer profile not found' })];
                }
                return [4 /*yield*/, prisma.application.findMany({
                        where: {
                            influencerId: influencer.id,
                        },
                        include: {
                            project: {
                                include: {
                                    client: {
                                        include: {
                                            user: {
                                                select: {
                                                    email: true,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        orderBy: { appliedAt: 'desc' },
                    })];
            case 2:
                applications = _a.sent();
                res.json(applications);
                return [3 /*break*/, 4];
            case 3:
                error_4 = _a.sent();
                console.error('Get my applications error:', error_4);
                res.status(500).json({ error: 'Failed to get applications' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getMyApplications = getMyApplications;
var getApplicationsForMyProjects = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, userRole, client, applications, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                userId = req.user.userId;
                userRole = req.user.role;
                if (userRole !== 'CLIENT') {
                    return [2 /*return*/, res.status(403).json({ error: 'Only clients can view applications for their projects' })];
                }
                return [4 /*yield*/, prisma.client.findUnique({
                        where: { userId: userId },
                    })];
            case 1:
                client = _a.sent();
                if (!client) {
                    return [2 /*return*/, res.status(404).json({ error: 'Client profile not found' })];
                }
                return [4 /*yield*/, prisma.application.findMany({
                        where: {
                            clientId: client.id,
                        },
                        include: {
                            influencer: {
                                include: {
                                    user: {
                                        select: {
                                            email: true,
                                        },
                                    },
                                    socialAccounts: true,
                                },
                            },
                            project: true,
                        },
                        orderBy: { appliedAt: 'desc' },
                    })];
            case 2:
                applications = _a.sent();
                res.json(applications);
                return [3 /*break*/, 4];
            case 3:
                error_5 = _a.sent();
                console.error('Get applications for my projects error:', error_5);
                res.status(500).json({ error: 'Failed to get applications' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getApplicationsForMyProjects = getApplicationsForMyProjects;
var acceptApplication = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, userRole, applicationId_1, client, application_1, updatedApplication, error_6, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 9, , 10]);
                userId = req.user.userId;
                userRole = req.user.role;
                applicationId_1 = req.params.applicationId;
                if (userRole !== 'CLIENT') {
                    return [2 /*return*/, res.status(403).json({ error: 'Only clients can accept applications' })];
                }
                return [4 /*yield*/, prisma.client.findUnique({
                        where: { userId: userId },
                    })];
            case 1:
                client = _a.sent();
                if (!client) {
                    return [2 /*return*/, res.status(404).json({ error: 'Client profile not found' })];
                }
                return [4 /*yield*/, prisma.application.findUnique({
                        where: { id: applicationId_1 },
                        include: {
                            project: true,
                            influencer: true,
                        },
                    })];
            case 2:
                application_1 = _a.sent();
                if (!application_1) {
                    return [2 /*return*/, res.status(404).json({ error: 'Application not found' })];
                }
                if (application_1.clientId !== client.id) {
                    return [2 /*return*/, res.status(403).json({ error: 'You can only accept applications for your own projects' })];
                }
                if (application_1.isAccepted) {
                    return [2 /*return*/, res.status(400).json({ error: 'Application has already been accepted' })];
                }
                if (application_1.project.status !== 'PENDING') {
                    return [2 /*return*/, res.status(400).json({ error: 'Project is no longer available' })];
                }
                return [4 /*yield*/, prisma.$transaction(function (tx) { return __awaiter(void 0, void 0, void 0, function () {
                        var accepted;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, tx.application.update({
                                        where: { id: applicationId_1 },
                                        data: { isAccepted: true },
                                        include: {
                                            influencer: {
                                                include: {
                                                    user: {
                                                        select: {
                                                            id: true,
                                                            email: true,
                                                        },
                                                    },
                                                    socialAccounts: true,
                                                },
                                            },
                                            project: {
                                                include: {
                                                    client: {
                                                        include: {
                                                            user: {
                                                                select: {
                                                                    email: true,
                                                                },
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    })];
                                case 1:
                                    accepted = _a.sent();
                                    // Update project status and assign influencer
                                    return [4 /*yield*/, tx.project.update({
                                            where: { id: application_1.projectId },
                                            data: {
                                                status: 'MATCHED',
                                                matchedInfluencerId: application_1.influencerId,
                                            },
                                        })];
                                case 2:
                                    // Update project status and assign influencer
                                    _a.sent();
                                    return [2 /*return*/, accepted];
                            }
                        });
                    }); })];
            case 3:
                updatedApplication = _a.sent();
                _a.label = 4;
            case 4:
                _a.trys.push([4, 7, , 8]);
                // Notify influencer about acceptance
                return [4 /*yield*/, notification_service_1.NotificationService.createApplicationAcceptedNotification(updatedApplication.influencer.user.id, updatedApplication.project.title, updatedApplication.project.client.companyName, updatedApplication.project.id)];
            case 5:
                // Notify influencer about acceptance
                _a.sent();
                // Notify influencer about project matching
                return [4 /*yield*/, notification_service_1.NotificationService.createProjectMatchedNotification(updatedApplication.influencer.user.id, updatedApplication.project.title, updatedApplication.project.client.companyName, updatedApplication.project.id)];
            case 6:
                // Notify influencer about project matching
                _a.sent();
                return [3 /*break*/, 8];
            case 7:
                error_6 = _a.sent();
                console.error('Failed to send acceptance notifications:', error_6);
                return [3 /*break*/, 8];
            case 8:
                res.json(updatedApplication);
                return [3 /*break*/, 10];
            case 9:
                error_7 = _a.sent();
                console.error('Accept application error:', error_7);
                res.status(500).json({ error: 'Failed to accept application' });
                return [3 /*break*/, 10];
            case 10: return [2 /*return*/];
        }
    });
}); };
exports.acceptApplication = acceptApplication;
var rejectApplication = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, userRole, applicationId, client, application, error_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                userId = req.user.userId;
                userRole = req.user.role;
                applicationId = req.params.applicationId;
                if (userRole !== 'CLIENT') {
                    return [2 /*return*/, res.status(403).json({ error: 'Only clients can reject applications' })];
                }
                return [4 /*yield*/, prisma.client.findUnique({
                        where: { userId: userId },
                    })];
            case 1:
                client = _a.sent();
                if (!client) {
                    return [2 /*return*/, res.status(404).json({ error: 'Client profile not found' })];
                }
                return [4 /*yield*/, prisma.application.findUnique({
                        where: { id: applicationId },
                    })];
            case 2:
                application = _a.sent();
                if (!application) {
                    return [2 /*return*/, res.status(404).json({ error: 'Application not found' })];
                }
                if (application.clientId !== client.id) {
                    return [2 /*return*/, res.status(403).json({ error: 'You can only reject applications for your own projects' })];
                }
                if (application.isAccepted) {
                    return [2 /*return*/, res.status(400).json({ error: 'Cannot reject an already accepted application' })];
                }
                // Delete the application (soft reject)
                return [4 /*yield*/, prisma.application.delete({
                        where: { id: applicationId },
                    })];
            case 3:
                // Delete the application (soft reject)
                _a.sent();
                res.json({ message: 'Application rejected successfully' });
                return [3 /*break*/, 5];
            case 4:
                error_8 = _a.sent();
                console.error('Reject application error:', error_8);
                res.status(500).json({ error: 'Failed to reject application' });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.rejectApplication = rejectApplication;
var getProjectCategories = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var projects, categories, error_9;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, prisma.project.findMany({
                        where: {
                            status: 'PENDING',
                            endDate: { gte: new Date() },
                        },
                        select: { category: true },
                        distinct: ['category'],
                    })];
            case 1:
                projects = _a.sent();
                categories = projects.map(function (p) { return p.category; }).filter(Boolean).sort();
                res.json(categories);
                return [3 /*break*/, 3];
            case 2:
                error_9 = _a.sent();
                console.error('Get project categories error:', error_9);
                res.status(500).json({ error: 'Failed to get project categories' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getProjectCategories = getProjectCategories;
// Project CRUD operations
var createProjectSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').max(200, 'Title too long'),
    description: zod_1.z.string().min(1, 'Description is required').max(2000, 'Description too long'),
    category: zod_1.z.string().min(1, 'Category is required'),
    budget: zod_1.z.number().min(1000, 'Budget must be at least 1000 yen'),
    targetPlatforms: zod_1.z.array(zod_1.z.nativeEnum(client_1.Platform)).min(1, 'At least one platform is required'),
    targetPrefecture: zod_1.z.string().optional(),
    targetCity: zod_1.z.string().optional(),
    targetGender: zod_1.z.nativeEnum(client_1.Gender).optional(),
    targetAgeMin: zod_1.z.number().min(18).max(100).optional(),
    targetAgeMax: zod_1.z.number().min(18).max(100).optional(),
    targetFollowerMin: zod_1.z.number().min(0).optional(),
    targetFollowerMax: zod_1.z.number().min(0).optional(),
    startDate: zod_1.z.string().refine(function (date) { return !isNaN(Date.parse(date)); }, 'Invalid start date'),
    endDate: zod_1.z.string().refine(function (date) { return !isNaN(Date.parse(date)); }, 'Invalid end date'),
});
var updateProjectSchema = createProjectSchema.partial();
var createProject = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, userRole, data, client, startDate, endDate, project, error_10;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                userId = req.user.userId;
                userRole = req.user.role;
                console.log('Creating project - userId:', userId, 'userRole:', userRole);
                console.log('Request body:', JSON.stringify(req.body, null, 2));
                if (userRole !== 'CLIENT') {
                    return [2 /*return*/, res.status(403).json({ error: 'Only clients can create projects' })];
                }
                data = void 0;
                try {
                    data = createProjectSchema.parse(req.body);
                }
                catch (validationError) {
                    console.error('Validation error:', validationError);
                    return [2 /*return*/, res.status(400).json({
                            error: 'Validation error',
                            details: validationError.errors || validationError.message
                        })];
                }
                return [4 /*yield*/, prisma.client.findUnique({
                        where: { userId: userId },
                    })];
            case 1:
                client = _a.sent();
                if (!client) {
                    return [2 /*return*/, res.status(404).json({ error: 'Client profile not found' })];
                }
                startDate = new Date(data.startDate);
                endDate = new Date(data.endDate);
                console.log('Start date:', startDate, 'End date:', endDate);
                if (startDate >= endDate) {
                    return [2 /*return*/, res.status(400).json({ error: 'End date must be after start date' })];
                }
                if (startDate < new Date()) {
                    return [2 /*return*/, res.status(400).json({ error: 'Start date cannot be in the past' })];
                }
                // Validate age range
                if (data.targetAgeMin && data.targetAgeMax && data.targetAgeMin > data.targetAgeMax) {
                    return [2 /*return*/, res.status(400).json({ error: 'Minimum age cannot be greater than maximum age' })];
                }
                // Validate follower range
                if (data.targetFollowerMin && data.targetFollowerMax && data.targetFollowerMin > data.targetFollowerMax) {
                    return [2 /*return*/, res.status(400).json({ error: 'Minimum follower count cannot be greater than maximum' })];
                }
                return [4 /*yield*/, prisma.project.create({
                        data: {
                            clientId: client.id,
                            title: data.title,
                            description: data.description,
                            category: data.category,
                            budget: data.budget,
                            targetPlatforms: data.targetPlatforms,
                            targetPrefecture: data.targetPrefecture,
                            targetCity: data.targetCity,
                            targetGender: data.targetGender,
                            targetAgeMin: data.targetAgeMin,
                            targetAgeMax: data.targetAgeMax,
                            targetFollowerMin: data.targetFollowerMin,
                            targetFollowerMax: data.targetFollowerMax,
                            startDate: startDate,
                            endDate: endDate,
                        },
                        include: {
                            client: {
                                include: {
                                    user: {
                                        select: {
                                            email: true,
                                        },
                                    },
                                },
                            },
                        },
                    })];
            case 2:
                project = _a.sent();
                res.status(201).json({
                    project: project,
                    message: 'Project created successfully'
                });
                return [3 /*break*/, 4];
            case 3:
                error_10 = _a.sent();
                console.error('Create project error:', error_10);
                // より詳細なエラーメッセージを返す
                if (error_10.name === 'ZodError') {
                    return [2 /*return*/, res.status(400).json({
                            error: 'Validation error',
                            details: error_10.errors
                        })];
                }
                res.status(500).json({ error: 'Failed to create project' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.createProject = createProject;
var getMyProjects = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, userRole, client, projects, error_11;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                userId = req.user.userId;
                userRole = req.user.role;
                if (userRole !== 'CLIENT') {
                    return [2 /*return*/, res.status(403).json({ error: 'Only clients can view their projects' })];
                }
                return [4 /*yield*/, prisma.client.findUnique({
                        where: { userId: userId },
                    })];
            case 1:
                client = _a.sent();
                if (!client) {
                    return [2 /*return*/, res.status(404).json({ error: 'Client profile not found' })];
                }
                return [4 /*yield*/, prisma.project.findMany({
                        where: {
                            clientId: client.id,
                        },
                        include: {
                            client: {
                                include: {
                                    user: {
                                        select: {
                                            email: true,
                                        },
                                    },
                                },
                            },
                            applications: {
                                include: {
                                    influencer: {
                                        include: {
                                            user: {
                                                select: {
                                                    email: true,
                                                },
                                            },
                                            socialAccounts: true,
                                        },
                                    },
                                },
                            },
                            matchedInfluencer: {
                                include: {
                                    user: {
                                        select: {
                                            email: true,
                                        },
                                    },
                                    socialAccounts: true,
                                },
                            },
                            transaction: true,
                        },
                        orderBy: { createdAt: 'desc' },
                    })];
            case 2:
                projects = _a.sent();
                res.json(projects);
                return [3 /*break*/, 4];
            case 3:
                error_11 = _a.sent();
                console.error('Get my projects error:', error_11);
                res.status(500).json({ error: 'Failed to get projects' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getMyProjects = getMyProjects;
var getProjectById = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, userRole, projectId, project, client, influencer_2, hasAccess, error_12;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 7, , 8]);
                userId = req.user.userId;
                userRole = req.user.role;
                projectId = req.params.projectId;
                return [4 /*yield*/, prisma.project.findUnique({
                        where: { id: projectId },
                        include: {
                            client: {
                                include: {
                                    user: {
                                        select: {
                                            email: true,
                                        },
                                    },
                                },
                            },
                            applications: {
                                include: {
                                    influencer: {
                                        include: {
                                            user: {
                                                select: {
                                                    email: true,
                                                },
                                            },
                                            socialAccounts: true,
                                        },
                                    },
                                },
                            },
                            matchedInfluencer: {
                                include: {
                                    user: {
                                        select: {
                                            email: true,
                                        },
                                    },
                                    socialAccounts: true,
                                },
                            },
                            transaction: true,
                            messages: {
                                include: {
                                    sender: {
                                        select: {
                                            email: true,
                                        },
                                    },
                                    receiver: {
                                        select: {
                                            email: true,
                                        },
                                    },
                                },
                                orderBy: { createdAt: 'desc' },
                                take: 10,
                            },
                        },
                    })];
            case 1:
                project = _a.sent();
                if (!project) {
                    return [2 /*return*/, res.status(404).json({ error: 'Project not found' })];
                }
                if (!(userRole === 'CLIENT')) return [3 /*break*/, 3];
                return [4 /*yield*/, prisma.client.findUnique({
                        where: { userId: userId },
                    })];
            case 2:
                client = _a.sent();
                if (!client || project.clientId !== client.id) {
                    return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
                }
                return [3 /*break*/, 6];
            case 3:
                if (!(userRole === 'INFLUENCER')) return [3 /*break*/, 5];
                return [4 /*yield*/, prisma.influencer.findUnique({
                        where: { userId: userId },
                    })];
            case 4:
                influencer_2 = _a.sent();
                if (!influencer_2) {
                    return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
                }
                hasAccess = project.applications.some(function (app) { return app.influencerId === influencer_2.id; }) ||
                    project.matchedInfluencerId === influencer_2.id;
                if (!hasAccess) {
                    return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
                }
                return [3 /*break*/, 6];
            case 5: return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
            case 6:
                res.json(project);
                return [3 /*break*/, 8];
            case 7:
                error_12 = _a.sent();
                console.error('Get project by ID error:', error_12);
                res.status(500).json({ error: 'Failed to get project' });
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); };
exports.getProjectById = getProjectById;
var updateProject = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, userRole, projectId, data, client, existingProject, startDate, endDate, updateData, updatedProject, error_13;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                userId = req.user.userId;
                userRole = req.user.role;
                projectId = req.params.projectId;
                if (userRole !== 'CLIENT') {
                    return [2 /*return*/, res.status(403).json({ error: 'Only clients can update projects' })];
                }
                data = updateProjectSchema.parse(req.body);
                return [4 /*yield*/, prisma.client.findUnique({
                        where: { userId: userId },
                    })];
            case 1:
                client = _a.sent();
                if (!client) {
                    return [2 /*return*/, res.status(404).json({ error: 'Client profile not found' })];
                }
                return [4 /*yield*/, prisma.project.findUnique({
                        where: { id: projectId },
                    })];
            case 2:
                existingProject = _a.sent();
                if (!existingProject) {
                    return [2 /*return*/, res.status(404).json({ error: 'Project not found' })];
                }
                if (existingProject.clientId !== client.id) {
                    return [2 /*return*/, res.status(403).json({ error: 'You can only update your own projects' })];
                }
                // Cannot update matched or completed projects
                if (['MATCHED', 'IN_PROGRESS', 'COMPLETED'].includes(existingProject.status)) {
                    return [2 /*return*/, res.status(400).json({ error: 'Cannot update project after it has been matched' })];
                }
                startDate = void 0, endDate = void 0;
                if (data.startDate) {
                    startDate = new Date(data.startDate);
                    if (startDate < new Date()) {
                        return [2 /*return*/, res.status(400).json({ error: 'Start date cannot be in the past' })];
                    }
                }
                if (data.endDate) {
                    endDate = new Date(data.endDate);
                }
                if (startDate && endDate && startDate >= endDate) {
                    return [2 /*return*/, res.status(400).json({ error: 'End date must be after start date' })];
                }
                // Validate ranges if provided
                if (data.targetAgeMin && data.targetAgeMax && data.targetAgeMin > data.targetAgeMax) {
                    return [2 /*return*/, res.status(400).json({ error: 'Minimum age cannot be greater than maximum age' })];
                }
                if (data.targetFollowerMin && data.targetFollowerMax && data.targetFollowerMin > data.targetFollowerMax) {
                    return [2 /*return*/, res.status(400).json({ error: 'Minimum follower count cannot be greater than maximum' })];
                }
                updateData = {};
                if (data.title !== undefined)
                    updateData.title = data.title;
                if (data.description !== undefined)
                    updateData.description = data.description;
                if (data.category !== undefined)
                    updateData.category = data.category;
                if (data.budget !== undefined)
                    updateData.budget = data.budget;
                if (data.targetPlatforms !== undefined)
                    updateData.targetPlatforms = data.targetPlatforms;
                if (data.targetPrefecture !== undefined)
                    updateData.targetPrefecture = data.targetPrefecture;
                if (data.targetCity !== undefined)
                    updateData.targetCity = data.targetCity;
                if (data.targetGender !== undefined)
                    updateData.targetGender = data.targetGender;
                if (data.targetAgeMin !== undefined)
                    updateData.targetAgeMin = data.targetAgeMin;
                if (data.targetAgeMax !== undefined)
                    updateData.targetAgeMax = data.targetAgeMax;
                if (data.targetFollowerMin !== undefined)
                    updateData.targetFollowerMin = data.targetFollowerMin;
                if (data.targetFollowerMax !== undefined)
                    updateData.targetFollowerMax = data.targetFollowerMax;
                if (startDate !== undefined)
                    updateData.startDate = startDate;
                if (endDate !== undefined)
                    updateData.endDate = endDate;
                return [4 /*yield*/, prisma.project.update({
                        where: { id: projectId },
                        data: updateData,
                        include: {
                            client: {
                                include: {
                                    user: {
                                        select: {
                                            email: true,
                                        },
                                    },
                                },
                            },
                            applications: {
                                include: {
                                    influencer: {
                                        include: {
                                            user: {
                                                select: {
                                                    email: true,
                                                },
                                            },
                                            socialAccounts: true,
                                        },
                                    },
                                },
                            },
                            matchedInfluencer: {
                                include: {
                                    user: {
                                        select: {
                                            email: true,
                                        },
                                    },
                                    socialAccounts: true,
                                },
                            },
                            transaction: true,
                        },
                    })];
            case 3:
                updatedProject = _a.sent();
                res.json(updatedProject);
                return [3 /*break*/, 5];
            case 4:
                error_13 = _a.sent();
                console.error('Update project error:', error_13);
                res.status(500).json({ error: 'Failed to update project' });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.updateProject = updateProject;
var deleteProject = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, userRole, projectId, client, existingProject, error_14;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                userId = req.user.userId;
                userRole = req.user.role;
                projectId = req.params.projectId;
                if (userRole !== 'CLIENT') {
                    return [2 /*return*/, res.status(403).json({ error: 'Only clients can delete projects' })];
                }
                return [4 /*yield*/, prisma.client.findUnique({
                        where: { userId: userId },
                    })];
            case 1:
                client = _a.sent();
                if (!client) {
                    return [2 /*return*/, res.status(404).json({ error: 'Client profile not found' })];
                }
                return [4 /*yield*/, prisma.project.findUnique({
                        where: { id: projectId },
                        include: {
                            applications: true,
                            transaction: true,
                        },
                    })];
            case 2:
                existingProject = _a.sent();
                if (!existingProject) {
                    return [2 /*return*/, res.status(404).json({ error: 'Project not found' })];
                }
                if (existingProject.clientId !== client.id) {
                    return [2 /*return*/, res.status(403).json({ error: 'You can only delete your own projects' })];
                }
                // Cannot delete projects with payments
                if (existingProject.transaction) {
                    return [2 /*return*/, res.status(400).json({ error: 'Cannot delete project with completed payment' })];
                }
                // Cannot delete matched or in-progress projects
                if (['MATCHED', 'IN_PROGRESS', 'COMPLETED'].includes(existingProject.status)) {
                    return [2 /*return*/, res.status(400).json({ error: 'Cannot delete project after it has been matched' })];
                }
                // Delete project (cascade will handle applications and messages)
                return [4 /*yield*/, prisma.project.delete({
                        where: { id: projectId },
                    })];
            case 3:
                // Delete project (cascade will handle applications and messages)
                _a.sent();
                res.json({ message: 'Project deleted successfully' });
                return [3 /*break*/, 5];
            case 4:
                error_14 = _a.sent();
                console.error('Delete project error:', error_14);
                res.status(500).json({ error: 'Failed to delete project' });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.deleteProject = deleteProject;
var updateProjectStatus = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, userRole, projectId, status_1, client, existingProject, validTransitions, updatedProject, error_15;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                userId = req.user.userId;
                userRole = req.user.role;
                projectId = req.params.projectId;
                status_1 = zod_1.z.object({ status: zod_1.z.nativeEnum(client_1.ProjectStatus) }).parse(req.body).status;
                if (userRole !== 'CLIENT') {
                    return [2 /*return*/, res.status(403).json({ error: 'Only clients can update project status' })];
                }
                return [4 /*yield*/, prisma.client.findUnique({
                        where: { userId: userId },
                    })];
            case 1:
                client = _a.sent();
                if (!client) {
                    return [2 /*return*/, res.status(404).json({ error: 'Client profile not found' })];
                }
                return [4 /*yield*/, prisma.project.findUnique({
                        where: { id: projectId },
                    })];
            case 2:
                existingProject = _a.sent();
                if (!existingProject) {
                    return [2 /*return*/, res.status(404).json({ error: 'Project not found' })];
                }
                if (existingProject.clientId !== client.id) {
                    return [2 /*return*/, res.status(403).json({ error: 'You can only update your own projects' })];
                }
                validTransitions = {
                    PENDING: ['CANCELLED'],
                    MATCHED: ['IN_PROGRESS', 'CANCELLED'],
                    IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
                    COMPLETED: [],
                    CANCELLED: [],
                };
                if (!validTransitions[existingProject.status].includes(status_1)) {
                    return [2 /*return*/, res.status(400).json({
                            error: "Cannot change status from ".concat(existingProject.status, " to ").concat(status_1)
                        })];
                }
                return [4 /*yield*/, prisma.project.update({
                        where: { id: projectId },
                        data: { status: status_1 },
                        include: {
                            client: {
                                include: {
                                    user: {
                                        select: {
                                            email: true,
                                        },
                                    },
                                },
                            },
                            matchedInfluencer: {
                                include: {
                                    user: {
                                        select: {
                                            email: true,
                                        },
                                    },
                                    socialAccounts: true,
                                },
                            },
                        },
                    })];
            case 3:
                updatedProject = _a.sent();
                res.json(updatedProject);
                return [3 /*break*/, 5];
            case 4:
                error_15 = _a.sent();
                console.error('Update project status error:', error_15);
                res.status(500).json({ error: 'Failed to update project status' });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.updateProjectStatus = updateProjectStatus;
