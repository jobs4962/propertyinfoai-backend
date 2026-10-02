import prisma from '../config/db.js';

export const savedPropertyModel = {
  createSavedProperty: async ({ userId, bbl, bin, address }) => {
    return prisma.savedProperty.create({
      data: { userId, bbl, bin: bin || null, address },
      select: {
        id: true,
        userId: true,
        bbl: true,
        bin: true,
        address: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  findSavedPropertiesByUserId: async (userId) => {
    return prisma.savedProperty.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        bbl: true,
        bin: true,
        address: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  findSavedPropertyById: async (id) => {
    return prisma.savedProperty.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        bbl: true,
        bin: true,
        address: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  findSavedPropertyByUserAndBbl: async (userId, bbl) => {
    return prisma.savedProperty.findUnique({
      where: {
        userId_bbl: {
          userId,
          bbl,
        },
      },
      select: {
        id: true,
        userId: true,
        bbl: true,
        bin: true,
        address: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  deleteSavedProperty: async (id) => {
    return prisma.savedProperty.delete({
      where: { id },
    });
  },

  deleteSavedPropertyByUserAndBbl: async (userId, bbl) => {
    return prisma.savedProperty.deleteMany({
      where: {
        userId,
        bbl,
      },
    });
  },
};
