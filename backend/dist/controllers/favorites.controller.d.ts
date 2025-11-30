import { Request, Response } from 'express';
export declare const addToFavorites: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const removeFromFavorites: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getFavorites: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const isInFavorites: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateFavoriteNotes: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=favorites.controller.d.ts.map