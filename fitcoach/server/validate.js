import fs from 'node:fs';
import path from 'node:path';
import { UPLOAD_DIR, uid } from './db.js';

export const httpErr = (status, message) => Object.assign(new Error(message), { status });

export const MEAL_TYPES = ['Desayuno', 'Media mañana', 'Comida', 'Merienda', 'Cena'];

export function str(value, max, label, { required = false } = {}) {
  const s = typeof value === 'string' ? value.trim() : '';
  if (required && !s) throw httpErr(400, `${label} es obligatorio`);
  if (s.length > max) throw httpErr(400, `${label} es demasiado largo (máximo ${max} caracteres)`);
  return s;
}

export function int(value, min, max, label) {
  const n = Number(value);
  if (value === '' || value == null || !Number.isInteger(n) || n < min || n > max) {
    throw httpErr(400, `${label} debe ser un número entre ${min} y ${max}`);
  }
  return n;
}

// Acepta enlaces de YouTube (watch, youtu.be, shorts, embed, live).
// Devuelve { videoId, url } o null si no es un enlace válido.
export function parseYouTube(input) {
  if (typeof input !== 'string') return null;
  let raw = input.trim();
  if (!raw || raw.length > 300) return null;
  if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    const host = u.hostname.toLowerCase().replace(/^(www\.|m\.)/, '');
    let id = null;
    if (host === 'youtu.be') {
      id = u.pathname.slice(1).split('/')[0];
    } else if (host === 'youtube.com') {
      if (u.pathname === '/watch') id = u.searchParams.get('v');
      else {
        const m = u.pathname.match(/^\/(embed|shorts|live)\/([\w-]{6,15})/);
        if (m) id = m[2];
      }
    }
    if (id && /^[\w-]{6,15}$/.test(id)) {
      u.protocol = 'https:';
      return { videoId: id, url: u.toString() };
    }
  } catch { /* enlace mal formado */ }
  return null;
}

function saveImage(dataUrl) {
  const m = /^data:image\/(png|jpe?g|webp);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl || '');
  if (!m) throw httpErr(400, 'La imagen no es válida (usa PNG, JPG o WebP)');
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > 5 * 1024 * 1024) throw httpErr(413, 'La imagen supera los 5 MB');
  const ext = m[1] === 'png' ? 'png' : m[1] === 'webp' ? 'webp' : 'jpg';
  const name = `${uid()}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
  return `/uploads/${name}`;
}

// Normaliza el recurso explicativo de un ejercicio (imagen subida o enlace de vídeo).
export function cleanMedia(media) {
  if (media == null) return null;
  if (typeof media !== 'object') throw httpErr(400, 'Recurso explicativo no válido');
  if (media.type === 'video') {
    const yt = parseYouTube(media.url);
    if (!yt) throw httpErr(400, 'El enlace debe ser de YouTube (youtube.com o youtu.be)');
    return { type: 'video', url: yt.url, videoId: yt.videoId };
  }
  if (media.type === 'image') {
    if (media.imageData) return { type: 'image', url: saveImage(media.imageData) };
    if (typeof media.url === 'string' && /^\/uploads\/[a-f0-9]{16}\.(png|jpg|webp)$/.test(media.url)) {
      return { type: 'image', url: media.url };
    }
    return null;
  }
  throw httpErr(400, 'Tipo de recurso no válido');
}

// Borra una imagen subida si ningún ejercicio la usa ya.
export function gcUpload(url, exercises) {
  if (typeof url !== 'string' || !url.startsWith('/uploads/')) return;
  if (exercises.some((e) => e.media?.url === url)) return;
  const file = path.join(UPLOAD_DIR, path.basename(url));
  fs.rm(file, { force: true }, () => {});
}

export function cleanExercise(body) {
  return {
    name: str(body.name, 80, 'El nombre', { required: true }),
    sets: int(body.sets, 1, 20, 'Las series'),
    reps: str(String(body.reps ?? ''), 20, 'Las repeticiones', { required: true }),
    rest: int(body.rest, 0, 600, 'El descanso'),
    day: int(body.day, 0, 6, 'El día'),
    description: str(body.description, 2000, 'La descripción'),
    notes: str(body.notes, 1000, 'Las notas'),
  };
}

export function cleanDiet(days) {
  if (!days || typeof days !== 'object') throw httpErr(400, 'Dieta no válida');
  const out = {};
  for (let d = 0; d < 7; d++) {
    const meals = Array.isArray(days[d]) ? days[d] : [];
    if (meals.length > 10) throw httpErr(400, 'Demasiadas comidas en un mismo día');
    out[d] = meals
      .map((m) => {
        if (!m || !MEAL_TYPES.includes(m.type)) throw httpErr(400, 'Tipo de comida no válido');
        const foods = (Array.isArray(m.foods) ? m.foods : [])
          .slice(0, 30)
          .map((f) => ({ name: str(f?.name, 80, 'El alimento'), qty: str(f?.qty, 30, 'La cantidad') }))
          .filter((f) => f.name);
        const kcal = m.kcal === '' || m.kcal == null ? null : int(m.kcal, 0, 5000, 'Las calorías');
        return {
          id: typeof m.id === 'string' && /^[a-f0-9]{16}$/.test(m.id) ? m.id : uid(),
          type: m.type,
          name: str(m.name, 100, 'El nombre del plato', { required: true }),
          kcal,
          foods,
          recipe: str(m.recipe, 4000, 'La receta'),
          notes: str(m.notes, 1000, 'Las notas'),
        };
      })
      .sort((a, b) => MEAL_TYPES.indexOf(a.type) - MEAL_TYPES.indexOf(b.type));
  }
  return out;
}
