import { Request, Response } from 'express';
export declare const addToWatchlist: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const removeFromWatchlist: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getWatchlist: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const isInWatchlist: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateWatchlistNotes: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=watchlist.controller.d.ts.map