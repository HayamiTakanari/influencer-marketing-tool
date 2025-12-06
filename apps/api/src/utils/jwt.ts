import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface JWTPayload {
  id: string;
  userId: string;
  email: string;
  role: string;
}

export const generateToken = (user: Pick<User, 'id' | 'email' | 'role'>): string => {
  const payload: JWTPayload = {
    id: user.id,
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  });
};

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
};