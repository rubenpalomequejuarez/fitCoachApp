import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Los datos de las pruebas van a una carpeta temporal para no tocar los reales.
process.env.FITCOACH_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'fitcoach-test-'));
const { createApp } = await import('../app.js');

let server, base;
before(async () => {
  server = createApp().listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => {
  server.close();
  fs.rmSync(process.env.FITCOACH_DATA_DIR, { recursive: true, force: true });
});

async function call(method, url, { token, body } = {}) {
  const res = await fetch(base + url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}
const login = async (email, password, role) => (await call('POST', '/api/auth/login', { body: { email, password, role } })).data;

test('login: perfil correcto, incorrecto y contraseña errónea', async () => {
  const ok = await call('POST', '/api/auth/login', { body: { email: 'carlos@fitcoach.test', password: 'entrenador123', role: 'trainer' } });
  assert.equal(ok.status, 200);
  assert.equal(ok.data.user.role, 'trainer');
  assert.ok(!('hash' in ok.data.user) && !('salt' in ok.data.user), 'no se filtra el hash');

  const wrongRole = await call('POST', '/api/auth/login', { body: { email: 'carlos@fitcoach.test', password: 'entrenador123', role: 'client' } });
  assert.equal(wrongRole.status, 401);

  const wrongPass = await call('POST', '/api/auth/login', { body: { email: 'maria@fitcoach.test', password: 'mala', role: 'client' } });
  assert.equal(wrongPass.status, 401);
});

test('un cliente no puede usar la API del entrenador y viceversa', async () => {
  const c = await login('maria@fitcoach.test', 'cliente123', 'client');
  assert.equal((await call('GET', '/api/trainer/clients', { token: c.token })).status, 403);
  const t = await login('carlos@fitcoach.test', 'entrenador123', 'trainer');
  assert.equal((await call('GET', '/api/client/exercises', { token: t.token })).status, 403);
  assert.equal((await call('GET', '/api/client/diet')).status, 401);
});

test('flujo completo: el entrenador asigna ejercicio y dieta, el cliente los ve y completa', async () => {
  const t = await login('carlos@fitcoach.test', 'entrenador123', 'trainer');
  const { clients } = (await call('GET', '/api/trainer/clients', { token: t.token })).data;
  const lucia = clients.find((c) => c.name.startsWith('Lucía'));
  assert.equal(lucia.hasDiet, false);

  // Ejercicio con vídeo de YouTube, asignado a Lucía
  const created = await call('POST', '/api/trainer/exercises', {
    token: t.token,
    body: {
      clientIds: [lucia.id], name: 'Plancha', sets: 3, reps: '30 s', rest: 45, day: 1,
      description: 'Apoya antebrazos y puntas de los pies.', notes: 'Cuerpo recto.',
      media: { type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&si=abc' },
    },
  });
  assert.equal(created.status, 201);
  assert.equal(created.data.exercises[0].media.videoId, 'dQw4w9WgXcQ');

  // Dieta de un día
  const diet = await call('PUT', `/api/trainer/clients/${lucia.id}/diet`, {
    token: t.token,
    body: { days: { 0: [{ type: 'Desayuno', name: 'Tostada', kcal: 300, foods: [{ name: 'Pan', qty: '60 g' }, { name: '', qty: '' }], recipe: '1. Tuesta.' }] } },
  });
  assert.equal(diet.status, 200);
  assert.equal(diet.data.diet.days[0][0].foods.length, 1, 'se descartan alimentos vacíos');

  // Lo ve la clienta
  const l = await login('lucia@fitcoach.test', 'cliente123', 'client');
  const ex = (await call('GET', '/api/client/exercises', { token: l.token })).data.exercises;
  assert.equal(ex.length, 1);
  assert.equal(ex[0].done, false);
  assert.equal((await call('GET', '/api/client/diet', { token: l.token })).data.diet.days[0][0].name, 'Tostada');

  // La completa y luego la desmarca
  const done = await call('POST', `/api/client/exercises/${ex[0].id}/complete`, { token: l.token, body: { done: true } });
  assert.equal(done.data.exercise.done, true);
  const undo = await call('POST', `/api/client/exercises/${ex[0].id}/complete`, { token: l.token, body: { done: false } });
  assert.equal(undo.data.exercise.done, false);

  // Otra clienta no puede tocar el ejercicio de Lucía
  const m = await login('maria@fitcoach.test', 'cliente123', 'client');
  assert.equal((await call('POST', `/api/client/exercises/${ex[0].id}/complete`, { token: m.token, body: { done: true } })).status, 404);
});

test('validaciones: enlace que no es de YouTube, imagen inválida y cliente ajeno', async () => {
  const t = await login('carlos@fitcoach.test', 'entrenador123', 'trainer');
  const { clients } = (await call('GET', '/api/trainer/clients', { token: t.token })).data;
  const base = { clientIds: [clients[0].id], name: 'X', sets: 3, reps: '10', rest: 30, day: 0 };

  const bad = await call('POST', '/api/trainer/exercises', { token: t.token, body: { ...base, media: { type: 'video', url: 'https://evil.example.com/watch?v=abcdefghijk' } } });
  assert.equal(bad.status, 400);
  const badImg = await call('POST', '/api/trainer/exercises', { token: t.token, body: { ...base, media: { type: 'image', imageData: 'data:text/html;base64,PGI+' } } });
  assert.equal(badImg.status, 400);
  const foreign = await call('POST', '/api/trainer/exercises', { token: t.token, body: { ...base, clientIds: ['ffffffffffffffff'] } });
  assert.equal(foreign.status, 404);
  const noName = await call('POST', '/api/trainer/exercises', { token: t.token, body: { ...base, name: '  ' } });
  assert.equal(noName.status, 400);
});

test('subida de imagen: se guarda, se sirve y se borra al eliminar el ejercicio', async () => {
  const t = await login('carlos@fitcoach.test', 'entrenador123', 'trainer');
  const { clients } = (await call('GET', '/api/trainer/clients', { token: t.token })).data;
  // PNG de 1x1 píxel
  const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const created = await call('POST', '/api/trainer/exercises', {
    token: t.token,
    body: { clientIds: [clients[0].id], name: 'Con imagen', sets: 2, reps: '8', rest: 30, day: 3, media: { type: 'image', imageData: png } },
  });
  assert.equal(created.status, 201);
  const { url } = created.data.exercises[0].media;
  assert.match(url, /^\/uploads\/[a-f0-9]{16}\.png$/);
  const file = await fetch(base + url);
  assert.equal(file.status, 200);
  assert.equal(file.headers.get('content-type'), 'image/png');

  const del = await call('DELETE', `/api/trainer/exercises/${created.data.exercises[0].id}`, { token: t.token });
  assert.equal(del.status, 200);
  await new Promise((r) => setTimeout(r, 100));
  assert.equal((await fetch(base + url)).status, 404);
});

test('alta de cliente nuevo y email duplicado', async () => {
  const t = await login('carlos@fitcoach.test', 'entrenador123', 'trainer');
  const ok = await call('POST', '/api/trainer/clients', { token: t.token, body: { name: 'Ana Ruiz', email: 'ANA@fitcoach.test', password: 'secreto1', goal: 'Salud' } });
  assert.equal(ok.status, 201);
  const dup = await call('POST', '/api/trainer/clients', { token: t.token, body: { name: 'Otra', email: 'ana@fitcoach.test', password: 'secreto1' } });
  assert.equal(dup.status, 409);
  const short = await call('POST', '/api/trainer/clients', { token: t.token, body: { name: 'Otra', email: 'otra@fitcoach.test', password: '123' } });
  assert.equal(short.status, 400);
  // La nueva clienta ya puede entrar
  const l = await call('POST', '/api/auth/login', { body: { email: 'ana@fitcoach.test', password: 'secreto1', role: 'client' } });
  assert.equal(l.status, 200);
});
