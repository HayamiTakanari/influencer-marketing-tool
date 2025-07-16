"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeRegistration = exports.uploadPortfolioImage = exports.deletePortfolio = exports.updatePortfolio = exports.addPortfolio = exports.deleteSocialAccount = exports.updateSocialAccount = exports.addSocialAccount = exports.updateProfile = exports.getMyProfile = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = require("cloudinary");
const prisma = new client_1.PrismaClient();
const updateProfileSchema = zod_1.z.object({
    displayName: zod_1.z.string().min(1).max(100).optional(),
    bio: zod_1.z.string().max(500).optional(),
    gender: zod_1.z.nativeEnum(client_1.Gender).optional(),
    birthDate: zod_1.z.string().optional(),
    phoneNumber: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    prefecture: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    categories: zod_1.z.array(zod_1.z.string()).optional(),
    priceMin: zod_1.z.number().min(0).optional(),
    priceMax: zod_1.z.number().min(0).optional(),
});
const socialAccountSchema = zod_1.z.object({
    platform: zod_1.z.nativeEnum(client_1.Platform),
    username: zod_1.z.string().min(1),
    profileUrl: zod_1.z.string().url(),
});
const portfolioSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().max(1000).optional(),
    link: zod_1.z.string().url().optional(),
    platform: zod_1.z.nativeEnum(client_1.Platform).optional(),
});
const getMyProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        const influencer = await prisma.influencer.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        email: true,
                        isVerified: true,
                    },
                },
                socialAccounts: true,
                portfolio: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!influencer) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        res.json(influencer);
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
};
exports.getMyProfile = getMyProfile;
const updateProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        const data = updateProfileSchema.parse(req.body);
        const influencer = await prisma.influencer.update({
            where: { userId },
            data: {
                ...data,
                birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
                lastUpdated: new Date(),
            },
            include: {
                socialAccounts: true,
                portfolio: true,
            },
        });
        res.json(influencer);
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};
exports.updateProfile = updateProfile;
const addSocialAccount = async (req, res) => {
    try {
        const userId = req.user?.id;
        const data = socialAccountSchema.parse(req.body);
        const influencer = await prisma.influencer.findUnique({
            where: { userId },
        });
        if (!influencer) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        const socialAccount = await prisma.socialAccount.create({
            data: {
                ...data,
                influencerId: influencer.id,
            },
        });
        res.json(socialAccount);
    }
    catch (error) {
        console.error('Add social account error:', error);
        res.status(500).json({ error: 'Failed to add social account' });
    }
};
exports.addSocialAccount = addSocialAccount;
const updateSocialAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const data = socialAccountSchema.parse(req.body);
        const influencer = await prisma.influencer.findUnique({
            where: { userId },
        });
        if (!influencer) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        const socialAccount = await prisma.socialAccount.update({
            where: {
                id,
                influencerId: influencer.id,
            },
            data,
        });
        res.json(socialAccount);
    }
    catch (error) {
        console.error('Update social account error:', error);
        res.status(500).json({ error: 'Failed to update social account' });
    }
};
exports.updateSocialAccount = updateSocialAccount;
const deleteSocialAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const influencer = await prisma.influencer.findUnique({
            where: { userId },
        });
        if (!influencer) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        await prisma.socialAccount.delete({
            where: {
                id,
                influencerId: influencer.id,
            },
        });
        res.json({ message: 'Social account deleted successfully' });
    }
    catch (error) {
        console.error('Delete social account error:', error);
        res.status(500).json({ error: 'Failed to delete social account' });
    }
};
exports.deleteSocialAccount = deleteSocialAccount;
const addPortfolio = async (req, res) => {
    try {
        const userId = req.user?.id;
        const data = portfolioSchema.parse(req.body);
        const influencer = await prisma.influencer.findUnique({
            where: { userId },
        });
        if (!influencer) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        const portfolio = await prisma.portfolio.create({
            data: {
                ...data,
                influencerId: influencer.id,
            },
        });
        res.json(portfolio);
    }
    catch (error) {
        console.error('Add portfolio error:', error);
        res.status(500).json({ error: 'Failed to add portfolio' });
    }
};
exports.addPortfolio = addPortfolio;
const updatePortfolio = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const data = portfolioSchema.parse(req.body);
        const influencer = await prisma.influencer.findUnique({
            where: { userId },
        });
        if (!influencer) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        const portfolio = await prisma.portfolio.update({
            where: {
                id,
                influencerId: influencer.id,
            },
            data,
        });
        res.json(portfolio);
    }
    catch (error) {
        console.error('Update portfolio error:', error);
        res.status(500).json({ error: 'Failed to update portfolio' });
    }
};
exports.updatePortfolio = updatePortfolio;
const deletePortfolio = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const influencer = await prisma.influencer.findUnique({
            where: { userId },
        });
        if (!influencer) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        await prisma.portfolio.delete({
            where: {
                id,
                influencerId: influencer.id,
            },
        });
        res.json({ message: 'Portfolio deleted successfully' });
    }
    catch (error) {
        console.error('Delete portfolio error:', error);
        res.status(500).json({ error: 'Failed to delete portfolio' });
    }
};
exports.deletePortfolio = deletePortfolio;
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage });
exports.uploadPortfolioImage = [
    upload.single('image'),
    async (req, res) => {
        try {
            const { portfolioId } = req.params;
            const userId = req.user?.id;
            if (!req.file) {
                return res.status(400).json({ error: 'No image file provided' });
            }
            const influencer = await prisma.influencer.findUnique({
                where: { userId },
            });
            if (!influencer) {
                return res.status(404).json({ error: 'Profile not found' });
            }
            const portfolio = await prisma.portfolio.findFirst({
                where: {
                    id: portfolioId,
                    influencerId: influencer.id,
                },
            });
            if (!portfolio) {
                return res.status(404).json({ error: 'Portfolio not found' });
            }
            // Upload to Cloudinary
            const result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                    folder: 'portfolio',
                    resource_type: 'image',
                }, (error, result) => {
                    if (error)
                        reject(error);
                    else
                        resolve(result);
                });
                uploadStream.end(req.file.buffer);
            });
            const updatedPortfolio = await prisma.portfolio.update({
                where: { id: portfolioId },
                data: { imageUrl: result.secure_url },
            });
            res.json(updatedPortfolio);
        }
        catch (error) {
            console.error('Upload portfolio image error:', error);
            res.status(500).json({ error: 'Failed to upload image' });
        }
    },
];
const completeRegistration = async (req, res) => {
    try {
        const userId = req.user?.id;
        const influencer = await prisma.influencer.findUnique({
            where: { userId },
            include: {
                socialAccounts: true,
            },
        });
        if (!influencer) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        // Validate required fields
        if (!influencer.displayName ||
            !influencer.categories ||
            influencer.categories.length === 0 ||
            influencer.socialAccounts.length === 0) {
            return res.status(400).json({
                error: 'Please complete all required fields before registration',
            });
        }
        const updatedInfluencer = await prisma.influencer.update({
            where: { id: influencer.id },
            data: { isRegistered: true },
        });
        res.json(updatedInfluencer);
    }
    catch (error) {
        console.error('Complete registration error:', error);
        res.status(500).json({ error: 'Failed to complete registration' });
    }
};
exports.completeRegistration = completeRegistration;
