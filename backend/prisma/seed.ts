import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with test data...');

  // Clean existing data
  await prisma.achievement.deleteMany({});
  await prisma.servicePricing.deleteMany({});
  await prisma.socialAccount.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.milestone.deleteMany({});
  await prisma.projectSchedule.deleteMany({});
  await prisma.inquiryResponse.deleteMany({});
  await prisma.bulkInquiry.deleteMany({});
  await prisma.portfolio.deleteMany({});
  await prisma.application.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.teamMember.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.influencer.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('✅ Cleared existing data');

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Client users
  const clientUser1 = await prisma.user.create({
    data: {
      email: 'client1@example.com',
      password: hashedPassword,
      role: 'CLIENT',
      isVerified: true,
    },
  });

  const clientUser2 = await prisma.user.create({
    data: {
      email: 'client2@example.com',
      password: hashedPassword,
      role: 'CLIENT',
      isVerified: true,
    },
  });

  // Influencer users
  const influencerUser1 = await prisma.user.create({
    data: {
      email: 'influencer1@example.com',
      password: hashedPassword,
      role: 'INFLUENCER',
      isVerified: true,
    },
  });

  const influencerUser2 = await prisma.user.create({
    data: {
      email: 'influencer2@example.com',
      password: hashedPassword,
      role: 'INFLUENCER',
      isVerified: true,
    },
  });

  const influencerUser3 = await prisma.user.create({
    data: {
      email: 'influencer3@example.com',
      password: hashedPassword,
      role: 'INFLUENCER',
      isVerified: true,
    },
  });

  console.log('✅ Created users');

  // Create clients
  const client1 = await prisma.client.create({
    data: {
      userId: clientUser1.id,
      companyName: '株式会社エステール',
      industry: '美容・化粧品',
      contactName: '田中太郎',
      contactPhone: '09012345678',
      address: '東京都渋谷区',
    },
  });

  const client2 = await prisma.client.create({
    data: {
      userId: clientUser2.id,
      companyName: 'ファッション新生社',
      industry: 'ファッション',
      contactName: '佐藤花子',
      contactPhone: '09087654321',
      address: '東京都東新宿区',
    },
  });

  console.log('✅ Created clients');

  // Create influencers
  const influencer1 = await prisma.influencer.create({
    data: {
      userId: influencerUser1.id,
      displayName: '美容インフルエンサー太郎',
      bio: '美容とメイクの投稿が得意です。毎日新しい商品を試しています。',
      gender: 'MALE',
      birthDate: new Date('1990-05-15'),
      phoneNumber: '09011111111',
      address: '東京都渋谷区',
      prefecture: '東京都',
      city: '渋谷区',
      categories: ['美容', 'スキンケア', 'メイク'],
      priceMin: 50000,
      priceMax: 200000,
      isRegistered: true,
    },
  });

  const influencer2 = await prisma.influencer.create({
    data: {
      userId: influencerUser2.id,
      displayName: 'ファッションブロガー花子',
      bio: 'トレンドファッションと毎日のコーディネート情報を発信中',
      gender: 'FEMALE',
      birthDate: new Date('1995-08-20'),
      phoneNumber: '09022222222',
      address: '東京都渋谷区',
      prefecture: '東京都',
      city: '渋谷区',
      categories: ['ファッション', 'トレンド', 'ライフスタイル'],
      priceMin: 100000,
      priceMax: 300000,
      isRegistered: true,
    },
  });

  const influencer3 = await prisma.influencer.create({
    data: {
      userId: influencerUser3.id,
      displayName: 'グルメクイーン由美',
      bio: 'グルメ情報とレストランレビューをシェア。毎週新しいお店を発見',
      gender: 'FEMALE',
      birthDate: new Date('1992-12-10'),
      phoneNumber: '09033333333',
      address: '東京都東新宿区',
      prefecture: '東京都',
      city: '東新宿区',
      categories: ['グルメ', 'レストラン', 'カフェ'],
      priceMin: 75000,
      priceMax: 250000,
      isRegistered: true,
    },
  });

  console.log('✅ Created influencers');

  // Create social accounts (SNS) - only actual schema fields
  await prisma.socialAccount.create({
    data: {
      influencerId: influencer1.id,
      platform: 'INSTAGRAM',
      username: '@beauty_taro',
      profileUrl: 'https://instagram.com/beauty_taro',
      followerCount: 250000,
      engagementRate: 8.5,
      isVerified: true,
    },
  });

  await prisma.socialAccount.create({
    data: {
      influencerId: influencer1.id,
      platform: 'TIKTOK',
      username: '@beauty_taro_tiktok',
      profileUrl: 'https://tiktok.com/@beauty_taro_tiktok',
      followerCount: 450000,
      engagementRate: 12.3,
      isVerified: true,
    },
  });

  await prisma.socialAccount.create({
    data: {
      influencerId: influencer2.id,
      platform: 'INSTAGRAM',
      username: '@fashion_hanako',
      profileUrl: 'https://instagram.com/fashion_hanako',
      followerCount: 380000,
      engagementRate: 9.2,
      isVerified: true,
    },
  });

  await prisma.socialAccount.create({
    data: {
      influencerId: influencer2.id,
      platform: 'YOUTUBE',
      username: 'FashionHanakoChannel',
      profileUrl: 'https://youtube.com/@FashionHanakoChannel',
      followerCount: 150000,
      engagementRate: 6.8,
      isVerified: true,
    },
  });

  await prisma.socialAccount.create({
    data: {
      influencerId: influencer3.id,
      platform: 'INSTAGRAM',
      username: '@gourmet_yumi',
      profileUrl: 'https://instagram.com/gourmet_yumi',
      followerCount: 320000,
      engagementRate: 10.1,
      isVerified: true,
    },
  });

  console.log('✅ Created social accounts (SNS)');

  // Create achievements (実績)
  await prisma.achievement.create({
    data: {
      influencerId: influencer1.id,
      projectName: '新作美容液プロモーション',
      brandName: 'ビューティケア',
      purpose: 'SALES',
      platform: 'INSTAGRAM',
      description: '新作美容液の紹介と使用感のレビュー投稿',
      metrics: {
        views: 125000,
        likes: 15800,
        shares: 2300,
        conversions: 580,
      },
      budget: 300000,
      duration: '2024年10月〜11月',
      imageUrl: 'https://example.com/achievement1.jpg',
      link: 'https://instagram.com/p/example1',
    },
  });

  await prisma.achievement.create({
    data: {
      influencerId: influencer1.id,
      projectName: 'スキンケアルーティン動画',
      brandName: 'フェイスケアラボ',
      purpose: 'AWARENESS',
      platform: 'TIKTOK',
      description: 'スキンケアルーティンの実演動画シリーズ',
      metrics: {
        views: 2500000,
        likes: 450000,
        shares: 125000,
        conversions: 3200,
      },
      budget: 500000,
      duration: '2024年9月〜10月',
      imageUrl: 'https://example.com/achievement2.jpg',
      link: 'https://tiktok.com/@beauty_taro_tiktok/video/example',
    },
  });

  await prisma.achievement.create({
    data: {
      influencerId: influencer2.id,
      projectName: '秋冬ファッションコレクション',
      brandName: 'ファッションハウス',
      purpose: 'BRAND_IMAGE',
      platform: 'INSTAGRAM',
      description: '秋冬ファッションコレクションのスタイリング紹介',
      metrics: {
        views: 280000,
        likes: 28500,
        shares: 4200,
        conversions: 850,
      },
      budget: 400000,
      duration: '2024年8月〜9月',
      imageUrl: 'https://example.com/achievement3.jpg',
      link: 'https://instagram.com/fashion_hanako',
    },
  });

  console.log('✅ Created achievements (実績)');

  // Create service pricing (料金体系)
  await prisma.servicePricing.create({
    data: {
      influencerId: influencer1.id,
      serviceType: 'PHOTOGRAPHY',
      price: 50000,
      unit: 'per_post',
      description: '撮影からフォトレタッチまで',
      isActive: true,
    },
  });

  await prisma.servicePricing.create({
    data: {
      influencerId: influencer1.id,
      serviceType: 'CONTENT_CREATION',
      price: 80000,
      unit: 'per_post',
      description: 'コンテンツプランニングと作成',
      isActive: true,
    },
  });

  await prisma.servicePricing.create({
    data: {
      influencerId: influencer2.id,
      serviceType: 'POSTING',
      price: 100000,
      unit: 'per_post',
      description: 'インスタグラムへの高品質投稿',
      isActive: true,
    },
  });

  await prisma.servicePricing.create({
    data: {
      influencerId: influencer2.id,
      serviceType: 'VIDEO_EDITING',
      price: 120000,
      unit: 'per_post',
      description: 'YouTube用の高品質動画編集',
      isActive: true,
    },
  });

  await prisma.servicePricing.create({
    data: {
      influencerId: influencer3.id,
      serviceType: 'CONSULTATION',
      price: 75000,
      unit: 'per_hour',
      description: 'グルメコンテンツ戦略のコンサル',
      isActive: true,
    },
  });

  console.log('✅ Created service pricing (料金体系)');

  // Create projects
  const project1 = await prisma.project.create({
    data: {
      clientId: client1.id,
      title: '新作美容液ローンチキャンペーン',
      description: '新作美容液の認知拡大とブランドイメージ向上',
      category: '美容・スキンケア',
      budget: 1000000,
      targetPlatforms: ['INSTAGRAM', 'TIKTOK'],
      targetPrefecture: '東京都',
      targetCity: '渋谷区',
      targetGender: 'FEMALE',
      targetAgeMin: 20,
      targetAgeMax: 35,
      targetFollowerMin: 100000,
      status: 'IN_PROGRESS',
      startDate: new Date('2024-11-01'),
      endDate: new Date('2024-12-31'),
      matchedInfluencerId: influencer1.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      clientId: client2.id,
      title: '秋冬ファッション新作紹介',
      description: '新作ファッションコレクションの認知と販売促進',
      category: 'ファッション',
      budget: 1200000,
      targetPlatforms: ['INSTAGRAM', 'YOUTUBE'],
      targetPrefecture: '東京都',
      targetGender: 'FEMALE',
      targetAgeMin: 18,
      targetAgeMax: 40,
      targetFollowerMin: 150000,
      status: 'MATCHED',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2024-10-31'),
      matchedInfluencerId: influencer2.id,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      clientId: client1.id,
      title: 'グルメレストラン紹介プロジェクト',
      description: '新しくオープンしたレストランの認知拡大',
      category: 'グルメ・飲食',
      budget: 800000,
      targetPlatforms: ['INSTAGRAM', 'TIKTOK'],
      targetPrefecture: '東京都',
      status: 'PENDING',
      targetFollowerMin: 80000,
    },
  });

  console.log('✅ Created projects');

  // Create applications
  await prisma.application.create({
    data: {
      projectId: project2.id,
      influencerId: influencer2.id,
      clientId: client2.id,
      message: 'このプロジェクトにとても興味があります。私のフォロワーにぴったりです。',
      proposedPrice: 250000,
      isAccepted: true,
      appliedAt: new Date('2024-08-20'),
    },
  });

  await prisma.application.create({
    data: {
      projectId: project3.id,
      influencerId: influencer3.id,
      clientId: client1.id,
      message: 'グルメコンテンツが得意です。ぜひ一緒に仕事をしたいです。',
      proposedPrice: 150000,
      isAccepted: false,
      appliedAt: new Date('2024-11-15'),
    },
  });

  console.log('✅ Created applications');

  // Create transactions (請求先)
  await prisma.transaction.create({
    data: {
      projectId: project1.id,
      amount: 300000,
      fee: 30000,
      stripePaymentId: 'pi_stripe_1001',
      status: 'completed',
    },
  });

  await prisma.transaction.create({
    data: {
      projectId: project2.id,
      amount: 250000,
      fee: 25000,
      stripePaymentId: 'pi_stripe_1002',
      status: 'completed',
    },
  });

  console.log('✅ Created transactions (請求先)');

  // Create project schedules (稼働状況)
  const schedule1 = await prisma.projectSchedule.create({
    data: {
      projectId: project1.id,
      publishDate: new Date('2024-11-20'),
    },
  });

  const schedule2 = await prisma.projectSchedule.create({
    data: {
      projectId: project2.id,
      publishDate: new Date('2024-09-15'),
    },
  });

  console.log('✅ Created project schedules (稼働状況)');

  // Create milestones for schedule
  await prisma.milestone.create({
    data: {
      scheduleId: schedule1.id,
      type: 'VIDEO_COMPLETION',
      title: '撮影・動画完成',
      description: '美容液紹介動画の撮影と編集完了',
      dueDate: new Date('2024-11-10'),
      isCompleted: true,
      completedAt: new Date('2024-11-08'),
    },
  });

  await prisma.milestone.create({
    data: {
      scheduleId: schedule1.id,
      type: 'FINAL_APPROVAL',
      title: '最終承認',
      description: '動画の最終確認と承認',
      dueDate: new Date('2024-11-15'),
      isCompleted: true,
      completedAt: new Date('2024-11-14'),
    },
  });

  await prisma.milestone.create({
    data: {
      scheduleId: schedule1.id,
      type: 'PUBLISH_DATE',
      title: '投稿日',
      description: 'SNSへの公開',
      dueDate: new Date('2024-11-20'),
      isCompleted: false,
    },
  });

  await prisma.milestone.create({
    data: {
      scheduleId: schedule2.id,
      type: 'VIDEO_COMPLETION',
      title: '撮影・動画完成',
      description: 'ファッション紹介動画の完成',
      dueDate: new Date('2024-09-10'),
      isCompleted: true,
      completedAt: new Date('2024-09-08'),
    },
  });

  await prisma.milestone.create({
    data: {
      scheduleId: schedule2.id,
      type: 'PUBLISH_DATE',
      title: '投稿日',
      description: 'SNSへの公開',
      dueDate: new Date('2024-09-15'),
      isCompleted: true,
      completedAt: new Date('2024-09-15'),
    },
  });

  console.log('✅ Created milestones (Milestones)');

  // Create reviews
  await prisma.review.create({
    data: {
      projectId: project1.id,
      reviewerId: clientUser1.id,
      revieweeId: influencerUser1.id,
      influencerId: influencer1.id,
      rating: 5,
      comment: 'プロフェッショナルな対応で、成果も期待を上回っていました。',
      isPublic: true,
    },
  });

  await prisma.review.create({
    data: {
      projectId: project2.id,
      reviewerId: clientUser2.id,
      revieweeId: influencerUser2.id,
      influencerId: influencer2.id,
      rating: 5,
      comment: '素晴らしいコンテンツ。フォロワーの反応も非常に良好です。',
      isPublic: true,
    },
  });

  console.log('✅ Created reviews');

  // Create notifications
  await prisma.notification.create({
    data: {
      userId: influencerUser1.id,
      type: 'PROJECT_MATCHED',
      title: 'プロジェクトがマッチしました',
      message: '新作美容液ローンチキャンペーンであなたがマッチしました！',
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: clientUser1.id,
      type: 'APPLICATION_RECEIVED',
      title: '応募がありました',
      message: 'グルメレストラン紹介プロジェクトに応募がありました。',
      isRead: false,
    },
  });

  console.log('✅ Created notifications');

  console.log('\n✅ Database seeding completed successfully!');
  console.log('\n📊 Created test data summary:');
  console.log('  - 5 Users (2 Clients, 3 Influencers)');
  console.log('  - 2 Clients');
  console.log('  - 3 Influencers');
  console.log('  - 5 Social Accounts (SNS)');
  console.log('  - 3 Achievements (実績)');
  console.log('  - 5 Service Pricing (料金体系)');
  console.log('  - 3 Projects');
  console.log('  - 2 Applications');
  console.log('  - 2 Transactions (請求先)');
  console.log('  - 2 Project Schedules (稼働状況)');
  console.log('  - 5 Milestones');
  console.log('  - 2 Reviews');
  console.log('  - 2 Notifications');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
