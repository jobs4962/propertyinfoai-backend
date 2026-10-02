import prisma from '../config/db.js';

export const userModel = {
  createUser: async ({ name, email, password }) => {
    return prisma.user.create({
      data: { name, email, password },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  findUserByEmail: async (email) => {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  findUserById: async (id) => {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },
};
