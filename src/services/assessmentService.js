const TAX_RATES_BY_YEAR = {
  '2026/27': 0.10848,
  '2025/26': 0.10848,
  '2024/25': 0.10762,
  '2023/24': 0.10592,
  '2022/23': 0.10646,
  '2021/22': 0.10755,
  '2020/21': 0.10694,
  '2019/20': 0.10537,
  '2018/19': 0.10514,
  '2017/18': 0.10514,
  '2016/17': 0.10574,
  '2015/16': 0.10656,
  '2014/15': 0.10684,
  '2013/14': 0.10323,
  '2012/13': 0.10288,
  '2011/12': 0.10152,
  '2010/11': 0.10312,
  '2009/10': 0.10426,
  '2008/09': 0.10241,
  '2007/08': 0.10059,
};

export const assessmentService = {
  formatAssessmentHistory: (rawInput) => {
    if (!rawInput) return [];

    let currentList = [];
    let histList = [];

    if (Array.isArray(rawInput)) {
      histList = rawInput;
    } else if (typeof rawInput === 'object') {
      currentList = Array.isArray(rawInput.current) ? rawInput.current : [];
      histList = Array.isArray(rawInput.historical) ? rawInput.historical : [];
    }

    const yearMap = new Map();

    // 1. Process 8y4t-faws (Current NYC assessment roll)
    for (const r of currentList) {
      const yrNum = parseInt(r.year, 10);
      if (!yrNum) continue;

      const curLabel = `${yrNum - 1}/${String(yrNum).slice(-2)}`;
      const pyLabel = `${yrNum - 2}/${String(yrNum - 1).slice(-2)}`;

      const curMkt = Number(r.curmkttot || r.finmkttot || 0);
      const curAv = Number(r.curacttot || r.finacttot || 0);
      const curTrn = Number(r.curtrntot || r.fintrntot || curAv);
      const curExt = Number(r.curactextot || r.finactextot || 0);
      const bldgClass = r.bldg_class || 'F4';
      const taxClass = r.curtaxclass || r.fintaxclass || '4';

      if (curMkt > 0 && !yearMap.has(curLabel)) {
        const taxable = Math.max(0, curTrn - curExt);
        const rate = TAX_RATES_BY_YEAR[curLabel] || 0.10848;
        const ratePct = `${(rate * 100).toFixed(3)}%`;
        const baseTax = Math.round(curTrn * rate);
        const propertyTax = Math.round(taxable * rate);

        yearMap.set(curLabel, {
          year: curLabel,
          propertyType: bldgClass,
          marketValue: curMkt,
          assessedValue: curAv,
          transitionalValue: curTrn,
          exemptions: curExt,
          taxableValue: taxable,
          taxRate: ratePct,
          baseTax: baseTax,
          propertyTax: propertyTax,
          taxClass,
        });
      }

      // Prior year from 8y4t-faws
      const pyMkt = Number(r.pymkttot || 0);
      const pyAv = Number(r.pyacttot || 0);
      const pyTrn = Number(r.pytrntot || pyAv);
      const pyExt = Number(r.pyactextot || 0);

      if (pyMkt > 0 && !yearMap.has(pyLabel) && yrNum >= 2021) {
        const taxable = Math.max(0, pyTrn - pyExt);
        const rate = TAX_RATES_BY_YEAR[pyLabel] || 0.10755;
        const ratePct = `${(rate * 100).toFixed(3)}%`;
        const baseTax = Math.round(pyTrn * rate);
        const propertyTax = Math.round(taxable * rate);

        yearMap.set(pyLabel, {
          year: pyLabel,
          propertyType: bldgClass,
          marketValue: pyMkt,
          assessedValue: pyAv,
          transitionalValue: pyTrn,
          exemptions: pyExt,
          taxableValue: taxable,
          taxRate: ratePct,
          baseTax: baseTax,
          propertyTax: propertyTax,
          taxClass,
        });
      }
    }

    // 2. Process yjxr-fw8i (Historical NYC assessment roll)
    for (const r of histList) {
      const label = r.year || 'N/A';
      if (!yearMap.has(label)) {
        const mkt = Number(r.fullval || 0);
        const av = Number(r.avtot || 0);
        const trn = Number(r.avtot2 || av);
        const ext = Number(r.extot || 0);
        const ext2 = Number(r.extot2 || 0);
        const bldgClass = r.bldgcl || 'F4';
        const taxClass = r.taxclass || '4';

        const effectiveExempt = r.avtot2 ? ext2 : ext;
        const taxable = trn > 0 ? Math.max(0, trn - effectiveExempt) : 0;
        const rate = TAX_RATES_BY_YEAR[label] || 0.10514;
        const ratePct = `${(rate * 100).toFixed(3)}%`;
        const baseTax = Math.round(trn * rate);
        const propertyTax = Math.round(taxable * rate);

        yearMap.set(label, {
          year: label,
          propertyType: bldgClass,
          marketValue: mkt,
          assessedValue: av,
          transitionalValue: trn,
          exemptions: ext,
          transitionalExemptions: ext2,
          taxableValue: taxable,
          taxRate: ratePct,
          baseTax: baseTax,
          propertyTax: propertyTax,
          taxClass,
        });
      }
    }

    // Sort descending by tax year
    return Array.from(yearMap.values()).sort((a, b) => b.year.localeCompare(a.year));
  },
};
