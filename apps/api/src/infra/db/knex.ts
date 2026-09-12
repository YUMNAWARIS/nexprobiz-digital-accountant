import { createDb } from '@fa/database';
import pg from 'pg';

// DATE (OID 1082) → 'YYYY-MM-DD' string, never a JS Date (avoids timezone shifts on accounting dates).
pg.types.setTypeParser(1082, (v: string) => v);

export function createKnex(connectionString: string, applicationName = 'fa-api') {
  return createDb({ connectionString, applicationName, poolMax: 10 });
}
