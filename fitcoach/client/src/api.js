const TOKEN_KEY = 'fitcoach_token';

let token = localStorage.getItem(TOKEN_KEY);
let onUnauthorized = () => {};

export const setToken = (t) => {
  token = t;
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
};
export const hasToken = () => !!token;
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

async function request(method, path, body) {
  let res;
  try {
    res = await fetch('/api' + path, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('No se puede conectar con el servidor. ¿Está arrancado?');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token && path !== '/auth/login') onUnauthorized();
    const err = new Error(data.error || 'Ha ocurrido un error');
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  login: (email, password, role) => request('POST', '/auth/login', { email, password, role }),
  me: () => request('GET', '/auth/me'),
  logout: () => request('POST', '/auth/logout', {}),

  // cliente
  clientDiet: () => request('GET', '/client/diet'),
  clientExercises: () => request('GET', '/client/exercises'),
  completeExercise: (id, done) => request('POST', `/client/exercises/${id}/complete`, { done }),

  // entrenador
  clients: () => request('GET', '/trainer/clients'),
  addClient: (c) => request('POST', '/trainer/clients', c),
  client: (id) => request('GET', `/trainer/clients/${id}`),
  trainerExercises: () => request('GET', '/trainer/exercises'),
  createExercise: (e) => request('POST', '/trainer/exercises', e),
  updateExercise: (id, e) => request('PUT', `/trainer/exercises/${id}`, e),
  deleteExercise: (id) => request('DELETE', `/trainer/exercises/${id}`),
  clientDietFor: (id) => request('GET', `/trainer/clients/${id}/diet`),
  saveDiet: (id, days) => request('PUT', `/trainer/clients/${id}/diet`, { days }),
};
