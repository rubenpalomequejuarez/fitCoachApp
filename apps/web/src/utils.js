export const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
export const DAYS_LONG = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
export const MEAL_TYPES = ['Desayuno', 'Media mañana', 'Comida', 'Merienda', 'Cena'];

// Índice del día de hoy con la semana empezando en lunes (0 = lunes).
export const todayIdx = () => (new Date().getDay() + 6) % 7;

export function weekDates() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - todayIdx());
  return Array.from({ length: 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export const longDate = () =>
  cap(new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()));

export const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

export const firstName = (name = '') => name.split(' ')[0];

export const fmtRest = (s) => (s >= 60 && s % 60 === 0 ? `${s / 60} min` : `${s} s`);

export const kcalOf = (meals = []) => meals.reduce((sum, m) => sum + (m.kcal || 0), 0);
export const fmtKcal = (n) => `${n.toLocaleString('es-ES')} kcal`;

// Las recetas se escriben una línea por paso; se quita la numeración manual.
export const recipeSteps = (recipe = '') =>
  recipe.split(/\r?\n/).map((l) => l.replace(/^\s*\d+[.)]\s*/, '').trim()).filter(Boolean);

// Misma regla que el servidor: solo enlaces de YouTube.
export function parseYouTube(input) {
  let raw = (input || '').trim();
  if (!raw || raw.length > 300) return null;
  if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;
  try {
    const u = new URL(raw);
    const host = u.hostname.toLowerCase().replace(/^(www\.|m\.)/, '');
    let id = null;
    if (host === 'youtu.be') id = u.pathname.slice(1).split('/')[0];
    else if (host === 'youtube.com') {
      if (u.pathname === '/watch') id = u.searchParams.get('v');
      else {
        const m = u.pathname.match(/^\/(embed|shorts|live)\/([\w-]{6,15})/);
        if (m) id = m[2];
      }
    }
    if (id && /^[\w-]{6,15}$/.test(id)) return { videoId: id, url: u.toString() };
  } catch { /* enlace mal formado */ }
  return null;
}

// Miniatura pública de YouTube. Los vídeos privados no la tienen: la interfaz
// muestra un fondo liso si no carga.
export const ytThumb = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

// Reduce la imagen antes de subirla para mantener la app ligera.
export async function fileToDataUrl(file, max = 1280) {
  if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) throw new Error('Usa una imagen PNG, JPG o WebP');
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.82);
}
