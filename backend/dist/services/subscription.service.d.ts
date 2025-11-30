export declare class SubscriptionService {
    static getActivePlans(): Promise<{
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        price: number;
        isActive: boolean;
        features: string[];
        billingCycle: string;
        maxProjects: number;
        maxTeamMembers: number;
    }[]>;
    static createSubscription(userId: string, planId: string, stripeSubscriptionId?: string): Promise<{
        plan: {
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            price: number;
            isActive: boolean;
            features: string[];
            billingCycle: string;
            maxProjects: number;
            maxTeamMembers: number;
        };
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        startDate: Date;
        endDate: Date | null;
        userId: string;
        planId: string;
        nextBillingAt: Date | null;
        autoRenew: boolean;
    }>;
    static getUserSubscription(userId: string): Promise<{
        plan: {
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            price: number;
            isActive: boolean;
            features: string[];
            billingCycle: string;
            maxProjects: number;
            maxTeamMembers: number;
        };
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        startDate: Date;
        endDate: Date | null;
        userId: string;
        planId: string;
        nextBillingAt: Date | null;
        autoRenew: boolean;
    }>;
    static cancelSubscription(subscriptionId: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        startDate: Date;
        endDate: Date | null;
        userId: string;
        planId: string;
        nextBillingAt: Date | null;
        autoRenew: boolean;
    }>;
    static isSubscriptionValid(userId: string): Promise<boolean>;
    static initializeDefaultPlans(): Promise<void>;
}
//# sourceMappingURL=subscription.service.d.ts.map