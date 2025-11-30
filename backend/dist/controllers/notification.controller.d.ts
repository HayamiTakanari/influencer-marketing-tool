import { Request, Response } from 'express';
export declare const getNotifications: (req: Request, res: Response) => Promise<void>;
export declare const markAsRead: (req: Request, res: Response) => Promise<void>;
export declare const markAllAsRead: (req: Request, res: Response) => Promise<void>;
export declare const getUnreadCount: (req: Request, res: Response) => Promise<void>;
export declare const deleteNotification: (req: Request, res: Response) => Promise<void>;
export declare const createSystemAnnouncement: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=notification.controller.d.ts.map