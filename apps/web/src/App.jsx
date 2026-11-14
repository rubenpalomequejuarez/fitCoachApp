import { useCallback, useEffect, useState } from 'react';
import { api, hasToken, setToken, setUnauthorizedHandler } from './api.js';
import Login from './Login.jsx';
import ClientApp from './client/ClientApp.jsx';
import TrainerApp from './trainer/TrainerApp.jsx';
import { Loading } from './ui.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(hasToken());

  const logout = useCallback(async ({ remote = true } = {}) => {
    if (remote && hasToken()) await api.logout().catch(() => {});
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => logout({ remote: false }));
  }, [logout]);

  // Si hay una sesión guardada, se comprueba que siga siendo válida.
  useEffect(() => {
    if (!hasToken()) return;
    api.me()
      .then((r) => setUser(r.user))
      .catch(() => setToken(null))
      .finally(() => setBooting(false));
  }, []);

  return (
    <div className="app">
      {booting ? (
        <Loading />
      ) : !user ? (
        <Login onLogin={(token, u) => { setToken(token); setUser(u); }} />
      ) : user.role === 'trainer' ? (
        <TrainerApp user={user} onLogout={() => logout()} />
      ) : (
        <ClientApp user={user} onLogout={() => logout()} />
      )}
    </div>
  );
}
