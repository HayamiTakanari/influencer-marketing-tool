import { Request, Response } from 'express';
export declare const createTeam: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMyTeam: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateTeam: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const addTeamMember: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const removeTeamMember: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateMemberRole: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteTeam: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=team.controller.d.ts.map