export declare class BillingService {
    static generateInvoiceNumber(): string;
    static createInvoice(projectId: string, clientId: string, influencerId: string, amount: number): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        projectId: string;
        clientId: string;
        influencerId: string;
        dueDate: Date;
        amount: number;
        documentUrl: string | null;
        tax: number | null;
        totalAmount: number;
        invoiceNumber: string;
        paidAt: Date | null;
    }>;
    static getPendingInvoices(userId: string, role: 'CLIENT' | 'INFLUENCER'): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        projectId: string;
        clientId: string;
        influencerId: string;
        dueDate: Date;
        amount: number;
        documentUrl: string | null;
        tax: number | null;
        totalAmount: number;
        invoiceNumber: string;
        paidAt: Date | null;
    }[]>;
    static markAsPaid(invoiceId: string, stripePaymentId?: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        projectId: string;
        clientId: string;
        influencerId: string;
        dueDate: Date;
        amount: number;
        documentUrl: string | null;
        tax: number | null;
        totalAmount: number;
        invoiceNumber: string;
        paidAt: Date | null;
    }>;
    static markAsOverdue(invoiceId: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        projectId: string;
        clientId: string;
        influencerId: string;
        dueDate: Date;
        amount: number;
        documentUrl: string | null;
        tax: number | null;
        totalAmount: number;
        invoiceNumber: string;
        paidAt: Date | null;
    }>;
    static getInvoiceSummary(userId: string): Promise<{
        totalEarnings: number;
        pending: number;
        paid: number;
    }>;
}
//# sourceMappingURL=billing.service.d.ts.map