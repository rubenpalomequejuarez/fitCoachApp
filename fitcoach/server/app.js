import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { load, save, getDb, uid, hashPassword, verifyPassword, weekKey, UPLOAD_DIR } from './db.js';
import { httpErr, str, int, cleanMedia, cleanExercise, cleanDiet, gcUpload } from './validate.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SESSION_MS = 30 * 24 * 60 * 60 * 1000;

export function createApp() {
  load();
  const db = getDb();
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '8mb' }));
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'same-origin');
    next();
  });

  // ---------- helpers ----------
  const publicUser = (u) => ({ id: u.id, role: u.role, name: u.name, email: u.email, goal: u.goal || '' });
  const exView = (e) => {
    const { doneWeek, trainerId, ...rest } = e;
    return { ...rest, done: doneWeek === weekKey() };
  };
  const hasDiet = (clientId) => Object.values(db.diets[clientId]?.days || {}).some((d) => d.length > 0);
  const myClient = (trainer, id) => {
    const c = db.users.find((u) => u.id === id && u.role === 'client' && u.trainerId === trainer.id);
    if (!c) throw httpErr(404, 'Cliente no encontrado');
    return c;
  };
  const myExercise = (trainer, id) => {
    const e = db.exercises.find((x) => x.id === id && x.trainerId === trainer.id);
    if (!e) throw httpErr(404, 'Ejercicio no encontrado');
    return e;
  };

  const auth = (role) => (req, res, next) => {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : '';
    const s = token && db.sessions[token];
    if (!s || s.expires < Date.now()) {
      if (s) { delete db.sessions[token]; save(); }
      return res.status(401).json({ error: 'Sesión caducada. Vuelve a iniciar sesión.' });
    }
    const user = db.users.find((u) => u.id === s.userId);
    if (!user) return res.status(401).json({ error: 'Sesión no válida' });
    if (role && user.role !== role) return res.status(403).json({ error: 'No tienes permiso para esta acción' });
    req.user = user;
    req.token = token;
    next();
  };

  // Limitador sencillo de intentos de login (por IP y email).
  const attempts = new Map();
  const tooMany = (key) => {
    const now = Date.now();
    const a = attempts.get(key);
    if (!a || a.reset < now) return false;
    return a.count >= 8;
  };
  const failed = (key) => {
    const now = Date.now();
    const a = attempts.get(key);
    if (!a || a.reset < now) attempts.set(key, { count: 1, reset: now + 10 * 60 * 1000 });
    else a.count++;
  };

  // ---------- auth ----------
  app.get('/api/health', (req, res) => res.json({ ok: true }));

  app.post('/api/auth/login', (req, res) => {
    const email = str(req.body.email, 120, 'El email').toLowerCase();
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const role = req.body.role;
    if (!email || !password) throw httpErr(400, 'Escribe tu email y tu contraseña');
    const key = `${req.ip}|${email}`;
    if (tooMany(key)) throw httpErr(429, 'Demasiados intentos. Espera unos minutos.');
    const user = db.users.find((u) => u.email === email && (role ? u.role === role : true));
    if (!user || !verifyPassword(password, user)) {
      failed(key);
      throw httpErr(401, 'Email o contraseña incorrectos para este perfil');
    }
    const token = crypto.randomBytes(32).toString('hex');
    db.sessions[token] = { userId: user.id, expires: Date.now() + SESSION_MS };
    save();
    res.json({ token, user: publicUser(user) });
  });

  app.get('/api/auth/me', auth(), (req, res) => res.json({ user: publicUser(req.user) }));

  app.post('/api/auth/logout', auth(), (req, res) => {
    delete db.sessions[req.token];
    save();
    res.json({ ok: true });
  });

  // ---------- entrenador: clientes ----------
  app.get('/api/trainer/clients', auth('trainer'), (req, res) => {
    const clients = db.users
      .filter((u) => u.role === 'client' && u.trainerId === req.user.id)
      .map((c) => ({
        ...publicUser(c),
        exerciseCount: db.exercises.filter((e) => e.clientId === c.id).length,
        hasDiet: hasDiet(c.id),
      }));
    res.json({ clients });
  });

  app.post('/api/trainer/clients', auth('trainer'), (req, res) => {
    const name = str(req.body.name, 80, 'El nombre', { required: true });
    const email = str(req.body.email, 120, 'El email', { required: true }).toLowerCase();
    const goal = str(req.body.goal, 120, 'El objetivo');
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw httpErr(400, 'El email no es válido');
    if (password.length < 6) throw httpErr(400, 'La contraseña debe tener al menos 6 caracteres');
    if (db.users.some((u) => u.email === email)) throw httpErr(409, 'Ya existe un usuario con ese email');
    const { salt, hash } = hashPassword(password);
    const client = { id: uid(), role: 'client', name, email, goal, trainerId: req.user.id, salt, hash };
    db.users.push(client);
    save();
    res.status(201).json({ client: { ...publicUser(client), exerciseCount: 0, hasDiet: false } });
  });

  app.get('/api/trainer/clients/:id', auth('trainer'), (req, res) => {
    const client = myClient(req.user, req.params.id);
    res.json({
      client: publicUser(client),
      exercises: db.exercises.filter((e) => e.clientId === client.id).map(exView),
      diet: db.diets[client.id] || null,
    });
  });

  // ---------- entrenador: ejercicios ----------
  app.get('/api/trainer/exercises', auth('trainer'), (req, res) => {
    const names = Object.fromEntries(db.users.map((u) => [u.id, u.name]));
    const exercises = db.exercises
      .filter((e) => e.trainerId === req.user.id)
      .map((e) => ({ ...exView(e), clientName: names[e.clientId] || '' }));
    res.json({ exercises });
  });

  app.post('/api/trainer/exercises', auth('trainer'), (req, res) => {
    const clientIds = Array.isArray(req.body.clientIds) ? [...new Set(req.body.clientIds)] : [];
    if (clientIds.length === 0) throw httpErr(400, 'Elige al menos un cliente');
    clientIds.forEach((id) => myClient(req.user, id));
    const fields = cleanExercise(req.body);
    const media = cleanMedia(req.body.media);
    const created = clientIds.map((clientId) => ({
      id: uid(), clientId, trainerId: req.user.id, ...fields,
      media, doneWeek: null, createdAt: new Date().toISOString(),
    }));
    db.exercises.push(...created);
    save();
    res.status(201).json({ exercises: created.map(exView) });
  });

  app.put('/api/trainer/exercises/:id', auth('trainer'), (req, res) => {
    const ex = myExercise(req.user, req.params.id);
    const fields = cleanExercise(req.body);
    const previousUrl = ex.media?.url;
    const media = req.body.media === undefined ? ex.media : cleanMedia(req.body.media);
    Object.assign(ex, fields, { media });
    if (previousUrl && previousUrl !== media?.url) gcUpload(previousUrl, db.exercises);
    save();
    res.json({ exercise: exView(ex) });
  });

  app.delete('/api/trainer/exercises/:id', auth('trainer'), (req, res) => {
    const ex = myExercise(req.user, req.params.id);
    db.exercises = db.exercises.filter((e) => e.id !== ex.id);
    gcUpload(ex.media?.url, db.exercises);
    save();
    res.json({ ok: true });
  });

  // ---------- entrenador: dieta ----------
  app.get('/api/trainer/clients/:id/diet', auth('trainer'), (req, res) => {
    const client = myClient(req.user, req.params.id);
    res.json({ client: publicUser(client), diet: db.diets[client.id] || null });
  });

  app.put('/api/trainer/clients/:id/diet', auth('trainer'), (req, res) => {
    const client = myClient(req.user, req.params.id);
    const days = cleanDiet(req.body.days);
    db.diets[client.id] = { days, updatedAt: new Date().toISOString() };
    save();
    res.json({ diet: db.diets[client.id] });
  });

  // ---------- cliente ----------
  app.get('/api/client/exercises', auth('client'), (req, res) => {
    res.json({ exercises: db.exercises.filter((e) => e.clientId === req.user.id).map(exView) });
  });

  app.post('/api/client/exercises/:id/complete', auth('client'), (req, res) => {
    const ex = db.exercises.find((e) => e.id === req.params.id && e.clientId === req.user.id);
    if (!ex) throw httpErr(404, 'Ejercicio no encontrado');
    ex.doneWeek = req.body.done === false ? null : weekKey();
    save();
    res.json({ exercise: exView(ex) });
  });

  app.get('/api/client/diet', auth('client'), (req, res) => {
    res.json({ diet: db.diets[req.user.id] || null });
  });

  app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

  // ---------- archivos ----------
  app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '1h', fallthrough: false }));

  // ---------- frontend compilado (npm run build && npm start) ----------
  const dist = path.join(__dirname, '..', 'dist');
  if (fs.existsSync(path.join(dist, 'index.html'))) {
    app.use(express.static(dist));
    app.use((req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  // ---------- errores ----------
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'El archivo es demasiado grande' });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Petición mal formada' });
    const status = err.status && err.status < 600 ? err.status : 500;
    if (status === 500) console.error(err);
    res.status(status).json({ error: status === 500 ? 'Error interno del servidor' : err.message });
  });

  return app;
}
