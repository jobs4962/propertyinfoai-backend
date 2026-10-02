import { savedPropertyService } from '../services/savedPropertyService.js';
import { sendSuccess } from '../utils/response.js';

export const savedPropertyController = {
  createSavedProperty: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { bbl, bin, address } = req.body;
      const result = await savedPropertyService.saveProperty(userId, { bbl, bin, address });

      const status = result.alreadySaved ? 200 : 201;
      const message = result.alreadySaved
        ? 'Property is already saved in portfolio'
        : 'Property saved successfully';

      return sendSuccess(res, result, message, status);
    } catch (error) {
      next(error);
    }
  },

  getSavedProperties: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const savedProperties = await savedPropertyService.getSavedProperties(userId);
      return sendSuccess(res, savedProperties, 'Saved properties retrieved', 200);
    } catch (error) {
      next(error);
    }
  },

  getSavedPropertyById: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const savedProperty = await savedPropertyService.getSavedPropertyById(userId, id);
      return sendSuccess(res, savedProperty, 'Saved property record retrieved', 200);
    } catch (error) {
      next(error);
    }
  },

  deleteSavedProperty: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      let result;
      if (id.startsWith('bbl-') || id.length === 10 || !isNaN(id)) {
        // If passed BBL directly (or formatted as BBL)
        const cleanBbl = id.replace('bbl-', '');
        result = await savedPropertyService.deleteSavedPropertyByBbl(userId, cleanBbl);
      } else {
        result = await savedPropertyService.deleteSavedProperty(userId, id);
      }

      return sendSuccess(res, result, 'Property removed from saved portfolio', 200);
    } catch (error) {
      next(error);
    }
  },

  deleteSavedPropertyByBbl: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { bbl } = req.params;
      const result = await savedPropertyService.deleteSavedPropertyByBbl(userId, bbl);
      return sendSuccess(res, result, 'Property removed from saved portfolio', 200);
    } catch (error) {
      next(error);
    }
  },

  checkIsSaved: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { bbl } = req.params;
      const result = await savedPropertyService.checkIsSaved(userId, bbl);
      return sendSuccess(res, result, 'Check saved status', 200);
    } catch (error) {
      next(error);
    }
  },
};
