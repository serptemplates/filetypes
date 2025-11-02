import path from 'path';
import fs from 'fs';
type Database = any;

const DB_PATH = path.resolve('.data', 'filetypes.db');

let db: Database | null = null;
let sqlInitPromise: Promise<any> | null = null;
let SQLModule: any = null;
let loadedMtime: number | null = null;

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
      const buf = fs.readFileSync(DB_PATH);
      db = new SQLModule.Database(new Uint8Array(buf));
      try { loadedMtime = fs.statSync(DB_PATH).mtimeMs; } catch {}
    } else {
      db = new SQLModule.Database();
    }
  }
}

export async function getDb() {
  await init();
  // Hot-reload DB if file changed on disk (e.g., after reseed)
  try {
    const m = fs.statSync(DB_PATH).mtimeMs;
    if (loadedMtime && m > loadedMtime) {
      const buf = fs.readFileSync(DB_PATH);
      // Close and reopen (sql.js doesn't have close on this wrapper; replace instance)
      db = new SQLModule.Database(new Uint8Array(buf));
      loadedMtime = m;
    }
  } catch {}
  return db!;
}
