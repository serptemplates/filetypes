import fs from 'node:fs';
import path from 'node:path';
import initSqlJs from 'sql.js';

const SQL = await initSqlJs({ locateFile: f => path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', f) });
const db = new SQL.Database(new Uint8Array(fs.readFileSync('.data/filetypes.db')));
const table = db.exec("SELECT slug,extension,name,summary FROM file_types WHERE slug='mp4'")[0];
console.log(table?.columns);
console.log(table?.values?.[0]);
