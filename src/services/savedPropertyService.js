import { savedPropertyModel } from '../models/savedPropertyModel.js';
import { ConflictError, NotFoundError, ForbiddenError } from '../utils/errors.js';

export const savedPropertyService = {
  saveProperty: async (userId, { bbl, bin, address }) => {
    const existing = await savedPropertyModel.findSavedPropertyByUserAndBbl(userId, bbl);
    if (existing) {
      return { savedProperty: existing, alreadySaved: true };
    }

    const savedProperty = await savedPropertyModel.createSavedProperty({
      userId,
      bbl,
      bin,
      address,
    });

    return { savedProperty, alreadySaved: false };
  },

  getSavedProperties: async (userId) => {
    return savedPropertyModel.findSavedPropertiesByUserId(userId);
  },

  getSavedPropertyById: async (userId, id) => {
    const item = await savedPropertyModel.findSavedPropertyById(id);
    if (!item) {
      throw new NotFoundError('Saved property record not found.');
    }
    if (item.userId !== userId) {
      throw new ForbiddenError('Access denied. You do not own this saved property.');
    }
    return item;
  },

  deleteSavedProperty: async (userId, id) => {
    const item = await savedPropertyModel.findSavedPropertyById(id);
    if (!item) {
      throw new NotFoundError('Saved property record not found.');
    }
    if (item.userId !== userId) {
      throw new ForbiddenError('Access denied. You cannot delete this saved property.');
    }
    await savedPropertyModel.deleteSavedProperty(id);
    return { success: true, message: 'Property removed from saved portfolio.' };
  },

  deleteSavedPropertyByBbl: async (userId, bbl) => {
    await savedPropertyModel.deleteSavedPropertyByUserAndBbl(userId, bbl);
    return { success: true, message: 'Property removed from saved portfolio.' };
  },

  checkIsSaved: async (userId, bbl) => {
    const existing = await savedPropertyModel.findSavedPropertyByUserAndBbl(userId, bbl);
    return { isSaved: !!existing };
  },
};
