import { PrismaClient, OnboardingStep, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Chapter 1-12: オンボーディング進捗管理
 */
export const initializeOnboarding = async (
  userId: string,
  role: UserRole
): Promise<any> => {
  try {
    const existing = await prisma.onboardingProgress.findUnique({
      where: { userId },
    });

    if (existing) {
      return existing;
    }

    const progress = await prisma.onboardingProgress.create({
      data: {
        userId,
        role,
        completedSteps: [],
        startedAt: new Date(),
      },
    });

    console.log(`✓ Onboarding initialized for user: ${userId}`);
    return progress;
  } catch (error) {
    console.error('Error initializing onboarding:', error);
    throw error;
  }
};

/**
 * ステップを完了
 */
export const completeOnboardingStep = async (
  userId: string,
  step: OnboardingStep
): Promise<any> => {
  try {
    const progress = await prisma.onboardingProgress.findUnique({
      where: { userId },
    });

    if (!progress) {
      throw new Error('Onboarding progress not found');
    }

    // 既に完了済みの場合はスキップ
    if (progress.completedSteps.includes(step)) {
      return progress;
    }

    const completedSteps = [...progress.completedSteps, step];
    const isCompleted = completedSteps.length === 7; // 全ステップ

    const updated = await prisma.onboardingProgress.update({
      where: { userId },
      data: {
        completedSteps,
        completedAt: isCompleted ? new Date() : null,
        updatedAt: new Date(),
      },
    });

    console.log(`✓ Onboarding step completed: ${step}`);
    return updated;
  } catch (error) {
    console.error('Error completing onboarding step:', error);
    throw error;
  }
};

/**
 * オンボーディングをスキップ
 */
export const skipOnboarding = async (userId: string): Promise<any> => {
  try {
    const progress = await prisma.onboardingProgress.findUnique({
      where: { userId },
    });

    if (!progress) {
      throw new Error('Onboarding progress not found');
    }

    const updated = await prisma.onboardingProgress.update({
      where: { userId },
      data: {
        skipped: true,
        skippedAt: new Date(),
        completedAt: new Date(), // スキップした場合も完了扱いに
      },
    });

    console.log(`✓ Onboarding skipped: ${userId}`);
    return updated;
  } catch (error) {
    console.error('Error skipping onboarding:', error);
    throw error;
  }
};

/**
 * オンボーディング進捗を取得
 */
export const getOnboardingProgress = async (userId: string): Promise<any> => {
  try {
    const progress = await prisma.onboardingProgress.findUnique({
      where: { userId },
    });

    if (!progress) {
      return null;
    }

    const totalSteps = 7;
    const completedCount = progress.completedSteps.length;

    return {
      ...progress,
      progress: {
        completed: completedCount,
        total: totalSteps,
        percentage: Math.round((completedCount / totalSteps) * 100),
      },
      isCompleted: progress.completedAt !== null,
    };
  } catch (error) {
    console.error('Error getting onboarding progress:', error);
    throw error;
  }
};

/**
 * オンボーディングステップの定義
 */
export const getOnboardingSteps = (role: UserRole) => {
  const companySteps = [
    {
      step: 'DASHBOARD',
      title: 'ダッシュボードの見方',
      description: 'ダッシュボードの基本的な使い方を学びます',
      duration: '2分',
    },
    {
      step: 'INFLUENCER_SEARCH',
      title: 'インフルエンサー検索',
      description: '条件に合ったインフルエンサーを検索する方法',
      duration: '3分',
    },
    {
      step: 'PROJECT_CREATION',
      title: 'プロジェクト作成',
      description: '新しいプロジェクトを作成して公開する方法',
      duration: '5分',
    },
    {
      step: 'SCOUTING',
      title: 'スカウト送信',
      description: 'インフルエンサーへのスカウト方法',
      duration: '3分',
    },
    {
      step: 'MATCHING_FLOW',
      title: 'マッチング後の流れ',
      description: 'チャットから納品までの流れ',
      duration: '4分',
    },
    {
      step: 'BILLING',
      title: '請求・支払い',
      description: '請求書の発行と支払い方法',
      duration: '3分',
    },
    {
      step: 'COMPLETED',
      title: 'セットアップ完了',
      description: 'これであなたも準備完了です！',
      duration: '1分',
    },
  ];

  const influencerSteps = [
    {
      step: 'DASHBOARD',
      title: 'ダッシュボードの見方',
      description: 'ダッシュボードの基本的な使い方',
      duration: '2分',
    },
    {
      step: 'INFLUENCER_SEARCH',
      title: 'プロフィール充実',
      description: '魅力的なプロフィール作成の方法',
      duration: '4分',
    },
    {
      step: 'PROJECT_CREATION',
      title: '案件の探し方',
      description: '条件に合った案件を探す方法',
      duration: '3分',
    },
    {
      step: 'SCOUTING',
      title: '応募の方法',
      description: '案件への応募方法とコツ',
      duration: '3分',
    },
    {
      step: 'MATCHING_FLOW',
      title: 'マッチング後の流れ',
      description: 'チャットから納品までの流れ',
      duration: '4分',
    },
    {
      step: 'BILLING',
      title: '報酬の受け取り',
      description: '報酬の受け取り方法と振込タイミング',
      duration: '3分',
    },
    {
      step: 'COMPLETED',
      title: 'セットアップ完了',
      description: 'これであなたも準備完了です！',
      duration: '1分',
    },
  ];

  if (role === 'COMPANY') {
    return companySteps;
  } else if (role === 'INFLUENCER') {
    return influencerSteps;
  }

  return [];
};

/**
 * オンボーディング完了率を取得
 */
export const getOnboardingCompletionRate = async () => {
  try {
    const total = await prisma.onboardingProgress.count();
    const completed = await prisma.onboardingProgress.count({
      where: { completedAt: { not: null } },
    });

    return {
      total,
      completed,
      rate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  } catch (error) {
    console.error('Error getting completion rate:', error);
    throw error;
  }
};
