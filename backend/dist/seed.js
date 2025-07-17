"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Starting database seed...');
    // Create test company user
    const hashedPassword = await bcryptjs_1.default.hash('test123', 12);
    const company = await prisma.user.upsert({
        where: { email: 'company@test.com' },
        update: {},
        create: {
            email: 'company@test.com',
            password: hashedPassword,
            role: 'CLIENT',
            isVerified: true,
        },
    });
    // Create test influencer user
    const influencer = await prisma.user.upsert({
        where: { email: 'influencer@test.com' },
        update: {},
        create: {
            email: 'influencer@test.com',
            password: hashedPassword,
            role: 'INFLUENCER',
            isVerified: true,
        },
    });
    // Create influencer profile
    const influencerProfile = await prisma.influencer.upsert({
        where: { userId: influencer.id },
        update: {},
        create: {
            userId: influencer.id,
            displayName: 'テストインフルエンサー',
            bio: 'テストインフルエンサーです。',
            categories: ['LIFESTYLE', 'TECH'],
            gender: 'FEMALE',
            prefecture: '東京都',
            city: '渋谷区',
            priceMin: 50000,
            priceMax: 200000,
            isRegistered: true,
        },
    });
    // Create company profile
    const clientProfile = await prisma.client.upsert({
        where: { userId: company.id },
        update: {},
        create: {
            userId: company.id,
            companyName: 'テスト株式会社',
            industry: 'TECH',
            contactName: '山田太郎',
            contactPhone: '03-1234-5678',
            address: '東京都渋谷区...',
        },
    });
    // Create a test project
    const project = await prisma.project.create({
        data: {
            title: 'テスト商品プロモーション',
            description: 'テスト用のプロジェクトです。フォロワー1万人以上のインフルエンサーを募集しています。',
            budget: 100000,
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            status: 'PENDING',
            clientId: clientProfile.id,
            category: 'LIFESTYLE',
            targetPlatforms: ['INSTAGRAM'],
            targetPrefecture: '東京都',
            targetGender: 'FEMALE',
            targetAgeMin: 20,
            targetAgeMax: 35,
            targetFollowerMin: 10000,
        },
    });
    console.log('Database seeded successfully!');
    console.log('Test accounts created:');
    console.log('Company: company@test.com / test123');
    console.log('Influencer: influencer@test.com / test123');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
