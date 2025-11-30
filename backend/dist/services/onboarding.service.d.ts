import { OnboardingStep, UserRole } from '@prisma/client';
/**
 * Chapter 1-12: オンボーディング進捗管理
 */
export declare const initializeOnboarding: (userId: string, role: UserRole) => Promise<any>;
/**
 * ステップを完了
 */
export declare const completeOnboardingStep: (userId: string, step: OnboardingStep) => Promise<any>;
/**
 * オンボーディングをスキップ
 */
export declare const skipOnboarding: (userId: string) => Promise<any>;
/**
 * オンボーディング進捗を取得
 */
export declare const getOnboardingProgress: (userId: string) => Promise<any>;
/**
 * オンボーディングステップの定義
 */
export declare const getOnboardingSteps: (role: UserRole) => {
    step: string;
    title: string;
    description: string;
    duration: string;
}[];
/**
 * オンボーディング完了率を取得
 */
export declare const getOnboardingCompletionRate: () => Promise<{
    total: number;
    completed: number;
    rate: number;
}>;
//# sourceMappingURL=onboarding.service.d.ts.map