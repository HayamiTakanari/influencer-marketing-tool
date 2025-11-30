"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.endProject = exports.unpublishProject = exports.copyProject = exports.getMatchedProjects = exports.getCompanyProjects = exports.updateProjectStatus = exports.deleteProject = exports.updateProject = exports.getProjectById = exports.getMyProjects = exports.createProject = exports.getProjectCategories = exports.rejectApplication = exports.acceptApplication = exports.getApplicationsForMyProjects = exports.getMyApplications = exports.applyToProject = exports.getAvailableProjects = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const notification_service_1 = require("../services/notification.service");
const prisma = new client_1.PrismaClient();
const getAvailableProjectsSchema = zod_1.z.object({
    category: zod_1.z.string().optional(),
    minBudget: zod_1.z.number().optional(),
    maxBudget: zod_1.z.number().optional(),
    platforms: zod_1.z.array(zod_1.z.nativeEnum(client_1.Platform)).optional(),
    prefecture: zod_1.z.string().optional(),
    page: zod_1.z.number().default(1),
    limit: zod_1.z.number().default(20),
});
const applyToProjectSchema = zod_1.z.object({
    projectId: zod_1.z.string().optional(),
    message: zod_1.z.string().min(1, 'Message is required'),
    proposedPrice: zod_1.z.number().min(0, 'Proposed price must be positive'),
});
const getAvailableProjects = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        if (userRole !== 'INFLUENCER') {
            return res.status(403).json({ error: 'Only influencers can view available projects' });
        }
        const query = getAvailableProjectsSchema.parse(req.query);
        const skip = (query.page - 1) * query.limit;
        // Get influencer profile to match against projects
        const influencer = await prisma.influencer.findUnique({
            where: { userId },
            include: {
                socialAccounts: true,
            },
        });
        // インフルエンサーが連携しているプラットフォームを取得
        let connectedPlatforms = [];
        if (influencer) {
            connectedPlatforms = influencer.socialAccounts
                .filter(acc => acc.isVerified)
                .map(acc => acc.platform);
        }
        // Build the platform filter
        let platformFilter;
        if (connectedPlatforms.length > 0) {
            platformFilter = {
                OR: [
                    { targetPlatforms: { isEmpty: true } }, // プラットフォーム指定なしの案件
                    { targetPlatforms: { hasSome: connectedPlatforms } } // 連携済みプラットフォームを含む案件
                ]
            };
        }
        else {
            // 連携していない場合はプラットフォーム指定なしの案件のみ
            platformFilter = { targetPlatforms: { isEmpty: true } };
        }
        const where = {
            status: 'PENDING',
            isPublic: true, // インフルエンサーは公開プロジェクトのみ表示
            AND: [
                {
                    OR: [
                        { endDate: { gte: new Date() } }, // Projects with future end dates
                        { endDate: null } // Projects without end dates
                    ]
                },
                platformFilter
            ]
        };
        if (query.category) {
            where.AND.push({ category: query.category });
        }
        if (query.minBudget !== undefined || query.maxBudget !== undefined) {
            const budgetFilter = {};
            if (query.minBudget !== undefined) {
                budgetFilter.gte = query.minBudget;
            }
            if (query.maxBudget !== undefined) {
                budgetFilter.lte = query.maxBudget;
            }
            where.AND.push({ budget: budgetFilter });
        }
        if (query.platforms && query.platforms.length > 0) {
            where.AND.push({ targetPlatforms: { hasSome: query.platforms } });
        }
        if (query.prefecture) {
            where.AND.push({ targetPrefecture: query.prefecture });
        }
        const [projects, total] = await Promise.all([
            prisma.project.findMany({
                where,
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
                        where: influencer ? {
                            influencerId: influencer.id,
                        } : undefined,
                    },
                },
                skip,
                take: query.limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.project.count({ where }),
        ]);
        // Calculate if each project matches the influencer's profile
        const projectsWithMatchInfo = projects.map(project => {
            const isApplied = project.applications.length > 0;
            // Check if influencer matches project criteria
            let matchesProfile = true;
            // If no influencer profile, still show projects but don't match profile
            if (influencer) {
                // Check age requirements
                if (project.targetAgeMin && project.targetAgeMax && influencer.birthDate) {
                    const age = new Date().getFullYear() - influencer.birthDate.getFullYear();
                    if (age < project.targetAgeMin || age > project.targetAgeMax) {
                        matchesProfile = false;
                    }
                }
                // Check gender requirements
                if (project.targetGender && project.targetGender !== influencer.gender) {
                    matchesProfile = false;
                }
                // Check location requirements
                if (project.targetPrefecture && project.targetPrefecture !== '全国' &&
                    project.targetPrefecture !== influencer.prefecture) {
                    matchesProfile = false;
                }
                // Check platform requirements - インフルエンサーが連携していないSNSを使用する案件は除外
                if (project.targetPlatforms.length > 0) {
                    const connectedPlatforms = influencer.socialAccounts
                        .filter(acc => acc.isVerified)
                        .map(acc => acc.platform);
                    const hasMatchingPlatform = project.targetPlatforms.some(platform => connectedPlatforms.includes(platform));
                    if (!hasMatchingPlatform) {
                        matchesProfile = false;
                    }
                }
                // Check follower count requirements
                if (project.targetFollowerMin || project.targetFollowerMax) {
                    const totalFollowers = influencer.socialAccounts.reduce((sum, acc) => sum + acc.followerCount, 0);
                    if (project.targetFollowerMin && totalFollowers < project.targetFollowerMin) {
                        matchesProfile = false;
                    }
                    if (project.targetFollowerMax && totalFollowers > project.targetFollowerMax) {
                        matchesProfile = false;
                    }
                }
            }
            return {
                ...project,
                isApplied,
                matchesProfile,
                applications: undefined, // Remove applications from response
            };
        });
        const totalPages = Math.ceil(total / query.limit);
        res.json({
            projects: projectsWithMatchInfo,
            pagination: {
                page: query.page,
                limit: query.limit,
                total,
                totalPages,
            },
        });
    }
    catch (error) {
        console.error('Get available projects error:', error);
        res.status(500).json({ error: 'Failed to get available projects' });
    }
};
exports.getAvailableProjects = getAvailableProjects;
const applyToProject = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        if (userRole !== 'INFLUENCER') {
            return res.status(403).json({ error: 'Only influencers can apply to projects' });
        }
        // Get projectId from either URL params or request body
        const projectId = req.params.projectId || req.body.projectId;
        const { message, proposedPrice } = applyToProjectSchema.parse(req.body);
        // Check if project exists and is available
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                client: true,
            },
        });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        if (project.status !== 'PENDING') {
            return res.status(400).json({ error: 'Project is no longer available for applications' });
        }
        if (project.endDate < new Date()) {
            return res.status(400).json({ error: 'Project application deadline has passed' });
        }
        // Get or create influencer profile
        let influencer = await prisma.influencer.findUnique({
            where: { userId },
        });
        // If influencer profile doesn't exist, create a basic one
        if (!influencer) {
            influencer = await prisma.influencer.create({
                data: {
                    userId,
                    displayName: '',
                    bio: '',
                    birthDate: null,
                    gender: null,
                    prefecture: '',
                    socialAccounts: {
                        create: [],
                    },
                },
            });
        }
        // Check if already applied
        const existingApplication = await prisma.application.findUnique({
            where: {
                projectId_influencerId: {
                    projectId,
                    influencerId: influencer.id,
                },
            },
        });
        if (existingApplication) {
            return res.status(400).json({ error: 'You have already applied to this project' });
        }
        // Create application
        const application = await prisma.application.create({
            data: {
                projectId,
                influencerId: influencer.id,
                clientId: project.clientId,
                message,
                proposedPrice,
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
        });
        // Send notification to client
        try {
            await notification_service_1.NotificationService.createApplicationReceivedNotification(project.client.userId, project.title, application.influencer.displayName, application.id);
        }
        catch (error) {
            console.error('Failed to send application notification:', error);
        }
        res.status(201).json(application);
    }
    catch (error) {
        console.error('Apply to project error:', error);
        res.status(500).json({ error: 'Failed to apply to project' });
    }
};
exports.applyToProject = applyToProject;
const getMyApplications = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        if (userRole !== 'INFLUENCER') {
            return res.status(403).json({ error: 'Only influencers can view their applications' });
        }
        // Get influencer profile
        const influencer = await prisma.influencer.findUnique({
            where: { userId },
        });
        if (!influencer) {
            return res.status(404).json({ error: 'Influencer profile not found' });
        }
        const applications = await prisma.application.findMany({
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
        });
        res.json(applications);
    }
    catch (error) {
        console.error('Get my applications error:', error);
        res.status(500).json({ error: 'Failed to get applications' });
    }
};
exports.getMyApplications = getMyApplications;
const getApplicationsForMyProjects = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        if (userRole !== 'CLIENT') {
            return res.status(403).json({ error: 'Only clients can view applications for their projects' });
        }
        // Get client profile
        const client = await prisma.client.findUnique({
            where: { userId },
        });
        if (!client) {
            return res.status(404).json({ error: 'Client profile not found' });
        }
        const applications = await prisma.application.findMany({
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
        });
        res.json(applications);
    }
    catch (error) {
        console.error('Get applications for my projects error:', error);
        res.status(500).json({ error: 'Failed to get applications' });
    }
};
exports.getApplicationsForMyProjects = getApplicationsForMyProjects;
const acceptApplication = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { applicationId } = req.params;
        if (userRole !== 'CLIENT') {
            return res.status(403).json({ error: 'Only clients can accept applications' });
        }
        // Get client profile
        const client = await prisma.client.findUnique({
            where: { userId },
        });
        if (!client) {
            return res.status(404).json({ error: 'Client profile not found' });
        }
        // Get application
        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: {
                project: true,
                influencer: true,
            },
        });
        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }
        if (application.clientId !== client.id) {
            return res.status(403).json({ error: 'You can only accept applications for your own projects' });
        }
        if (application.isAccepted) {
            return res.status(400).json({ error: 'Application has already been accepted' });
        }
        if (application.project.status !== 'PENDING') {
            return res.status(400).json({ error: 'Project is no longer available' });
        }
        // Accept application and update project
        const updatedApplication = await prisma.$transaction(async (tx) => {
            // Accept the application
            const accepted = await tx.application.update({
                where: { id: applicationId },
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
            });
            // Update project status and assign influencer
            await tx.project.update({
                where: { id: application.projectId },
                data: {
                    status: 'MATCHED',
                    matchedInfluencerId: application.influencerId,
                },
            });
            return accepted;
        });
        // Send notifications
        try {
            // Notify influencer about acceptance
            await notification_service_1.NotificationService.createApplicationAcceptedNotification(updatedApplication.influencer.user.id, updatedApplication.project.title, updatedApplication.project.client.companyName, updatedApplication.project.id);
            // Notify influencer about project matching
            await notification_service_1.NotificationService.createProjectMatchedNotification(updatedApplication.influencer.user.id, updatedApplication.project.title, updatedApplication.project.client.companyName, updatedApplication.project.id);
        }
        catch (error) {
            console.error('Failed to send acceptance notifications:', error);
        }
        res.json(updatedApplication);
    }
    catch (error) {
        console.error('Accept application error:', error);
        res.status(500).json({ error: 'Failed to accept application' });
    }
};
exports.acceptApplication = acceptApplication;
const rejectApplication = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { applicationId } = req.params;
        if (userRole !== 'CLIENT') {
            return res.status(403).json({ error: 'Only clients can reject applications' });
        }
        // Get client profile
        const client = await prisma.client.findUnique({
            where: { userId },
        });
        if (!client) {
            return res.status(404).json({ error: 'Client profile not found' });
        }
        // Get application
        const application = await prisma.application.findUnique({
            where: { id: applicationId },
        });
        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }
        if (application.clientId !== client.id) {
            return res.status(403).json({ error: 'You can only reject applications for your own projects' });
        }
        if (application.isAccepted) {
            return res.status(400).json({ error: 'Cannot reject an already accepted application' });
        }
        // Delete the application (soft reject)
        await prisma.application.delete({
            where: { id: applicationId },
        });
        res.json({ message: 'Application rejected successfully' });
    }
    catch (error) {
        console.error('Reject application error:', error);
        res.status(500).json({ error: 'Failed to reject application' });
    }
};
exports.rejectApplication = rejectApplication;
const getProjectCategories = async (req, res) => {
    try {
        const projects = await prisma.project.findMany({
            where: {
                status: 'PENDING',
                endDate: { gte: new Date() },
            },
            select: { category: true },
            distinct: ['category'],
        });
        const categories = projects.map(p => p.category).filter(Boolean).sort();
        res.json(categories);
    }
    catch (error) {
        console.error('Get project categories error:', error);
        res.status(500).json({ error: 'Failed to get project categories' });
    }
};
exports.getProjectCategories = getProjectCategories;
// Project CRUD operations
const createProjectSchema = zod_1.z.object({
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
    startDate: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid start date'),
    endDate: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid end date'),
});
const updateProjectSchema = createProjectSchema.partial();
const createProject = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        console.log('Creating project - userId:', userId, 'userRole:', userRole);
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        if (userRole !== 'CLIENT') {
            return res.status(403).json({ error: 'Only clients can create projects' });
        }
        let data;
        try {
            data = createProjectSchema.parse(req.body);
        }
        catch (validationError) {
            console.error('Validation error:', validationError);
            return res.status(400).json({
                error: 'Validation error',
                details: validationError.errors || validationError.message
            });
        }
        // Get client profile
        const client = await prisma.client.findUnique({
            where: { userId },
        });
        if (!client) {
            return res.status(404).json({ error: 'Client profile not found' });
        }
        // Validate dates
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);
        // UTC 00:00 に設定して、ローカルタイムゾーンの影響を避ける
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        console.log('Start date:', startDate, 'End date:', endDate, 'Today:', todayStart);
        if (startDate >= endDate) {
            return res.status(400).json({ error: 'End date must be after start date' });
        }
        // 本日以降の日付を許可（本日は許可）
        if (startDate < todayStart) {
            return res.status(400).json({ error: 'Start date cannot be in the past' });
        }
        // Validate age range
        if (data.targetAgeMin && data.targetAgeMax && data.targetAgeMin > data.targetAgeMax) {
            return res.status(400).json({ error: 'Minimum age cannot be greater than maximum age' });
        }
        // Validate follower range
        if (data.targetFollowerMin && data.targetFollowerMax && data.targetFollowerMin > data.targetFollowerMax) {
            return res.status(400).json({ error: 'Minimum follower count cannot be greater than maximum' });
        }
        const project = await prisma.project.create({
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
        });
        res.status(201).json({
            project: project,
            message: 'Project created successfully'
        });
    }
    catch (error) {
        console.error('Create project error:', error);
        // より詳細なエラーメッセージを返す
        if (error.name === 'ZodError') {
            return res.status(400).json({
                error: 'Validation error',
                details: error.errors
            });
        }
        res.status(500).json({ error: 'Failed to create project' });
    }
};
exports.createProject = createProject;
const getMyProjects = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        // Accept both 'CLIENT' and 'COMPANY' roles (COMPANY is used in frontend)
        if (userRole !== 'CLIENT' && userRole !== 'COMPANY') {
            return res.status(403).json({ error: 'Only clients can view their projects' });
        }
        // Get client profile
        const client = await prisma.client.findUnique({
            where: { userId },
        });
        if (!client) {
            return res.status(404).json({ error: 'Client profile not found' });
        }
        const projects = await prisma.project.findMany({
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
        });
        res.json(projects);
    }
    catch (error) {
        console.error('Get my projects error:', error);
        res.status(500).json({ error: 'Failed to get projects' });
    }
};
exports.getMyProjects = getMyProjects;
const getProjectById = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { projectId } = req.params;
        const project = await prisma.project.findUnique({
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
        });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        // Check access permissions
        if (userRole === 'CLIENT') {
            const client = await prisma.client.findUnique({
                where: { userId },
            });
            if (!client || project.clientId !== client.id) {
                return res.status(403).json({ error: 'Access denied' });
            }
        }
        else if (userRole === 'INFLUENCER') {
            // Influencers can view any available project details
            // Just verify that the user has the INFLUENCER role
            // No need to check if they have an influencer profile or if they've applied
            // This allows influencers to view projects even if their profile is not fully set up yet
        }
        else {
            return res.status(403).json({ error: 'Access denied' });
        }
        res.json({ project });
    }
    catch (error) {
        console.error('Get project by ID error:', error);
        res.status(500).json({ error: 'Failed to get project' });
    }
};
exports.getProjectById = getProjectById;
const updateProject = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { projectId } = req.params;
        if (userRole !== 'CLIENT') {
            return res.status(403).json({ error: 'Only clients can update projects' });
        }
        const data = updateProjectSchema.parse(req.body);
        // Get client profile
        const client = await prisma.client.findUnique({
            where: { userId },
        });
        if (!client) {
            return res.status(404).json({ error: 'Client profile not found' });
        }
        // Get existing project
        const existingProject = await prisma.project.findUnique({
            where: { id: projectId },
        });
        if (!existingProject) {
            return res.status(404).json({ error: 'Project not found' });
        }
        if (existingProject.clientId !== client.id) {
            return res.status(403).json({ error: 'You can only update your own projects' });
        }
        // Cannot update matched or completed projects
        if (['MATCHED', 'IN_PROGRESS', 'COMPLETED'].includes(existingProject.status)) {
            return res.status(400).json({ error: 'Cannot update project after it has been matched' });
        }
        // Validate dates if provided
        let startDate, endDate;
        if (data.startDate) {
            startDate = new Date(data.startDate);
            if (startDate < new Date()) {
                return res.status(400).json({ error: 'Start date cannot be in the past' });
            }
        }
        if (data.endDate) {
            endDate = new Date(data.endDate);
        }
        if (startDate && endDate && startDate >= endDate) {
            return res.status(400).json({ error: 'End date must be after start date' });
        }
        // Validate ranges if provided
        if (data.targetAgeMin && data.targetAgeMax && data.targetAgeMin > data.targetAgeMax) {
            return res.status(400).json({ error: 'Minimum age cannot be greater than maximum age' });
        }
        if (data.targetFollowerMin && data.targetFollowerMax && data.targetFollowerMin > data.targetFollowerMax) {
            return res.status(400).json({ error: 'Minimum follower count cannot be greater than maximum' });
        }
        const updateData = {};
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
        const updatedProject = await prisma.project.update({
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
        });
        res.json(updatedProject);
    }
    catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ error: 'Failed to update project' });
    }
};
exports.updateProject = updateProject;
const deleteProject = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { projectId } = req.params;
        if (userRole !== 'CLIENT') {
            return res.status(403).json({ error: 'Only clients can delete projects' });
        }
        // Get client profile
        const client = await prisma.client.findUnique({
            where: { userId },
        });
        if (!client) {
            return res.status(404).json({ error: 'Client profile not found' });
        }
        // Get existing project
        const existingProject = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                applications: true,
                transaction: true,
            },
        });
        if (!existingProject) {
            return res.status(404).json({ error: 'Project not found' });
        }
        if (existingProject.clientId !== client.id) {
            return res.status(403).json({ error: 'You can only delete your own projects' });
        }
        // Cannot delete projects with payments
        if (existingProject.transaction) {
            return res.status(400).json({ error: 'Cannot delete project with completed payment' });
        }
        // Cannot delete matched or in-progress projects
        if (['MATCHED', 'IN_PROGRESS', 'COMPLETED'].includes(existingProject.status)) {
            return res.status(400).json({ error: 'Cannot delete project after it has been matched' });
        }
        // Delete project (cascade will handle applications and messages)
        await prisma.project.delete({
            where: { id: projectId },
        });
        res.json({ message: 'Project deleted successfully' });
    }
    catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
};
exports.deleteProject = deleteProject;
const updateProjectStatus = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { projectId } = req.params;
        const { status } = zod_1.z.object({ status: zod_1.z.nativeEnum(client_1.ProjectStatus) }).parse(req.body);
        if (userRole !== 'CLIENT') {
            return res.status(403).json({ error: 'Only clients can update project status' });
        }
        // Get client profile
        const client = await prisma.client.findUnique({
            where: { userId },
        });
        if (!client) {
            return res.status(404).json({ error: 'Client profile not found' });
        }
        // Get existing project
        const existingProject = await prisma.project.findUnique({
            where: { id: projectId },
        });
        if (!existingProject) {
            return res.status(404).json({ error: 'Project not found' });
        }
        if (existingProject.clientId !== client.id) {
            return res.status(403).json({ error: 'You can only update your own projects' });
        }
        // Validate status transitions
        const validTransitions = {
            PENDING: ['CANCELLED'],
            MATCHED: ['IN_PROGRESS', 'CANCELLED'],
            IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
            COMPLETED: [],
            CANCELLED: [],
        };
        if (!validTransitions[existingProject.status].includes(status)) {
            return res.status(400).json({
                error: `Cannot change status from ${existingProject.status} to ${status}`
            });
        }
        const updatedProject = await prisma.project.update({
            where: { id: projectId },
            data: { status },
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
        });
        res.json(updatedProject);
    }
    catch (error) {
        console.error('Update project status error:', error);
        res.status(500).json({ error: 'Failed to update project status' });
    }
};
exports.updateProjectStatus = updateProjectStatus;
// Get company projects with matched influencers (for project chats)
const getCompanyProjects = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        // Only clients can view their company projects
        if (userRole !== 'CLIENT' && userRole !== 'COMPANY') {
            return res.status(403).json({ error: 'Only clients can view their projects' });
        }
        // Get client profile
        const client = await prisma.client.findUnique({
            where: { userId },
        });
        if (!client) {
            return res.status(404).json({ error: 'Client profile not found' });
        }
        // Get all projects with matched influencers
        const projects = await prisma.project.findMany({
            where: {
                clientId: client.id,
                matchedInfluencerId: {
                    not: null, // Only projects with matched influencers
                },
            },
            include: {
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
            orderBy: { createdAt: 'desc' },
        });
        res.json(projects);
    }
    catch (error) {
        console.error('Get company projects error:', error);
        res.status(500).json({ error: 'Failed to get company projects' });
    }
};
exports.getCompanyProjects = getCompanyProjects;
// Get matched projects for influencer (for project chats)
const getMatchedProjects = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        // Only influencers can view their matched projects
        if (userRole !== 'INFLUENCER') {
            return res.status(403).json({ error: 'Only influencers can view matched projects' });
        }
        // Get influencer profile
        const influencer = await prisma.influencer.findUnique({
            where: { userId },
        });
        if (!influencer) {
            return res.status(404).json({ error: 'Influencer profile not found' });
        }
        // Get all projects where this influencer is matched
        const projects = await prisma.project.findMany({
            where: {
                matchedInfluencerId: influencer.id,
                status: {
                    in: ['MATCHED', 'IN_PROGRESS'],
                },
            },
            include: {
                client: {
                    include: {
                        user: {
                            select: {
                                email: true,
                            },
                        },
                        team: true,
                    },
                },
                matchedInfluencer: {
                    include: {
                        socialAccounts: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(projects);
    }
    catch (error) {
        console.error('Get matched projects error:', error);
        res.status(500).json({ error: 'Failed to get matched projects' });
    }
};
exports.getMatchedProjects = getMatchedProjects;
// Copy a project (for clients)
const copyProject = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { projectId } = req.params;
        if (userRole !== 'CLIENT' && userRole !== 'COMPANY') {
            return res.status(403).json({ error: 'Only clients can copy projects' });
        }
        // Get the original project
        const originalProject = await prisma.project.findUnique({
            where: { id: projectId },
        });
        if (!originalProject) {
            return res.status(404).json({ error: 'Project not found' });
        }
        // Verify the user owns the project
        const client = await prisma.client.findUnique({
            where: { userId },
        });
        if (!client || originalProject.clientId !== client.id) {
            return res.status(403).json({ error: 'You do not have permission to copy this project' });
        }
        // Create a copy of the project with a new title
        const copiedProject = await prisma.project.create({
            data: {
                title: `${originalProject.title} (コピー)`,
                description: originalProject.description,
                category: originalProject.category,
                budget: originalProject.budget,
                status: 'PENDING',
                isPublic: originalProject.isPublic,
                targetPlatforms: originalProject.targetPlatforms,
                targetPrefecture: originalProject.targetPrefecture,
                targetCity: originalProject.targetCity || undefined,
                targetGender: originalProject.targetGender || undefined,
                targetAgeMin: originalProject.targetAgeMin || undefined,
                targetAgeMax: originalProject.targetAgeMax || undefined,
                targetFollowerMin: originalProject.targetFollowerMin || undefined,
                targetFollowerMax: originalProject.targetFollowerMax || undefined,
                startDate: originalProject.startDate,
                endDate: originalProject.endDate,
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
            },
        });
        res.json({
            success: true,
            message: 'Project copied successfully',
            data: copiedProject,
        });
    }
    catch (error) {
        console.error('Copy project error:', error);
        res.status(500).json({ error: 'Failed to copy project' });
    }
};
exports.copyProject = copyProject;
// Chapter 2-8: Unpublish project (change from public to private)
const unpublishProject = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { projectId } = req.params;
        // Get client profile
        const client = await prisma.client.findUnique({
            where: { userId },
        });
        if (!client) {
            return res.status(404).json({ error: 'Client profile not found' });
        }
        // Get existing project
        const existingProject = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                client: true,
            },
        });
        if (!existingProject) {
            return res.status(404).json({ error: 'Project not found' });
        }
        if (existingProject.clientId !== client.id) {
            return res.status(403).json({ error: 'You can only unpublish your own projects' });
        }
        // Update project to be private
        const updatedProject = await prisma.project.update({
            where: { id: projectId },
            data: {
                isPublic: false,
            },
            include: {
                client: {
                    select: {
                        companyName: true,
                        user: {
                            select: {
                                email: true,
                            },
                        },
                    },
                },
            },
        });
        // Create notification
        const applications = await prisma.application.findMany({
            where: { projectId },
            include: { influencer: { select: { userId: true } } },
        });
        for (const app of applications) {
            await prisma.notification.create({
                data: {
                    userId: app.influencer.userId,
                    type: 'PROJECT_STATUS_CHANGED',
                    title: 'プロジェクトが非公開になりました',
                    message: `「${existingProject.title}」が非公開（招待制）に変更されました`,
                    data: {
                        projectId,
                    },
                },
            });
        }
        res.json({
            success: true,
            message: 'Project unpublished successfully',
            data: updatedProject,
        });
    }
    catch (error) {
        console.error('Unpublish project error:', error);
        res.status(500).json({ error: 'Failed to unpublish project' });
    }
};
exports.unpublishProject = unpublishProject;
// Chapter 2-8: End project (mark as completed and close to new applications)
const endProject = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { projectId } = req.params;
        // Get client profile
        const client = await prisma.client.findUnique({
            where: { userId },
        });
        if (!client) {
            return res.status(404).json({ error: 'Client profile not found' });
        }
        // Get existing project
        const existingProject = await prisma.project.findUnique({
            where: { id: projectId },
        });
        if (!existingProject) {
            return res.status(404).json({ error: 'Project not found' });
        }
        if (existingProject.clientId !== client.id) {
            return res.status(403).json({ error: 'You can only end your own projects' });
        }
        // Can only end if project is MATCHED or IN_PROGRESS
        if (!['MATCHED', 'IN_PROGRESS'].includes(existingProject.status)) {
            return res.status(400).json({
                error: `Cannot end project with status ${existingProject.status}`,
            });
        }
        // Update project status to COMPLETED
        const updatedProject = await prisma.project.update({
            where: { id: projectId },
            data: {
                status: 'COMPLETED',
                endDate: new Date(),
            },
            include: {
                client: {
                    select: {
                        companyName: true,
                        user: {
                            select: {
                                email: true,
                            },
                        },
                    },
                },
            },
        });
        // Notify matched influencer
        if (existingProject.matchedInfluencerId) {
            const influencer = await prisma.influencer.findUnique({
                where: { id: existingProject.matchedInfluencerId },
                select: { userId: true },
            });
            if (influencer) {
                await prisma.notification.create({
                    data: {
                        userId: influencer.userId,
                        type: 'PROJECT_STATUS_CHANGED',
                        title: 'プロジェクトが完了しました',
                        message: `「${existingProject.title}」が完了状態に更新されました`,
                        data: {
                            projectId,
                            status: 'COMPLETED',
                        },
                    },
                });
            }
        }
        res.json({
            success: true,
            message: 'Project ended successfully',
            data: updatedProject,
        });
    }
    catch (error) {
        console.error('End project error:', error);
        res.status(500).json({ error: 'Failed to end project' });
    }
};
exports.endProject = endProject;
//# sourceMappingURL=project.controller.js.map