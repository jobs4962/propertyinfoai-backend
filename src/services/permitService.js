export const permitService = {
  formatPermits: (rawPermits) => {
    if (!rawPermits || !Array.isArray(rawPermits) || rawPermits.length === 0) {
      return [];
    }

    const formatDate = (dStr) => {
      if (!dStr) return 'Not available';
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return dStr;
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${mm}/${dd}/${yyyy}`;
    };

    const formatStatusText = (str) => {
      if (!str) return 'Approved';
      const lower = str.trim().toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    };

    const JOB_TYPE_MAP = {
      A1: 'Alteration type 1',
      A2: 'Alteration type 2',
      A3: 'Alteration type 3',
      NB: 'New Building',
      DM: 'Demolition',
      SI: 'Sign',
      PA: 'Place of Assembly',
    };

    return rawPermits.map((item) => {
      const filingDate = item.pre__filing_date || item.latest_action_date || 'Not available';
      const rawJobType = item.job_type || '';
      const jobType = JOB_TYPE_MAP[rawJobType] || rawJobType || 'Alteration';

      const statusDescrp = formatStatusText(item.job_status_descrp);
      const approvedDate = item.approved ? formatDate(item.approved) : item.latest_action_date ? formatDate(item.latest_action_date) : '';
      const jobStatus = approvedDate ? `${statusDescrp} (${approvedDate})` : statusDescrp;

      const rawCost = item.initial_cost;
      let initialCost = null;
      if (rawCost !== null && rawCost !== undefined) {
        const numCost = parseFloat(String(rawCost).replace(/[^0-9.]/g, ''));
        if (!isNaN(numCost)) initialCost = numCost;
      }

      const jobNumber = item.job__ ? (item.doc__ ? `${item.job__}-${item.doc__}` : item.job__) : 'Not available';

      let workType = '';
      if (item.plumbing === 'X') {
        workType = 'Plumbing';
      } else if (item.mechanical === 'X') {
        workType = 'Mechanical';
      } else if (item.boiler === 'X') {
        workType = 'Boiler';
      } else if (item.other_description) {
        workType = item.other_description;
      } else if (item.building_type) {
        workType = item.building_type;
      }

      return {
        filingDate: formatDate(filingDate),
        jobNumber,
        jobType,
        jobStatus,
        workType,
        initialCost,
        description: item.job_description || 'NYC DOB filed permit update.',
        applicant: item.applicant_s_first_name ? `${item.applicant_s_first_name} ${item.applicant_s_last_name}` : 'Not available',
      };
    });
  },
};
