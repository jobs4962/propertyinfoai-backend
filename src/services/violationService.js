export const violationService = {
  formatComplaints311: (rawComplaints) => {
    if (!rawComplaints || !Array.isArray(rawComplaints) || rawComplaints.length === 0) {
      return [];
    }

    const formatDate = (dStr) => {
      if (!dStr) return 'Not available';
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return 'Not available';
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${mm}/${dd}/${yyyy}`;
    };

    return rawComplaints.map((item) => ({
      createdDate: formatDate(item.created_date),
      agency: item.agency || 'NYC 311',
      complaintType: item.complaint_type || 'General',
      descriptor: item.descriptor || '',
      disposition: item.resolution_description || item.status || 'Completed',
      closedDate: formatDate(item.closed_date),
    }));
  },
};
