import { propertyService } from '../services/propertyService.js';
import { permitService } from '../services/permitService.js';
import { nycOpenDataService } from '../services/nycOpenDataService.js';
import { sendSuccess } from '../utils/response.js';

const permitsCache = new Map();
const inFlightPermits = new Map();
const propertyCache = new Map();
const inFlightProperties = new Map();

export const propertyController = {
  autocomplete: async (req, res, next) => {
    try {
      const query = req.query.q || req.query.text || '';
      const suggestions = await propertyService.autocomplete(query);
      return sendSuccess(res, suggestions, `Retrieved ${suggestions.length} property suggestions`, 200);
    } catch (error) {
      next(error);
    }
  },

  resolveProperty: async (req, res, next) => {
    try {
      const input = req.body || req.query;
      const identity = await propertyService.resolveProperty(input);
      return sendSuccess(res, identity, 'Property identity resolved successfully', 200);
    } catch (error) {
      next(error);
    }
  },

  search: async (req, res, next) => {
    try {
      const query = req.query.q || '';
      const results = await propertyService.searchProperties(query);
      return sendSuccess(res, results, `Found ${results.length} matching parcel records`, 200);
    } catch (error) {
      next(error);
    }
  },

  getByBBL: async (req, res, next) => {
    try {
      const { bbl } = req.params;
      const cleanBbl = String(bbl).trim().split('.')[0];
      const cacheKey = cleanBbl;

      // 1. Check in-memory property cache
      if (propertyCache.has(cacheKey)) {
        const cachedProperty = propertyCache.get(cacheKey);
        return sendSuccess(res, cachedProperty, 'Property parcel record retrieved (cached)', 200);
      }

      // 2. Check if fetch is already in flight
      if (inFlightProperties.has(cacheKey)) {
        const property = await inFlightProperties.get(cacheKey);
        return sendSuccess(res, property, 'Property parcel record retrieved', 200);
      }

      // 3. Start fetch and cache
      const fetchPromise = (async () => {
        const propertyData = await propertyService.getPropertyByBBL(cleanBbl);
        if (propertyData && propertyData.bbl) {
          propertyCache.set(cacheKey, propertyData);
        }
        return propertyData;
      })();

      inFlightProperties.set(cacheKey, fetchPromise);
      try {
        const property = await fetchPromise;
        return sendSuccess(res, property, 'Property parcel record retrieved', 200);
      } finally {
        inFlightProperties.delete(cacheKey);
      }
    } catch (error) {
      next(error);
    }
  },

  getPermitsByBBL: async (req, res, next) => {
    try {
      const { bbl } = req.params;
      const cleanBbl = String(bbl).trim().split('.')[0];
      const cacheKey = cleanBbl;

      // 1. Check in-memory cache
      if (permitsCache.has(cacheKey)) {
        const cachedData = permitsCache.get(cacheKey);
        return sendSuccess(res, cachedData, `Retrieved ${cachedData.length} permit records (cached)`, 200);
      }

      // 2. Check if a fetch is already in flight for this BBL
      if (inFlightPermits.has(cacheKey)) {
        const data = await inFlightPermits.get(cacheKey);
        return sendSuccess(res, data, `Retrieved ${data.length} permit records`, 200);
      }

      // 3. Start fetch and store in-flight promise
      const fetchPromise = (async () => {
        let bin = req.query.bin || '';
        if (!bin || bin === '0') {
          const pluto = await nycOpenDataService.getPlutoByBBL(cleanBbl);
          bin = pluto?.bin || '';
          if (!bin || bin === '0') {
            bin = await propertyService.resolveBin(pluto?.address, pluto?.borough, cleanBbl);
          }
        }
        const permitsRes = await nycOpenDataService.getDobPermits(cleanBbl, bin);
        const permits = permitService.formatPermits(permitsRes?.data || []);
        if (permits && permits.length > 0) {
          permitsCache.set(cacheKey, permits);
        }
        return permits;
      })();

      inFlightPermits.set(cacheKey, fetchPromise);
      try {
        const permits = await fetchPromise;
        return sendSuccess(res, permits, `Retrieved ${permits.length} permit records`, 200);
      } finally {
        inFlightPermits.delete(cacheKey);
      }
    } catch (error) {
      next(error);
    }
  },
};
