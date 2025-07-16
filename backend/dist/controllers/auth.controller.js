"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const client_1 = require("@prisma/client");
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
const prisma = new client_1.PrismaClient();
const register = async (req, res) => {
    try {
        const { email, password, role, companyName, contactName, displayName } = req.body;
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            res.status(400).json({ error: 'Email already registered' });
            return;
        }
        const hashedPassword = await (0, password_1.hashPassword)(password);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role,
            },
        });
        if (role === 'CLIENT' && companyName && contactName) {
            await prisma.client.create({
                data: {
                    userId: user.id,
                    companyName,
                    contactName,
                },
            });
        }
        else if (role === 'INFLUENCER' && displayName) {
            await prisma.influencer.create({
                data: {
                    userId: user.id,
                    displayName,
                    isRegistered: true,
                },
            });
        }
        const token = (0, jwt_1.generateToken)(user);
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                client: true,
                influencer: true,
            },
        });
        if (!user) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const isPasswordValid = await (0, password_1.comparePassword)(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const token = (0, jwt_1.generateToken)(user);
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                profile: user.client || user.influencer,
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.login = login;
