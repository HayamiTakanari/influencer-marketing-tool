"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectSubmission = exports.requestRevision = exports.approveSubmission = exports.getInfluencerSubmissions = exports.getProjectSubmissions = exports.createSubmission = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const notification_service_1 = require("../services/notification.service");
const prisma = new client_1.PrismaClient();
const createSubmissionSchema = zod_1.z.object({
    projectId: zod_1.z.string(),
    submissionUrl: zod_1.z.string().url('Invalid URL'),
    submissionType: zod_1.z.string(),
    submissionNotes: zod_1.z.string().optional(),
});
const approveSubmissionSchema = zod_1.z.object({
    approvalNotes: zod_1.z.string().optional(),
});
const requestRevisionSchema = zod_1.z.object({
    approvalNotes: zod_1.z.string().min(1, 'Revision notes are required'),
});
// Create a submission (Influencer uploads deliverable)
const createSubmission = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        if (userRole !== 'INFLUENCER') {
            return res.status(403).json({ error: 'Only influencers can create submissions' });
        }
        const { projectId, submissionUrl, submissionType, submissionNotes } = createSubmissionSchema.parse(req.body);
        // Verify influencer exists
        const influencer = await prisma.influencer.findUnique({
            where: { userId },
        });
        if (!influencer) {
            return res.status(404).json({ error: 'Influencer profile not found' });
        }
        // Verify project exists and is matched to this influencer
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                client: true,
            },
        });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        if (project.matchedInfluencerId !== influencer.id) {
            return res.status(403).json({ error: 'You are not matched to this project' });
        }
        if (project.status !== 'IN_PROGRESS') {
            return res.status(400).json({ error: 'Project must be in progress to submit deliverables' });
        }
        // Create submission
        const submission = await prisma.submission.create({
            data: {
                projectId,
                influencerId: influencer.id,
                clientId: project.clientId,
                submissionUrl,
                submissionType,
                submissionNotes,
                status: 'PENDING',
            },
            include: {
                influencer: {
                    include: {
                        user: {
                            select: {
                                email: true,
                            },
                        },
                    },
                },
                project: true,
            },
        });
        // Notify client about submission
        try {
            await notification_service_1.NotificationService.createNotification({
                userId: project.client.userId,
                type: 'PROJECT_STATUS_CHANGED',
                title: 'Content Submitted',
                message: `${influencer.displayName} has submitted content for "${project.title}"`,
                data: { projectId },
            });
        }
        catch (error) {
            console.error('Failed to send submission notification:', error);
        }
        res.status(201).json(submission);
    }
    catch (error) {
        console.error('Create submission error:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ errors: error.issues });
        }
        res.status(500).json({ error: 'Failed to create submission' });
    }
};
exports.createSubmission = createSubmission;
// Get submissions for a project (Company/Client views)
const getProjectSubmissions = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { projectId } = req.params;
        if (userRole !== 'CLIENT' && userRole !== 'COMPANY') {
            return res.status(403).json({ error: 'Only clients can view submissions' });
        }
        // Verify client and project
        const client = await prisma.client.findUnique({
            where: { userId },
        });
        if (!client) {
            return res.status(404).json({ error: 'Client profile not found' });
        }
        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });
        if (!project || project.clientId !== client.id) {
            return res.status(403).json({ error: 'You do not have access to this project' });
        }
        const submissions = await prisma.submission.findMany({
            where: { projectId },
            include: {
                influencer: {
                    include: {
                        user: {
                            select: {
                                email: true,
                            },
                        },
                    },
                },
            },
            orderBy: { submittedAt: 'desc' },
        });
        res.json(submissions);
    }
    catch (error) {
        console.error('Get project submissions error:', error);
        res.status(500).json({ error: 'Failed to get submissions' });
    }
};
exports.getProjectSubmissions = getProjectSubmissions;
// Get influencer's submissions
const getInfluencerSubmissions = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        if (userRole !== 'INFLUENCER') {
            return res.status(403).json({ error: 'Only influencers can view their submissions' });
        }
        const influencer = await prisma.influencer.findUnique({
            where: { userId },
        });
        if (!influencer) {
            return res.status(404).json({ error: 'Influencer profile not found' });
        }
        const submissions = await prisma.submission.findMany({
            where: { influencerId: influencer.id },
            include: {
                project: true,
                client: true,
            },
            orderBy: { submittedAt: 'desc' },
        });
        res.json(submissions);
    }
    catch (error) {
        console.error('Get influencer submissions error:', error);
        res.status(500).json({ error: 'Failed to get submissions' });
    }
};
exports.getInfluencerSubmissions = getInfluencerSubmissions;
// Approve submission
const approveSubmission = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { submissionId } = req.params;
        const { approvalNotes } = approveSubmissionSchema.parse(req.body);
        if (userRole !== 'CLIENT' && userRole !== 'COMPANY') {
            return res.status(403).json({ error: 'Only clients can approve submissions' });
        }
        // Verify client access
        const client = await prisma.client.findUnique({
            where: { userId },
        });
        if (!client) {
            return res.status(404).json({ error: 'Client profile not found' });
        }
        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
            include: {
                project: true,
                influencer: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });
        if (!submission || submission.clientId !== client.id) {
            return res.status(403).json({ error: 'You do not have access to this submission' });
        }
        // Update submission status
        const updatedSubmission = await prisma.submission.update({
            where: { id: submissionId },
            data: {
                status: 'APPROVED',
                approvalNotes,
                approvedAt: new Date(),
            },
        });
        // Notify influencer about approval
        try {
            await notification_service_1.NotificationService.createNotification({
                userId: submission.influencer.user.id,
                type: 'PROJECT_STATUS_CHANGED',
                title: 'Content Approved',
                message: `Your submission for "${submission.project.title}" has been approved`,
                data: { projectId: submission.projectId },
            });
        }
        catch (error) {
            console.error('Failed to send approval notification:', error);
        }
        res.json(updatedSubmission);
    }
    catch (error) {
        console.error('Approve submission error:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ errors: error.issues });
        }
        res.status(500).json({ error: 'Failed to approve submission' });
    }
};
exports.approveSubmission = approveSubmission;
// Request revision on submission
const requestRevision = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { submissionId } = req.params;
        const { approvalNotes } = requestRevisionSchema.parse(req.body);
        if (userRole !== 'CLIENT' && userRole !== 'COMPANY') {
            return res.status(403).json({ error: 'Only clients can request revisions' });
        }
        // Verify client access
        const client = await prisma.client.findUnique({
            where: { userId },
        });
        if (!client) {
            return res.status(404).json({ error: 'Client profile not found' });
        }
        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
            include: {
                project: true,
                influencer: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });
        if (!submission || submission.clientId !== client.id) {
            return res.status(403).json({ error: 'You do not have access to this submission' });
        }
        // Update submission status
        const updatedSubmission = await prisma.submission.update({
            where: { id: submissionId },
            data: {
                status: 'REVISION_REQUESTED',
                approvalNotes,
            },
        });
        // Notify influencer about revision request
        try {
            await notification_service_1.NotificationService.createNotification({
                userId: submission.influencer.user.id,
                type: 'PROJECT_STATUS_CHANGED',
                title: 'Revision Requested',
                message: `Revisions requested for "${submission.project.title}". ${approvalNotes}`,
                data: { projectId: submission.projectId },
            });
        }
        catch (error) {
            console.error('Failed to send revision request notification:', error);
        }
        res.json(updatedSubmission);
    }
    catch (error) {
        console.error('Request revision error:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ errors: error.issues });
        }
        res.status(500).json({ error: 'Failed to request revision' });
    }
};
exports.requestRevision = requestRevision;
// Reject submission
const rejectSubmission = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { submissionId } = req.params;
        const { approvalNotes } = requestRevisionSchema.parse(req.body);
        if (userRole !== 'CLIENT' && userRole !== 'COMPANY') {
            return res.status(403).json({ error: 'Only clients can reject submissions' });
        }
        // Verify client access
        const client = await prisma.client.findUnique({
            where: { userId },
        });
        if (!client) {
            return res.status(404).json({ error: 'Client profile not found' });
        }
        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
            include: {
                project: true,
                influencer: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });
        if (!submission || submission.clientId !== client.id) {
            return res.status(403).json({ error: 'You do not have access to this submission' });
        }
        // Update submission status
        const updatedSubmission = await prisma.submission.update({
            where: { id: submissionId },
            data: {
                status: 'REJECTED',
                approvalNotes,
            },
        });
        // Notify influencer about rejection
        try {
            await notification_service_1.NotificationService.createNotification({
                userId: submission.influencer.user.id,
                type: 'PROJECT_STATUS_CHANGED',
                title: 'Submission Rejected',
                message: `Your submission for "${submission.project.title}" was rejected. ${approvalNotes}`,
                data: { projectId: submission.projectId },
            });
        }
        catch (error) {
            console.error('Failed to send rejection notification:', error);
        }
        res.json(updatedSubmission);
    }
    catch (error) {
        console.error('Reject submission error:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ errors: error.issues });
        }
        res.status(500).json({ error: 'Failed to reject submission' });
    }
};
exports.rejectSubmission = rejectSubmission;
//# sourceMappingURL=submission.controller.js.map