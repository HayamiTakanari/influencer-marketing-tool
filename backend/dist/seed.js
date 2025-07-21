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
    // Create additional test influencers
    const influencer2 = await prisma.user.create({
        data: {
            email: 'beauty@test.com',
            password: hashedPassword,
            role: 'INFLUENCER',
            isVerified: true,
        },
    });
    await prisma.influencer.create({
        data: {
            userId: influencer2.id,
            displayName: '美容インフルエンサー',
            bio: '美容・コスメ専門のインフルエンサーです。',
            categories: ['BEAUTY', 'FASHION'],
            gender: 'FEMALE',
            prefecture: '大阪府',
            city: '大阪市',
            priceMin: 30000,
            priceMax: 150000,
            isRegistered: true,
        },
    });
    const influencer3 = await prisma.user.create({
        data: {
            email: 'food@test.com',
            password: hashedPassword,
            role: 'INFLUENCER',
            isVerified: true,
        },
    });
    await prisma.influencer.create({
        data: {
            userId: influencer3.id,
            displayName: 'グルメインフルエンサー',
            bio: 'フード・グルメ専門のインフルエンサーです。',
            categories: ['FOOD'],
            gender: 'MALE',
            prefecture: '東京都',
            city: '新宿区',
            priceMin: 20000,
            priceMax: 100000,
            isRegistered: true,
        },
    });
    // Create additional test projects
    const project2 = await prisma.project.create({
        data: {
            title: '新作コスメのPRキャンペーン',
            description: '新しく発売される化粧品のInstagram投稿とストーリーでのPR。美容に特化したインフルエンサーを募集しています。',
            budget: 80000,
            endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
            status: 'PENDING',
            clientId: clientProfile.id,
            category: 'BEAUTY',
            targetPlatforms: ['INSTAGRAM'],
            targetPrefecture: '大阪府',
            targetGender: 'FEMALE',
            targetAgeMin: 18,
            targetAgeMax: 30,
            targetFollowerMin: 5000,
        },
    });
    const project3 = await prisma.project.create({
        data: {
            title: 'レストラン新メニューの紹介',
            description: 'レストランの新メニューをグルメインフルエンサーに紹介してもらうキャンペーン。',
            budget: 50000,
            endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
            status: 'PENDING',
            clientId: clientProfile.id,
            category: 'FOOD',
            targetPlatforms: ['INSTAGRAM', 'YOUTUBE'],
            targetPrefecture: '東京都',
            targetAgeMin: 25,
            targetAgeMax: 40,
            targetFollowerMin: 8000,
        },
    });
    console.log('Database seeded successfully!');
    console.log('Test accounts created:');
    console.log('Company: company@test.com / test123');
    console.log('Influencer: influencer@test.com / test123');
    console.log('Beauty Influencer: beauty@test.com / test123');
    console.log('Food Influencer: food@test.com / test123');
    console.log('');
    console.log('Sample projects created:');
    console.log('1. テスト商品プロモーション (ライフスタイル)');
    console.log('2. 新作コスメのPRキャンペーン (美容)');
    console.log('3. レストラン新メニューの紹介 (グルメ)');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
