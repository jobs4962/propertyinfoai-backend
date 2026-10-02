export const taxService = {
  formatTaxInfo: (plutoData, assessmentHistory) => {
    const hasHistory = Array.isArray(assessmentHistory) && assessmentHistory.length > 0;
    const latestAssessment = hasHistory ? assessmentHistory[0] : null;

    const taxClass = String(latestAssessment?.taxClass || plutoData?.taxclass || '4');

    // Market value from API fullval
    const marketValue = latestAssessment?.marketValue !== undefined && latestAssessment?.marketValue !== null
      ? latestAssessment.marketValue
      : (plutoData?.assesstot ? Math.round(Number(plutoData.assesstot) / 0.45) : 0);

    // Assessed value from API avtot
    const assessedValue = latestAssessment?.assessedValue !== undefined && latestAssessment?.assessedValue !== null
      ? latestAssessment.assessedValue
      : (plutoData?.assesstot ? Number(plutoData.assesstot) : 0);

    // Transitional value from API avtot2 (or avtot if avtot2 not provided)
    const transitionalValue = latestAssessment?.transitionalValue !== undefined && latestAssessment?.transitionalValue !== null
      ? latestAssessment.transitionalValue
      : assessedValue;

    // Exemptions granted by city from API extot
    const exemptionsGranted = latestAssessment?.exemptions !== undefined && latestAssessment?.exemptions !== null
      ? latestAssessment.exemptions
      : (plutoData?.exempttot ? Number(plutoData.exempttot) : 0);

    // Transitional exemption value from API extot2
    const transitionalExemptionValue = latestAssessment?.transitionalExemptions !== undefined && latestAssessment?.transitionalExemptions !== null
      ? latestAssessment.transitionalExemptions
      : 0;

    // Tax abatements
    const taxAbatements = 0;

    // Fiscal Year Billing Period Label
    let fiscalYearLabel = '';
    if (latestAssessment?.year && latestAssessment.year !== 'N/A') {
      const parts = String(latestAssessment.year).split('/');
      if (parts.length === 2) {
        const startYr = parts[0].trim();
        const endYr = parts[1].length === 2 ? `20${parts[1].trim()}` : parts[1].trim();
        fiscalYearLabel = `Property tax bill for 7/1/${startYr} to 6/30/${endYr}`;
      } else {
        fiscalYearLabel = `Property tax bill for ${latestAssessment.year}`;
      }
    } else {
      const now = new Date();
      const currentYear = now.getFullYear();
      const fiscalStartYear = now.getMonth() >= 6 ? currentYear : currentYear - 1;
      const fiscalEndYear = fiscalStartYear + 1;
      fiscalYearLabel = `Property tax bill for 7/1/${fiscalStartYear} to 6/30/${fiscalEndYear}`;
    }

    // NYC Property Tax Rate Calculation
    // Class 1 ~ 20.083%, Class 4 ~ 10.848% (or historical ~ 10.514%)
    const taxRate = taxClass === '1' ? 0.20083 : 0.10848;
    const taxableBase = Math.max(0, (transitionalValue > 0 ? transitionalValue : assessedValue) - (transitionalValue > 0 ? transitionalExemptionValue : exemptionsGranted));
    const annualTax = Math.round(taxableBase * taxRate);

    return {
      taxClass,
      marketValue,
      assessedValue,
      exemptionsGranted,
      transitionalValue,
      transitionalExemptionValue,
      taxAbatements,
      annualTax,
      fiscalYearLabel,
      rates: [
        { year: '2024/25', rate: '10.762%' },
        { year: '2023/24', rate: '10.592%' },
        { year: '2022/23', rate: '10.646%' },
        { year: '2021/22', rate: '10.755%' },
        { year: '2020/21', rate: '10.694%' },
      ],
    };
  },
};
