import { User } from '@prisma/client';
export interface JWTPayload {
    id: string;
    userId: string;
    email: string;
    role: string;
}
export declare const generateToken: (user: Pick<User, "id" | "email" | "role">) => string;
export declare const verifyToken: (token: string) => JWTPayload;
//# sourceMappingURL=jwt.d.ts.map