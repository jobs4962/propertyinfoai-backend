import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { userModel } from '../models/userModel.js';
import { sendError } from '../utils/response.js';

export const requireAuth = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return sendError(res, 'Authentication required. Please login.', 401, 'UNAUTHORIZED');
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (!decoded || !decoded.userId) {
      return sendError(res, 'Invalid or expired token. Please login again.', 401, 'UNAUTHORIZED');
    }

    const user = await userModel.findUserById(decoded.userId);
    if (!user) {
      return sendError(res, 'User account no longer exists.', 401, 'UNAUTHORIZED');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return sendError(res, 'Invalid or expired session. Please login again.', 401, 'UNAUTHORIZED');
    }
    return sendError(res, 'Authentication check failed.', 401, 'UNAUTHORIZED');
  }
};
