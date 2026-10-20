// Carrega o .env da raiz do projeto (se existir). Precisa ser o primeiro import do index.js,
// porque db.js lê as variáveis assim que é importado.
// Variáveis já definidas no ambiente (ex: painel da Hostinger) têm prioridade.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ENV_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '.env');

if (fs.existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE);
