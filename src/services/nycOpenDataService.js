import axios from 'axios';
import { env } from '../config/env.js';

const client = axios.create({
  baseURL: env.NYC_OPEN_DATA.BASE_URL,
  timeout: 15000, // 15 seconds timeout
});

const PLUTO_FIELDS = 'bbl,address,zipcode,borough,ownername,bldgclass,yearbuilt,numfloors,numbldgs,unitstotal,unitsres,lotarea,bldgarea,comarea,factryarea,resarea,officearea,retailarea,garagearea,strgearea,otherarea,lotfront,lotdepth,bldgfront,bldgdepth,zonedist1,zonemap,commfar,facilfar,builtfar,residfar,assessland,assesstot,proxcode,lottype,irrlotcode,ext,yearalter1,yearalter2,latitude,longitude,cd,council,schooldist,firecomp,policeprct';

export const nycOpenDataService = {
  /**
   * Generic fetcher for Socrata datasets
   */
  fetchDataset: async (datasetId, params = {}) => {
    try {
      const response = await client.get(`/resource/${datasetId}.json`, { params });
      return {
        status: 'success',
        data: response.data || [],
      };
    } catch (error) {
      console.warn(`[NYC Open Data] Failed to fetch dataset ${datasetId}:`, error.message);
      return {
        status: 'unavailable',
        data: null,
        message: `NYC dataset ${datasetId} is currently unavailable`,
      };
    }
  },

  /**
   * Fetch PLUTO property record by BBL or search query
   */
  getPlutoByBBL: async (bbl) => {
    if (!bbl) return null;
    const cleanBbl = String(bbl).trim();
    const formattedBbl = cleanBbl.includes('.') ? cleanBbl : `${cleanBbl}.00000000`;
    const res = await nycOpenDataService.fetchDataset(env.NYC_OPEN_DATA.PLUTO, {
      $select: PLUTO_FIELDS,
      $where: `bbl = '${cleanBbl}' OR bbl = '${formattedBbl}'`,
      $limit: 1,
    });
    return res.status === 'success' && res.data && res.data.length > 0 ? res.data[0] : null;
  },

  searchPluto: async (query) => {
    if (!query || !query.trim()) {
      const res = await nycOpenDataService.fetchDataset(env.NYC_OPEN_DATA.PLUTO, {
        $select: PLUTO_FIELDS,
        $limit: 15,
      });
      return res.status === 'success' ? res.data || [] : [];
    }

    let q = query.trim().replace(/'/g, "''").toUpperCase();
    // Remove trailing country identifiers like USA, United States
    q = q.replace(/,\s*(USA|UNITED STATES|US)$/i, '').trim();

    const isNum = /^\d+(\.\d+)?$/.test(q);

    if (isNum) {
      const formattedBbl = q.length === 10 ? `${q}.00000000` : q;
      const whereClause = `bbl = '${q}' OR bbl = '${formattedBbl}' OR zipcode = '${q}' OR address LIKE '%${q}%'`;
      const res = await nycOpenDataService.fetchDataset(env.NYC_OPEN_DATA.PLUTO, {
        $select: PLUTO_FIELDS,
        $where: whereClause,
        $limit: 20,
      });
      return res.status === 'success' ? res.data || [] : [];
    }

    // Extract primary street part before comma (e.g., "31-78 25 STREET" from "31-78 25 STREET, Astoria, NY")
    const streetPart = q.split(',')[0].trim();

    // Generate address search variants
    const streetVariants = new Set([streetPart]);
    streetVariants.add(streetPart.replace(/\bSTREET\b/g, 'ST'));
    streetVariants.add(streetPart.replace(/\bST\b/g, 'STREET'));
    streetVariants.add(streetPart.replace(/\bAVENUE\b/g, 'AVE'));
    streetVariants.add(streetPart.replace(/\bAVE\b/g, 'AVENUE'));
    streetVariants.add(streetPart.replace(/\bROAD\b/g, 'RD'));
    streetVariants.add(streetPart.replace(/\bRD\b/g, 'ROAD'));
    streetVariants.add(streetPart.replace(/\bBOULEVARD\b/g, 'BLVD'));
    streetVariants.add(streetPart.replace(/\bBLVD\b/g, 'BOULEVARD'));
    streetVariants.add(streetPart.replace(/(\d+)(ST|ND|RD|TH)\b/gi, '$1'));

    const whereConditions = Array.from(streetVariants)
      .filter(Boolean)
      .map((v) => `address LIKE '%${v}%'`)
      .join(' OR ');

    const res = await nycOpenDataService.fetchDataset(env.NYC_OPEN_DATA.PLUTO, {
      $select: PLUTO_FIELDS,
      $where: whereConditions,
      $limit: 20,
    });

    return res.status === 'success' ? res.data || [] : [];
  },

  /**
   * Fetch Assessment roll records
   */
  getAssessmentRecords: async (bbl) => {
    if (!bbl) return { status: 'unavailable', data: [] };
    const cleanBbl = String(bbl).trim().split('.')[0].replace(/\D/g, '');
    if (cleanBbl.length < 10) return { status: 'unavailable', data: [] };
    const boro = cleanBbl[0];
    const block = parseInt(cleanBbl.slice(1, 6), 10);
    const lot = parseInt(cleanBbl.slice(6, 10), 10);

    // Fetch both Current Assessment Roll (8y4t-faws) and Historical Assessment Roll (yjxr-fw8i) in parallel
    const [currentRes, histRes] = await Promise.allSettled([
      nycOpenDataService.fetchDataset('8y4t-faws', { parid: cleanBbl }),
      nycOpenDataService.fetchDataset('yjxr-fw8i', {
        boro: String(boro),
        block: String(block),
        lot: String(lot),
      }),
    ]);

    const currentRecords = currentRes.status === 'fulfilled' && currentRes.value?.status === 'success' ? (currentRes.value?.data || []) : [];
    const histRecords = histRes.status === 'fulfilled' && histRes.value?.status === 'success' ? (histRes.value?.data || []) : [];

    return {
      status: 'success',
      data: {
        current: currentRecords,
        historical: histRecords,
      },
    };
  },

  /**
   * Fetch Property Tax Rates
   */
  getTaxRates: async () => {
    return nycOpenDataService.fetchDataset(env.NYC_OPEN_DATA.TAX_RATES, {
      $order: 'tax_year DESC',
      $limit: 10,
    });
  },

  /**
   * Fetch DOB Permits & Filings
   * Uses native fetch (not axios) for this dataset — axios has socket-level timeout
   * issues with ic3t-wcy2 on this environment even though the endpoint works fine.
   */
  getDobPermits: async (bbl, bin) => {
    const PERMIT_FIELDS = '$select=pre__filing_date,latest_action_date,job__,doc__,job_type,job_status_descrp,approved,other_description,building_type,initial_cost,job_description,applicant_s_first_name,applicant_s_last_name,block,lot,bin__,bbl&$limit=50';

    if (!bbl && !bin) return { status: 'unavailable', data: [] };

    const cleanBbl = bbl ? String(bbl).trim().split('.')[0] : '';
    const baseUrl = `${env.NYC_OPEN_DATA.BASE_URL}/resource/${env.NYC_OPEN_DATA.PERMITS}.json`;

    let queryParam = '';
    if (cleanBbl && cleanBbl.length === 10) {
      const block = cleanBbl.slice(1, 6).padStart(5, '0');
      const lot = cleanBbl.slice(6).padStart(5, '0');
      queryParam = `block=${encodeURIComponent(block)}&lot=${encodeURIComponent(lot)}`;
    } else if (cleanBbl) {
      queryParam = `bbl=${encodeURIComponent(cleanBbl)}`;
    } else if (bin) {
      queryParam = `bin__=${encodeURIComponent(String(bin).trim())}`;
    }

    const url = `${baseUrl}?${queryParam}&${PERMIT_FIELDS}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s timeout
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return { status: 'success', data: Array.isArray(data) ? data : [] };
    } catch (err) {
      console.warn(`[NYC Open Data] getDobPermits failed:`, err.message);
      return { status: 'unavailable', data: [] };
    }
  },

  /**
   * Fetch 311 Complaints & Violations
   */
  getComplaints311: async (bbl, address) => {
    const COMPLAINT_FIELDS = 'created_date,agency,complaint_type,descriptor,resolution_description,closed_date,bbl';
    let whereClause = '';

    if (bbl) {
      const cleanBbl = String(bbl).trim().split('.')[0]; // 10-digit BBL (e.g. 4004580098)
      whereClause = `bbl = '${cleanBbl}'`;
    } else if (address) {
      const cleanAddress = address.trim().replace(/'/g, "''").toUpperCase();
      whereClause = `incident_address LIKE '%${cleanAddress}%'`;
    } else {
      return { status: 'unavailable', data: [] };
    }

    return nycOpenDataService.fetchDataset(env.NYC_OPEN_DATA.COMPLAINTS_311, {
      $select: COMPLAINT_FIELDS,
      $where: whereClause,
      $order: 'created_date DESC',
      $limit: 25,
    });
  },

  /**
   * Fetch E-Designation details
   */
  getEDesignations: async (bbl) => {
    if (!bbl || bbl.length !== 10) return { status: 'unavailable', data: [] };
    const boro = bbl[0];
    const block = parseInt(bbl.slice(1, 6), 10);
    const lot = parseInt(bbl.slice(6), 10);
    return nycOpenDataService.fetchDataset(env.NYC_OPEN_DATA.E_DESIGNATION, {
      $where: `bbl = '${bbl}' OR (borough = '${boro}' AND block = '${block}' AND lot = '${lot}')`,
      $limit: 5,
    });
  },

  /**
   * Fetch ACRIS Title Deeds & Legal Documents
   */
  getAcrisLegals: async (bbl) => {
    const cleanBbl = String(bbl || '').trim().split('.')[0].replace(/[^0-9]/g, '');
    if (!cleanBbl || cleanBbl.length !== 10) return { status: 'unavailable', data: [] };
    const boro = cleanBbl[0];
    const block = parseInt(cleanBbl.slice(1, 6), 10);
    const lot = parseInt(cleanBbl.slice(6), 10);
    return nycOpenDataService.fetchDataset(env.NYC_OPEN_DATA.ACRIS_LEGALS, {
      $where: `borough = '${boro}' AND block = '${block}' AND lot = '${lot}'`,
      $limit: 30,
    });
  },

  /**
   * Fetch Consolidated ACRIS Document Details (Legals + Master + Parties)
   */
  getFullAcrisDocuments: async (bbl) => {
    const cleanBbl = String(bbl || '').trim().split('.')[0].replace(/[^0-9]/g, '');
    if (!cleanBbl || cleanBbl.length !== 10) return { legals: [], master: [], parties: [] };
    try {
      const legalsRes = await nycOpenDataService.getAcrisLegals(cleanBbl);
      const legalsData = legalsRes?.data || [];
      const docIds = [...new Set(legalsData.map((d) => d.document_id).filter(Boolean))].slice(0, 15);

      if (docIds.length === 0) {
        return { legals: legalsData, master: [], parties: [] };
      }

      const docIdFilter = docIds.map((id) => `'${id}'`).join(',');

      const [masterRes, partiesRes] = await Promise.all([
        nycOpenDataService.fetchDataset(env.NYC_OPEN_DATA.ACRIS_MASTER, {
          $where: `document_id in(${docIdFilter})`,
          $limit: 50,
        }).catch(() => ({ data: [] })),
        nycOpenDataService.fetchDataset(env.NYC_OPEN_DATA.ACRIS_PARTIES, {
          $where: `document_id in(${docIdFilter})`,
          $limit: 80,
        }).catch(() => ({ data: [] })),
      ]);

      return {
        legals: legalsData,
        master: masterRes?.data || [],
        parties: partiesRes?.data || [],
      };
    } catch (err) {
      console.warn('[ACRIS Full] Error fetching comprehensive documents:', err.message);
      return { legals: [], master: [], parties: [] };
    }
  },

  /**
   * Fetch Certificates of Occupancy (CO) from DOB NOW / BIS
   */
  getCertificateOfOccupancy: async (bin) => {
    if (!bin || bin === '0') return { status: 'unavailable', data: [] };
    const cleanBin = String(bin).trim();
    try {
      // DOB NOW Certificate of Occupancy dataset: bs8b-p36w
      const res = await nycOpenDataService.fetchDataset('bs8b-p36w', {
        bin: cleanBin,
        $limit: 5,
        $order: 'issue_date DESC',
      });
      if (res.status === 'success' && res.data && res.data.length > 0) {
        return res;
      }
      // Fallback to BIS Certificate of Occupancy dataset: kj4p-ruqc
      return nycOpenDataService.fetchDataset('kj4p-ruqc', {
        bin: cleanBin,
        $limit: 5,
      });
    } catch (err) {
      console.warn('[DOB CO] Error fetching certificates of occupancy:', err.message);
      return { status: 'unavailable', data: [] };
    }
  },
};


