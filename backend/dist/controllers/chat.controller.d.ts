import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}
export declare const sendMessage: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMessages: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const markMessagesAsRead: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getUnreadCount: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getChatList: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=chat.controller.d.ts.map