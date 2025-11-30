"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agreeToNDA = void 0;
const client_1 = require("@prisma/client");
const notification_service_1 = require("../services/notification.service");
const prisma = new client_1.PrismaClient();
const agreeToNDA = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        // Only influencers need to explicitly agree to NDA when matched with a project
        if (userRole !== 'INFLUENCER') {
            return res.status(403).json({ error: 'Only influencers need to agree to NDA' });
        }
        // Get influencer profile
        const influencer = await prisma.influencer.findUnique({
            where: { userId },
        });
        if (!influencer) {
            return res.status(404).json({ error: 'Influencer profile not found' });
        }
        // Find the project that the influencer is matched with
        const project = await prisma.project.findFirst({
            where: {
                matchedInfluencerId: influencer.id,
                status: 'MATCHED',
            },
            include: {
                client: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                            },
                        },
                    },
                },
                matchedInfluencer: {
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
        if (!project) {
            return res.status(404).json({ error: 'No matched project found' });
        }
        // Update project status to IN_PROGRESS to enable messaging
        const updatedProject = await prisma.project.update({
            where: { id: project.id },
            data: {
                status: 'IN_PROGRESS',
            },
            include: {
                client: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                            },
                        },
                    },
                },
                matchedInfluencer: {
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
        // Send notification to client that NDA was approved
        try {
            if (project.matchedInfluencer && project.client) {
                await notification_service_1.NotificationService.createNDAApprovedNotification(project.client.userId, project.title, project.matchedInfluencer.displayName, project.id);
                // Add system message to chat about NDA approval
                await prisma.message.create({
                    data: {
                        projectId: project.id,
                        senderId: project.matchedInfluencer.userId,
                        receiverId: project.client.userId,
                        content: `${project.matchedInfluencer.displayName}さんがNDA（秘密保持契約）を承認しました。`,
                    },
                });
            }
        }
        catch (error) {
            console.error('Failed to send NDA approval notification:', error);
        }
        res.json({
            message: 'NDA agreement recorded successfully',
            project: updatedProject,
        });
    }
    catch (error) {
        console.error('Agree to NDA error:', error);
        res.status(500).json({ error: 'Failed to record NDA agreement' });
    }
};
exports.agreeToNDA = agreeToNDA;
//# sourceMappingURL=nda.controller.js.map