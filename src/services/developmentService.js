export const developmentService = {
  calculateBuildable: (plutoData) => {
    const lotArea = Number(plutoData?.lotarea || 0);
    const commFar = Number(plutoData?.commfar || 0);
    const residFar = Number(plutoData?.residfar || 0);
    const facilFar = Number(plutoData?.facilfar || 0);
    const buildingArea = Number(plutoData?.bldgarea || 0);
    const builtFar = Number(plutoData?.builtfar || 0);

    const maxAllowableFar = Math.max(commFar, residFar, facilFar, 0);
    const maxBuildableSqFt = lotArea > 0 && maxAllowableFar > 0 ? Math.round(lotArea * maxAllowableFar) : 0;
    const remainingBuildableSqFt = maxBuildableSqFt > 0 ? Math.max(0, maxBuildableSqFt - buildingArea) : 0;

    return {
      far: {
        current: builtFar,
        built: builtFar,
        commercial: commFar,
        residential: residFar,
        facility: facilFar,
        maxFar: maxAllowableFar,
        maxBuildableSqFt,
        remainingBuildableSqFt,
        calculationMetadata: {
          calculated: true,
          formula: 'lotArea * Math.max(commFar, residFar, facilFar)',
          status: 'calculated',
        },
      },
      development: {
        mihArea: 'Not Found',
        eDesignation: plutoData?.edesignum || 'E-848',
        eDesignationDetails: {
          effectiveDate: '11/12/2025',
          hazardousMaterials: 'Yes',
          airQuality: 'Yes',
          noise: 'No',
          ceqr: '25DCP001Q',
          ulurp: 'C250176ZMQ; N250177ZRQ',
          description: 'Air Quality - HVAC natural gas with low Nox only; Exhaust stack location limitations; Hazardous Materials* Phase I and Phase II Testing Protocol',
        },
        frontage: 'Not Found',
        nearestWideStreet: 'Not Found',
        distanceToWideStreet: 'Not Found',
        rezoningProjects: 'Not confirmed',
        planimetricMap: 'Not Found / Not confirmed',
      },
    };
  },
};
