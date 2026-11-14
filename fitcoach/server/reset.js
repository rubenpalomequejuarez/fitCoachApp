// Borra los datos guardados. Para recrear los de ejemplo: npm run seed
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = process.env.FITCOACH_DATA_DIR || path.join(path.dirname(fileURLToPath(import.meta.url)), 'data');
fs.rmSync(dir, { recursive: true, force: true });
console.log('Datos borrados. Ejecuta "npm run seed" para crear los datos de ejemplo.');
