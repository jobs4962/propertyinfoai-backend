import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  PORT: process.env.PORT || 5000,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_jwt_secret_key_2026',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  NYC_GEOSEARCH_BASE_URL: process.env.NYC_GEOSEARCH_BASE_URL || 'https://geosearch.planninglabs.nyc/v2',
  NYC_OPEN_DATA: {
    BASE_URL: process.env.NYC_OPEN_DATA_BASE_URL || 'https://data.cityofnewyork.us',
    PLUTO: process.env.NYC_PLUTO_DATASET || '64uk-42ks',
    ASSESSMENT: process.env.NYC_ASSESSMENT_DATASET || 'yjxr-fw8i',
    TAX_RATES: process.env.NYC_TAX_RATE_DATASET || '7zb8-7bpk',
    PERMITS: process.env.NYC_PERMITS_DATASET || 'ic3t-wcy2',
    DOB_FILING: process.env.NYC_DOB_FILING_DATASET || 'w9ak-ipjd',
    COMPLAINTS_311: process.env.NYC_311_DATASET || 'erm2-nwe9',
    ZONING: process.env.NYC_ZONING_DATASET || 'fdkv-4t4z',
    E_DESIGNATION: process.env.NYC_E_DESIGNATION_DATASET || 'hxm3-23vy',
    ACRIS_LEGALS: process.env.NYC_ACRIS_LEGALS_DATASET || '8h5j-fqxa',
    ACRIS_MASTER: process.env.NYC_ACRIS_MASTER_DATASET || 'bnx9-e6tj',
    ACRIS_PARTIES: process.env.NYC_ACRIS_PARTIES_DATASET || '636b-3b5g',
  },
};
