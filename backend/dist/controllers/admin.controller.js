"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProjectProgress = exports.deleteUser = exports.updateUserStatus = exports.getUsers = exports.getProjectDetail = exports.getProjects = exports.getInfluencers = exports.getCompanies = exports.getDashboardStats = void 0;
const client_1 = require("@prisma/client");
const api_response_1 = require("../utils/api-response");
const prisma = new client_1.PrismaClient();
// Dashboard Statistics
const getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await prisma.user.count();
        const totalClients = await prisma.client.count();
        const totalInfluencers = await prisma.influencer.count();
        const totalProjects = await prisma.project.count();
        const completedProjects = await prisma.project.count({
            where: { status: 'COMPLETED' },
        });
        const totalTransactions = await prisma.transaction.count();
        // Calculate total revenue
        const transactions = await prisma.transaction.findMany({
            where: { status: 'completed' },
        });
        const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
        // Get recent projects
        const recentProjects = await prisma.project.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                client: {
                    include: { user: true },
                },
                matchedInfluencer: {
                    include: { user: true },
                },
            },
        });
        const dashboardData = {
            totalUsers,
            totalClients,
            totalInfluencers,
            totalProjects,
            completedProjects,
            totalTransactions,
            totalRevenue,
            recentProjects: recentProjects.map(p => ({
                id: p.id,
                title: p.title,
                status: p.status,
                budget: p.budget,
                client: p.client.user.email,
                influencer: p.matchedInfluencer?.user.email || null,
                createdAt: p.createdAt,
            })),
        };
        (0, api_response_1.sendSuccess)(res, dashboardData, 'Dashboard statistics retrieved successfully', 200, req.requestId);
    }
    catch (error) {
        console.error('Error fetching dashboard stats:', error);
        (0, api_response_1.sendInternalError)(res, 'Failed to fetch dashboard statistics', undefined, req.requestId);
    }
};
exports.getDashboardStats = getDashboardStats;
// Get all clients (companies)
const getCompanies = async (req, res) => {
    try {
        const { search } = req.query;
        const clients = await prisma.client.findMany({
            where: search ? {
                OR: [
                    { companyName: { contains: search, mode: 'insensitive' } },
                    { user: { email: { contains: search, mode: 'insensitive' } } },
                ],
            } : {},
            include: {
                user: true,
                projects: {
                    select: { id: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({
            companies: clients.map(c => ({
                id: c.id,
                companyName: c.companyName,
                email: c.user.email,
                industry: c.industry,
                contactName: c.contactName,
                projectCount: c.projects.length,
                createdAt: c.createdAt,
            })),
        });
    }
    catch (error) {
        console.error('Error fetching companies:', error);
        res.status(500).json({ error: 'Failed to fetch companies' });
    }
};
exports.getCompanies = getCompanies;
// Get all influencers
const getInfluencers = async (req, res) => {
    try {
        const { search, category, prefecture } = req.query;
        const whereClause = {};
        if (search) {
            whereClause.OR = [
                { displayName: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (category) {
            whereClause.categories = { has: category };
        }
        if (prefecture) {
            whereClause.prefecture = prefecture;
        }
        const influencers = await prisma.influencer.findMany({
            where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
            include: {
                user: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({
            influencers: influencers.map(i => ({
                id: i.id,
                displayName: i.displayName,
                email: i.user.email,
                bio: i.bio,
                categories: i.categories,
                prefecture: i.prefecture,
                createdAt: i.createdAt,
            })),
        });
    }
    catch (error) {
        console.error('Error fetching influencers:', error);
        res.status(500).json({ error: 'Failed to fetch influencers' });
    }
};
exports.getInfluencers = getInfluencers;
// Get all projects
const getProjects = async (req, res) => {
    try {
        const { status, search } = req.query;
        const whereClause = {};
        if (status) {
            whereClause.status = status;
        }
        if (search) {
            whereClause.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        const projects = await prisma.project.findMany({
            where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
            include: {
                client: {
                    include: { user: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({
            projects: projects.map(p => ({
                id: p.id,
                title: p.title,
                description: p.description,
                status: p.status,
                budget: p.budget,
                endDate: p.endDate,
                client: p.client.user.email,
                createdAt: p.createdAt,
                progress: 0,
            })),
        });
    }
    catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
};
exports.getProjects = getProjects;
// Get project details
const getProjectDetail = async (req, res) => {
    try {
        const { projectId } = req.params;
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                client: {
                    include: { user: true },
                },
                matchedInfluencer: {
                    include: { user: true },
                },
                messages: {
                    include: { sender: true },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json({
            id: project.id,
            title: project.title,
            description: project.description,
            status: project.status,
            budget: project.budget,
            endDate: project.endDate,
            clientEmail: project.client.user.email,
            influencerEmail: project.matchedInfluencer?.user.email || null,
            createdAt: project.createdAt,
            messages: project.messages.map(m => ({
                id: m.id,
                content: m.content,
                sender: m.sender.email,
                createdAt: m.createdAt,
            })),
        });
    }
    catch (error) {
        console.error('Error fetching project detail:', error);
        res.status(500).json({ error: 'Failed to fetch project details' });
    }
};
exports.getProjectDetail = getProjectDetail;
// Get all users
const getUsers = async (req, res) => {
    try {
        const { role, search } = req.query;
        const whereClause = {};
        if (role) {
            whereClause.role = role;
        }
        if (search) {
            whereClause.email = { contains: search, mode: 'insensitive' };
        }
        const users = await prisma.user.findMany({
            where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
            include: {
                client: {
                    select: { companyName: true },
                },
                influencer: {
                    select: { displayName: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        const formattedUsers = users.map(u => ({
            id: u.id,
            name: u.role === 'CLIENT' ? u.client?.companyName : u.role === 'INFLUENCER' ? u.influencer?.displayName : u.email,
            email: u.email,
            role: u.role,
            status: u.isVerified ? 'active' : 'inactive',
            createdAt: u.createdAt.toISOString().split('T')[0],
            lastLogin: u.lastLoginAt ? u.lastLoginAt.toISOString().split('T')[0] : 'N/A',
        }));
        res.json({ users: formattedUsers });
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};
exports.getUsers = getUsers;
// Update user verification status
const updateUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { isVerified } = req.body;
        if (typeof isVerified !== 'boolean') {
            return res.status(400).json({ error: 'Invalid isVerified value' });
        }
        const user = await prisma.user.update({
            where: { id: userId },
            data: { isVerified },
            select: {
                id: true,
                email: true,
                isVerified: true,
            },
        });
        res.json({ message: 'User verification status updated', user });
    }
    catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json({ error: 'Failed to update user status' });
    }
};
exports.updateUserStatus = updateUserStatus;
// Delete user
const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        // Check if user exists
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Delete related data first (handle cascading)
        if (user.role === 'CLIENT') {
            await prisma.client.deleteMany({ where: { userId } });
        }
        else if (user.role === 'INFLUENCER') {
            await prisma.influencer.deleteMany({ where: { userId } });
        }
        // Delete user (cascading will handle related entities)
        await prisma.user.delete({ where: { id: userId } });
        res.json({ message: 'User deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};
exports.deleteUser = deleteUser;
// Update project status
const updateProjectProgress = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }
        const project = await prisma.project.update({
            where: { id: projectId },
            data: { status: status },
            select: {
                id: true,
                title: true,
                status: true,
            },
        });
        res.json({ message: 'Project status updated', project });
    }
    catch (error) {
        console.error('Error updating project status:', error);
        res.status(500).json({ error: 'Failed to update project status' });
    }
};
exports.updateProjectProgress = updateProjectProgress;
//# sourceMappingURL=admin.controller.js.map