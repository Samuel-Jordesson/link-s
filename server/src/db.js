// Banco simples em arquivo JSON. Troque por Postgres/Mongo quando crescer.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = process.env.DB_FILE || path.join(__dirname, '..', 'data', 'db.json');
const DATA_DIR = path.dirname(DB_FILE);

fs.mkdirSync(DATA_DIR, { recursive: true });

let data = { pages: [] };
if (fs.existsSync(DB_FILE)) {
  data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

export const db = {
  get data() {
    return data;
  },
  save() {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  },
};
