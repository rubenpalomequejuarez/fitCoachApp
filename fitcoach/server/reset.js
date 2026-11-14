// Borra los datos guardados para volver a empezar con los datos de ejemplo.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = process.env.FITCOACH_DATA_DIR || path.join(path.dirname(fileURLToPath(import.meta.url)), 'data');
fs.rmSync(dir, { recursive: true, force: true });
console.log('Datos borrados. Al arrancar de nuevo se crearán los datos de ejemplo.');
