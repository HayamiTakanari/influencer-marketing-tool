import { Request, Response } from 'express';
import { RegisterInput, LoginInput } from '../schemas/auth';
export declare const register: (req: Request<{}, {}, RegisterInput>, res: Response) => Promise<void>;
export declare const login: (req: Request<{}, {}, LoginInput>, res: Response) => Promise<void>;
//# sourceMappingURL=auth.controller.d.ts.map