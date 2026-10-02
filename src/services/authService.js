import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { userModel } from '../models/userModel.js';
import { BadRequestError, ConflictError, UnauthorizedError } from '../utils/errors.js';

export const authService = {
  signup: async ({ name, email, password }) => {
    const existingUser = await userModel.findUserByEmail(email.toLowerCase().trim());
    if (existingUser) {
      throw new ConflictError('An account with this email address already exists.');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await userModel.createUser({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });

    const token = authService.generateToken(user.id);

    return { user, token };
  },

  login: async ({ email, password }) => {
    const cleanEmail = email.toLowerCase().trim();
    let user = await userModel.findUserByEmail(cleanEmail);

    // Auto-seed default analyst account if logging in for the first time
    if (!user && cleanEmail === 'analyst@propertyintel.com') {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password || 'password123', salt);
      user = await userModel.createUser({
        name: 'Property Analyst',
        email: cleanEmail,
        password: hashedPassword,
      });
    }

    if (!user) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const token = authService.generateToken(user.id);

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return { user: safeUser, token };
  },

  getCurrentUser: async (userId) => {
    const user = await userModel.findUserById(userId);
    if (!user) {
      throw new UnauthorizedError('User account not found.');
    }
    return user;
  },

  generateToken: (userId) => {
    return jwt.sign({ userId }, env.JWT_SECRET, {
      expiresIn: '7d',
    });
  },
};
