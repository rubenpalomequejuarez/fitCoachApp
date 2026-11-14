import { useMemo, useState } from 'react';
import { api } from '../api.js';
import { Avatar, Button, Empty, ErrorState, Input, Loading, Pill, TabBar, TopBar, useAsync, useToast } from '../ui.jsx';
import { Icon } from '../icons.jsx';
import { ExTile } from '../shared.jsx';
import ExerciseForm from './ExerciseForm.jsx';
import DietEditor from './DietEditor.jsx';
import { DAYS_LONG, firstName, kcalOf, fmtKcal, fmtRest } from '../utils.js';

const TABS = [
  { id: 'clients', label: 'Clientes', icon: 'users' },
  { id: 'exercises', label: 'Ejercicios', icon: 'dumbbell' },
  { id: 'diets', label: 'Dietas', icon: 'utensils' },
];

export default function TrainerApp({ user, onLogout }) {
  const [tab, setTab] = useState('clients');
  const [stack, setStack] = useState([]);
  const nav = useMemo(() => ({
    push: (s) => setStack((a) => [...a, s]),
    pop: () => setStack((a) => a.slice(0, -1)),
  }), []);
  const top = stack[stack.length - 1];

  if (top?.name === 'client') return <ClientDetail id={top.id} nav={nav} />;
  if (top?.name === 'addClient') return <AddClient nav={nav} />;
  if (top?.name === 'exercise') {
    return <ExerciseForm key={top.exercise?.id || 'new'} exercise={top.exercise} clientId={top.clientId} onBack={nav.pop} />;
  }
  if (top?.name === 'diet') return <DietEditor clientId={top.id} onBack={nav.pop} />;

  return (
    <div className="screen">
      <div className="header">
        <Avatar name={user.name} />
        <div className="grow">
          <h1>Hola, {firstName(user.name)}</h1>
          <p>{TABS.find((t) => t.id === tab).label === 'Clientes' ? 'Gestiona a tus clientes' : tab === 'exercises' ? 'Ejercicios que has asignado' : 'Dietas de tus clientes'}</p>
        </div>
        <button type="button" className="round-btn" onClick={onLogout} aria-label="Cerrar sesión" title="Cerrar sesión">
          <Icon name="logout" size={20} />
        </button>
      </div>

      {tab === 'clients' && <ClientsTab nav={nav} />}
      {tab === 'exercises' && <ExercisesTab nav={nav} />}
      {tab === 'diets' && <DietsTab nav={nav} />}

      <TabBar tabs={TABS} active={tab} onChange={setTab} />
    </div>
  );
}

function ClientsTab({ nav }) {
  const state = useAsync(() => api.clients(), []);
  const [q, setQ] = useState('');
  if (state.loading) return <Loading />;
  if (state.error) return <ErrorState message={state.error} onRetry={state.reload} />;

  const all = state.data.clients;
  const list = all.filter((c) => `${c.name} ${c.goal}`.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="scroll">
      <div className="row between">
        <h2 className="section-title lg">Mis clientes</h2>
        <Pill icon="plus" onClick={() => nav.push({ name: 'addClient' })}>Añadir cliente</Pill>
      </div>
      <label className="search">
        <Icon name="search" size={18} />
        <input placeholder="Buscar cliente" aria-label="Buscar cliente" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>

      {all.length === 0 ? (
        <Empty icon="users" title="Todavía no tienes clientes" text="Añade tu primer cliente para empezar a asignarle ejercicios y dietas." />
      ) : list.length === 0 ? (
        <Empty icon="search" title="Sin resultados" text="Prueba con otro nombre u objetivo." />
      ) : (
        list.map((c) => (
          <button key={c.id} type="button" className="card meal clickable" onClick={() => nav.push({ name: 'client', id: c.id })}>
            <Avatar name={c.name} size={48} tone="soft" />
            <div className="grow">
              <div className="title-sm">{c.name}</div>
              <div className="sub">{c.goal || 'Sin objetivo definido'}</div>
            </div>
            <Icon name="right" size={18} className="muted" />
          </button>
        ))
      )}
    </div>
  );
}

function SectionHead({ title, onEdit, editLabel = 'Editar' }) {
  return (
    <div className="row between">
      <h3 className="section-title">{title}</h3>
      <Pill variant="soft" icon="pencil" onClick={onEdit}>{editLabel}</Pill>
    </div>
  );
}

function ClientDetail({ id, nav }) {
  const state = useAsync(() => api.client(id), [id]);
  return (
    <div className="screen">
      <TopBar title="Cliente" onBack={nav.pop} />
      {state.loading ? <Loading /> : state.error ? <ErrorState message={state.error} onRetry={state.reload} /> : <ClientBody data={state.data} nav={nav} />}
    </div>
  );
}

function ClientBody({ data, nav }) {
  const { client, exercises, diet } = data;
  const days = diet?.days || {};
  const filled = (d) => (days[d] || []).length > 0;
  const withMeals = Object.keys(days).filter((d) => filled(d));
  const avg = withMeals.length ? Math.round(withMeals.reduce((s, d) => s + kcalOf(days[d]), 0) / withMeals.length) : 0;
  const sorted = [...exercises].sort((a, b) => a.day - b.day);

  return (
    <div className="scroll">
      <div className="row" style={{ gap: 14 }}>
        <Avatar name={client.name} size={64} />
        <div>
          <h2 className="page-title" style={{ fontSize: 22 }}>{client.name}</h2>
          <p className="sub" style={{ fontSize: 14 }}>Objetivo: {client.goal || 'sin definir'}</p>
        </div>
      </div>

      <SectionHead title="Ejercicios asignados" editLabel="Asignar" onEdit={() => nav.push({ name: 'exercise', clientId: client.id })} />
      {sorted.length === 0 ? (
        <div className="card"><Empty icon="dumbbell" title="Sin ejercicios" text="Este cliente aún no tiene ejercicios asignados." /></div>
      ) : (
        <div className="card list-card">
          {sorted.map((e) => (
            <div key={e.id} className="list-row" role="button" tabIndex={0} style={{ cursor: 'pointer' }}
              onClick={() => nav.push({ name: 'exercise', exercise: e, clientId: client.id })}
              onKeyDown={(k) => { if (k.key === 'Enter') nav.push({ name: 'exercise', exercise: e, clientId: client.id }); }}>
              <ExTile media={e.media} size="sm" />
              <div className="grow">
                <div style={{ fontWeight: 500, fontSize: 14 }}>{e.name}</div>
                <div className="sub" style={{ fontSize: 12 }}>{DAYS_LONG[e.day]} · descanso {fmtRest(e.rest)}</div>
              </div>
              <strong style={{ fontSize: 13, color: 'var(--oliva-d)' }}>{e.sets} × {e.reps}</strong>
              {e.done && <Icon name="check" size={16} style={{ color: 'var(--ok)' }} strokeWidth={3} />}
            </div>
          ))}
        </div>
      )}

      <SectionHead title="Dieta semanal" onEdit={() => nav.push({ name: 'diet', id: client.id })} />
      <div className="card pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="weekdots">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((l, i) => (
            <span key={i} className={`weekdot${filled(i) ? ' on' : ''}`} title={DAYS_LONG[i]}>{l}</span>
          ))}
        </div>
        <p className="sub">
          {withMeals.length === 0
            ? 'Todavía no hay dieta para este cliente.'
            : `${fmtKcal(avg)} al día de media · ${withMeals.length} ${withMeals.length === 1 ? 'día' : 'días'} con menú`}
        </p>
      </div>
    </div>
  );
}

function AddClient({ nav }) {
  const toast = useToast();
  const [f, setF] = useState({ name: '', email: '', password: '', goal: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!f.name.trim()) return setError('Escribe el nombre del cliente');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) return setError('Escribe un email válido');
    if (f.password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres');
    setBusy(true);
    try {
      await api.addClient({ ...f, name: f.name.trim(), email: f.email.trim() });
      toast(`${f.name.trim()} ya puede entrar con su email y contraseña`);
      nav.pop();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="screen" onSubmit={submit} noValidate>
      <TopBar title="Nuevo cliente" onBack={nav.pop} />
      <div className="scroll">
        <Input label="Nombre completo" value={f.name} onChange={set('name')} placeholder="Ana Pérez" autoFocus />
        <Input label="Email" type="email" value={f.email} onChange={set('email')} placeholder="ana@email.com" />
        <Input label="Contraseña inicial" type="text" value={f.password} onChange={set('password')} placeholder="Mínimo 6 caracteres" hint="Compártela con tu cliente; podrá entrar con ella." />
        <Input label="Objetivo" value={f.goal} onChange={set('goal')} placeholder="Ganar masa muscular" />
        {error && <div className="form-error" role="alert">{error}</div>}
      </div>
      <div className="footer"><Button type="submit" loading={busy}>Crear cliente</Button></div>
    </form>
  );
}

function ExercisesTab({ nav }) {
  const state = useAsync(() => api.trainerExercises(), []);
  if (state.loading) return <Loading />;
  if (state.error) return <ErrorState message={state.error} onRetry={state.reload} />;

  const list = state.data.exercises;
  const byClient = new Map();
  list.forEach((e) => byClient.set(e.clientId, [...(byClient.get(e.clientId) || []), e]));

  return (
    <div className="scroll">
      <div className="row between">
        <h2 className="section-title lg">Ejercicios</h2>
        <Pill icon="plus" onClick={() => nav.push({ name: 'exercise' })}>Nuevo ejercicio</Pill>
      </div>
      {list.length === 0 ? (
        <Empty icon="dumbbell" title="Aún no has asignado ejercicios" text="Crea un ejercicio con imagen o vídeo y asígnalo a uno o varios clientes." />
      ) : (
        [...byClient.entries()].map(([cid, items]) => (
          <div key={cid} style={{ display: 'contents' }}>
            <div className="group-head"><h2>{items[0].clientName}</h2><span>{items.length}</span></div>
            <div className="card list-card">
              {items.sort((a, b) => a.day - b.day).map((e) => (
                <div key={e.id} className="list-row" role="button" tabIndex={0} style={{ cursor: 'pointer' }}
                  onClick={() => nav.push({ name: 'exercise', exercise: e, clientId: cid })}
                  onKeyDown={(k) => { if (k.key === 'Enter') nav.push({ name: 'exercise', exercise: e, clientId: cid }); }}>
                  <ExTile media={e.media} size="sm" />
                  <div className="grow">
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{e.name}</div>
                    <div className="sub" style={{ fontSize: 12 }}>{DAYS_LONG[e.day]}</div>
                  </div>
                  <strong style={{ fontSize: 13, color: 'var(--oliva-d)' }}>{e.sets} × {e.reps}</strong>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function DietsTab({ nav }) {
  const state = useAsync(() => api.clients(), []);
  if (state.loading) return <Loading />;
  if (state.error) return <ErrorState message={state.error} onRetry={state.reload} />;
  const clients = state.data.clients;

  return (
    <div className="scroll">
      <h2 className="section-title lg">Dietas</h2>
      {clients.length === 0 ? (
        <Empty icon="utensils" title="Sin clientes" text="Añade un cliente para crearle una dieta." />
      ) : (
        clients.map((c) => (
          <button key={c.id} type="button" className="card meal clickable" onClick={() => nav.push({ name: 'diet', id: c.id })}>
            <Avatar name={c.name} size={48} tone="soft" />
            <div className="grow">
              <div className="title-sm">{c.name}</div>
              <div className="sub">{c.hasDiet ? 'Dieta activa' : 'Sin dieta todavía'}</div>
            </div>
            <span className="pill pill-soft">{c.hasDiet ? 'Editar' : 'Crear'}</span>
          </button>
        ))
      )}
    </div>
  );
}
