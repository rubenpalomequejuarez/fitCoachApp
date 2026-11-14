import { useState } from 'react';
import { api } from './api.js';
import { Button, Input, Segmented, Field, useToast } from './ui.jsx';
import { Icon } from './icons.jsx';

const DEMO = {
  trainer: { email: 'carlos@fitcoach.test', password: 'entrenador123' },
  client: { email: 'maria@fitcoach.test', password: 'cliente123' },
};

export default function Login({ onLogin }) {
  const toast = useToast();
  const [role, setRole] = useState('trainer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Escribe tu email y tu contraseña');
      return;
    }
    setLoading(true);
    try {
      const r = await api.login(email.trim(), password, role);
      onLogin(r.token, r.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="screen login" onSubmit={submit} noValidate>
      <div className="logo">
        <div className="mark"><Icon name="dumbbell" size={38} /></div>
        <h1>FitCoach</h1>
        <p>Tu entrenamiento y tu dieta, en un solo lugar</p>
      </div>

      <Segmented
        value={role}
        onChange={(r) => { setRole(r); setError(''); }}
        options={[{ value: 'trainer', label: 'Entrenador' }, { value: 'client', label: 'Cliente' }]}
      />

      <Input
        label="Email"
        type="email"
        autoComplete="username"
        placeholder="nombre@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <Field label="Contraseña">
        <div className="input-wrap">
          <input
            className="input"
            aria-label="Contraseña"
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="button" className="adorn" onClick={() => setShow((s) => !s)} aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
            <Icon name={show ? 'eyeOff' : 'eye'} size={20} />
          </button>
        </div>
      </Field>

      {error && <div className="form-error" role="alert">{error}</div>}

      <Button type="submit" loading={loading}>Iniciar sesión</Button>

      <button
        type="button"
        className="linkbtn"
        onClick={() => toast('Pide a tu entrenador que te cree una nueva contraseña.')}
      >
        ¿Olvidaste tu contraseña?
      </button>

      <div className="demo">
        <span>Cuenta de prueba ({role === 'trainer' ? 'entrenador' : 'cliente'}):</span>
        <span><code>{DEMO[role].email}</code> · <code>{DEMO[role].password}</code></span>
        <button type="button" className="linkbtn" style={{ alignSelf: 'flex-start', padding: 0 }} onClick={() => { setEmail(DEMO[role].email); setPassword(DEMO[role].password); setError(''); }}>
          Rellenar automáticamente
        </button>
      </div>
    </form>
  );
}
