import { authService } from '../services/authService.js';
import { sendSuccess } from '../utils/response.js';

export const authController = {
  signup: async (req, res, next) => {
    try {
      const { name, email, password } = req.body;
      const { user, token } = await authService.signup({ name, email, password });

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return sendSuccess(res, { user, token }, 'Account created successfully', 201);
    } catch (error) {
      next(error);
    }
  },

  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const { user, token } = await authService.login({ email, password });

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return sendSuccess(res, { user, token }, 'Login successful', 200);
    } catch (error) {
      next(error);
    }
  },

  logout: async (req, res, next) => {
    try {
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
      return sendSuccess(res, null, 'Logged out successfully', 200);
    } catch (error) {
      next(error);
    }
  },

  me: async (req, res, next) => {
    try {
      const user = await authService.getCurrentUser(req.user.id);
      return sendSuccess(res, { user }, 'User session active', 200);
    } catch (error) {
      next(error);
    }
  },
};
