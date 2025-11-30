"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRole = exports.authorize = exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const api_response_1 = require("../utils/api-response");
const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            (0, api_response_1.sendUnauthorized)(res, 'No token provided', req.requestId);
            return;
        }
        const token = authHeader.substring(7);
        const payload = (0, jwt_1.verifyToken)(token);
        req.user = payload;
        next();
    }
    catch (error) {
        (0, api_response_1.sendUnauthorized)(res, 'Invalid token', req.requestId);
    }
};
exports.authenticate = authenticate;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            (0, api_response_1.sendUnauthorized)(res, 'Unauthorized', req.requestId);
            return;
        }
        if (roles.length && !roles.includes(req.user.role)) {
            (0, api_response_1.sendForbidden)(res, 'Insufficient permissions', req.requestId);
            return;
        }
        next();
    };
};
exports.authorize = authorize;
const authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            (0, api_response_1.sendUnauthorized)(res, 'Unauthorized', req.requestId);
            return;
        }
        if (!roles.includes(req.user.role)) {
            console.error(`[ROLE_AUTH_FAIL] User role '${req.user.role}' not in allowed roles: [${roles.join(', ')}]. Path: ${req.path}`);
            (0, api_response_1.sendForbidden)(res, 'Insufficient permissions for this role', req.requestId);
            return;
        }
        next();
    };
};
exports.authorizeRole = authorizeRole;
//# sourceMappingURL=auth.js.map