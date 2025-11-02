import path from 'path';
import fs from 'fs';
type Database = any;

const DB_PATH = path.resolve('.data', 'filetypes.db');

let db: Database | null = null;
let sqlInitPromise: Promise<any> | null = null;
let SQLModule: any = null;

async function init() {
  if (!sqlInitPromise) {
    sqlInitPromise = (async () => {
      const mod: any = await import('sql.js');
      const init = mod.default || mod;
      SQLModule = await init({ locateFile: (f: string) => path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', f) });
      return SQLModule;
    })();
  }
  await sqlInitPromise;
  if (!db) {
    if (fs.existsSync(DB_PATH)) {
      db = new SQLModule.Database(new Uint8Array(fs.readFileSync(DB_PATH)));
    } else {
      db = new SQLModule.Database();
    }
  }
}

export async function getDb() {
  await init();
  return db!;
}
