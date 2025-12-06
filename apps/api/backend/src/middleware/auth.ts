import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt';
import { sendUnauthorized, sendForbidden } from '../utils/api-response';

export interface AuthRequest extends Request {
  user?: JWTPayload;
  requestId?: string;
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendUnauthorized(res, 'No token provided', req.requestId);
      return;
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    req.user = payload;
    next();
  } catch (error) {
    sendUnauthorized(res, 'Invalid token', req.requestId);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendUnauthorized(res, 'Unauthorized', req.requestId);
      return;
    }

    if (roles.length && !roles.includes(req.user.role)) {
      sendForbidden(res, 'Insufficient permissions', req.requestId);
      return;
    }

    next();
  };
};

export const authorizeRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendUnauthorized(res, 'Unauthorized', req.requestId);
      return;
    }

    if (!roles.includes(req.user.role)) {
      console.error(`[ROLE_AUTH_FAIL] User role '${req.user.role}' not in allowed roles: [${roles.join(', ')}]. Path: ${req.path}`);
      sendForbidden(res, 'Insufficient permissions for this role', req.requestId);
      return;
    }

    next();
  };
};