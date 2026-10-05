import { savedPropertyModel } from '../models/savedPropertyModel.js';
import { ConflictError, NotFoundError, ForbiddenError } from '../utils/errors.js';

export const savedPropertyService = {
  saveProperty: async (userId, { bbl, bin, address }) => {
    const cleanBbl = String(bbl).trim().split('.')[0];
    const existing = await savedPropertyModel.findSavedPropertyByUserAndBbl(userId, cleanBbl);
    if (existing) {
      return { savedProperty: existing, alreadySaved: true };
    }

    const savedProperty = await savedPropertyModel.createSavedProperty({
      userId,
      bbl: cleanBbl,
      bin: bin ? String(bin) : null,
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
      // Fallback: If passed BBL as ID
      const cleanBbl = String(id).replace('bbl-', '').trim().split('.')[0];
      await savedPropertyModel.deleteSavedPropertyByUserAndBbl(userId, cleanBbl);
      return { success: true, message: 'Property removed from saved portfolio.' };
    }
    if (item.userId !== userId) {
      throw new ForbiddenError('Access denied. You cannot delete this saved property.');
    }
    await savedPropertyModel.deleteSavedProperty(id);
    return { success: true, message: 'Property removed from saved portfolio.' };
  },

  deleteSavedPropertyByBbl: async (userId, bbl) => {
    const cleanBbl = String(bbl).replace('bbl-', '').trim().split('.')[0];
    await savedPropertyModel.deleteSavedPropertyByUserAndBbl(userId, cleanBbl);
    return { success: true, message: 'Property removed from saved portfolio.' };
  },

  checkIsSaved: async (userId, bbl) => {
    const cleanBbl = String(bbl).trim().split('.')[0];
    const existing = await savedPropertyModel.findSavedPropertyByUserAndBbl(userId, cleanBbl);
    return { isSaved: !!existing };
  },
};
