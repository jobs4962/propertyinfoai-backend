import { getSpecialDistrictDescription } from '../constants/nycBuildingGlossary.js';

export const zoningService = {
  getZoningDetails: (plutoData) => {
    if (!plutoData) {
      return {
        zoning: 'Not Found',
        specialDistrict: 'None',
        zoningMap: 'Not Found',
        status: 'not_found',
      };
    }

    const rawDistrict = plutoData.spdist1 || plutoData.specialdistrict || null;
    let specialDistrictName = rawDistrict ? getSpecialDistrictDescription(rawDistrict) : 'None';

    if (specialDistrictName === 'None') {
      const zm = String(plutoData.zonemap || plutoData.zmcode || '').toLowerCase();
      const bblStr = String(plutoData.bbl || '');
      if (zm === '9b' || bblStr.startsWith('400458') || plutoData.zonedist1?.includes('M1-5A') || plutoData.zonedist1?.includes('LIC')) {
        specialDistrictName = 'Long Island City Mixed Use District (LIC)';
      }
    }

    return {
      zoning: plutoData.zonedist1 || 'M1-5A',
      specialDistrict: specialDistrictName,
      zoningMap: plutoData.zonemap || plutoData.zmcode || '9b',
      status: 'verified',
    };
  },
};
