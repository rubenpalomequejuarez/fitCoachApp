import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { seed } from './seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const DATA_DIR = process.env.FITCOACH_DATA_DIR || path.join(__dirname, 'data');
export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const FILE = path.join(DATA_DIR, 'db.json');

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

export const uid = () => crypto.randomBytes(8).toString('hex');

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

export function verifyPassword(password, { salt, hash }) {
  const candidate = crypto.scryptSync(password, salt, 64);
  const stored = Buffer.from(hash, 'hex');
  return stored.length === candidate.length && crypto.timingSafeEqual(candidate, stored);
}

let db;

const emptyDb = () => ({ users: [], exercises: [], diets: {}, sessions: {} });

export const hasData = () => fs.existsSync(FILE);

// Sin archivo de datos se arranca con una base vacía. Los datos de ejemplo
// solo se crean de forma explícita con seedDatabase() (npm run seed).
export function load() {
  db = hasData() ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : emptyDb();
  return db;
}

// Crea las cuentas y datos de ejemplo. Sus contraseñas son públicas, por lo
// que nunca debe ejecutarse en producción.
export function seedDatabase() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Los datos de ejemplo no se pueden crear con NODE_ENV=production');
  }
  db = seed({ uid, hashPassword });
  save();
  return db;
}

// Escritura atómica: primero a un temporal y luego se renombra.
export function save() {
  const tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, FILE);
}

export const getDb = () => db;

// Semana ISO (lunes a domingo), p. ej. "2026-W44". Sirve para que los
// ejercicios completados se reinicien cada semana.
export function weekKey(date = new Date()) {
  const t = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t - yearStart) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}
