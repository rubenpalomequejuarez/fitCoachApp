import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { Button, ErrorState, Input, Loading, Pill, TextArea, TopBar, useAsync, useToast } from '../ui.jsx';
import { Icon } from '../icons.jsx';
import { DAYS, DAYS_LONG, MEAL_TYPES, firstName, todayIdx, weekDates } from '../utils.js';

const emptyWeek = () => Object.fromEntries(Array.from({ length: 7 }, (_, i) => [i, []]));
const normalize = (days) => {
  const out = emptyWeek();
  for (let d = 0; d < 7; d++) {
    out[d] = (days?.[d] || []).map((m) => ({ ...m, kcal: m.kcal ?? '', foods: m.foods.map((f) => ({ ...f })) }));
  }
  return out;
};
let tmp = 0;
const tmpId = () => `tmp${Date.now()}${tmp++}`;

export default function DietEditor({ clientId, onBack }) {
  const state = useAsync(() => api.clientDietFor(clientId), [clientId]);
  return (
    <div className="screen">
      {state.loading ? (
        <><TopBar title="Dieta" onBack={onBack} /><Loading /></>
      ) : state.error ? (
        <><TopBar title="Dieta" onBack={onBack} /><ErrorState message={state.error} onRetry={state.reload} /></>
      ) : (
        <Editor client={state.data.client} initial={state.data.diet?.days} onBack={onBack} />
      )}
    </div>
  );
}

function Editor({ client, initial, onBack }) {
  const toast = useToast();
  const dates = useMemo(weekDates, []);
  const [days, setDays] = useState(() => normalize(initial));
  const [sel, setSel] = useState(todayIdx());
  const [openId, setOpenId] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Avisa si se intenta cerrar la pestaña con cambios sin guardar.
  useEffect(() => {
    if (!dirty) return undefined;
    const h = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const meals = days[sel];
  const edit = (fn) => { setDays((d) => ({ ...d, [sel]: fn(d[sel]) })); setDirty(true); setError(''); };
  const patch = (id, p) => edit((ms) => ms.map((m) => (m.id === id ? { ...m, ...p } : m)));
  const setFood = (id, i, p) => edit((ms) => ms.map((m) => (m.id === id ? { ...m, foods: m.foods.map((f, j) => (j === i ? { ...f, ...p } : f)) } : m)));

  function addMeal() {
    const used = meals.map((m) => m.type);
    const type = MEAL_TYPES.find((t) => !used.includes(t)) || 'Comida';
    const m = { id: tmpId(), type, name: '', kcal: '', foods: [{ name: '', qty: '' }], recipe: '', notes: '' };
    edit((ms) => [...ms, m]);
    setOpenId(m.id);
  }

  function removeMeal(id) {
    if (!window.confirm('¿Quitar esta comida del día?')) return;
    edit((ms) => ms.filter((m) => m.id !== id));
    setOpenId(null);
  }

  function copyToWeek() {
    if (meals.length === 0) return;
    if (!window.confirm(`¿Copiar el menú del ${DAYS_LONG[sel].toLowerCase()} a todos los demás días? Se sustituirá lo que haya en ellos.`)) return;
    setDays((d) => Object.fromEntries(Object.keys(d).map((k) => [
      k, Number(k) === sel ? d[k] : d[sel].map((m) => ({ ...m, id: tmpId(), foods: m.foods.map((f) => ({ ...f })) })),
    ])));
    setDirty(true);
    toast('Menú copiado a toda la semana');
  }

  function back() {
    if (dirty && !window.confirm('Tienes cambios sin guardar. ¿Salir sin guardar?')) return;
    onBack();
  }

  async function save() {
    for (let d = 0; d < 7; d++) {
      const bad = days[d].find((m) => !m.name.trim());
      if (bad) {
        setSel(d);
        setOpenId(bad.id);
        setError(`Falta el nombre del plato (${bad.type}, ${DAYS_LONG[d].toLowerCase()})`);
        return;
      }
    }
    setBusy(true);
    setError('');
    try {
      const payload = Object.fromEntries(Object.entries(days).map(([d, ms]) => [d, ms.map((m) => ({
        ...m, name: m.name.trim(), kcal: m.kcal === '' ? null : Number(m.kcal),
      }))]));
      const res = await api.saveDiet(client.id, payload);
      setDays(normalize(res.diet.days));
      setDirty(false);
      toast(`Dieta enviada a ${firstName(client.name)}`);
      onBack();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <TopBar title={`Dieta de ${firstName(client.name)}`} onBack={back} />
      <div className="scroll">
        <div className="daystrip">
          {dates.map((d, i) => (
            <button key={i} type="button" className={`daychip${sel === i ? ' active' : ''}`} aria-pressed={sel === i}
              aria-label={`${DAYS_LONG[i]} ${d.getDate()}`} onClick={() => { setSel(i); setOpenId(null); }}>
              <small>{DAYS[i]}</small>
              <b>{d.getDate()}</b>
              <span className={`dot${days[i].length ? ' on' : ''}`} />
            </button>
          ))}
        </div>

        <div className="row between">
          <h2 className="section-title lg">{DAYS_LONG[sel]} {dates[sel].getDate()}</h2>
          <Pill icon="plus" onClick={addMeal}>Añadir comida</Pill>
        </div>

        {meals.length === 0 && (
          <div className="card pad muted" style={{ textAlign: 'center', fontSize: 14 }}>
            No hay comidas este día. Pulsa «Añadir comida» para empezar.
          </div>
        )}

        {meals.map((m) => (m.id === openId ? (
          <MealEditor key={m.id} meal={m} patch={(p) => patch(m.id, p)} setFood={(i, p) => setFood(m.id, i, p)}
            addFood={() => patch(m.id, { foods: [...m.foods, { name: '', qty: '' }] })}
            removeFood={(i) => patch(m.id, { foods: m.foods.filter((_, j) => j !== i) })}
            onClose={() => setOpenId(null)} onDelete={() => removeMeal(m.id)} />
        ) : (
          <button key={m.id} type="button" className="card meal clickable" onClick={() => setOpenId(m.id)}>
            <div className="grow">
              <div className="eyebrow">{m.type}</div>
              <div className="title-sm">{m.name || 'Sin nombre'}</div>
            </div>
            {m.kcal !== '' && <span className="kcal" style={{ fontSize: 13, fontWeight: 600 }}>{m.kcal} kcal</span>}
            <Icon name="pencil" size={16} className="muted" />
          </button>
        )))}

        {meals.length > 0 && (
          <button type="button" className="linkbtn" onClick={copyToWeek}>
            <Icon name="copy" size={14} style={{ verticalAlign: '-2px', marginRight: 6 }} />
            Copiar este día a toda la semana
          </button>
        )}

        {error && <div className="form-error" role="alert">{error}</div>}
      </div>
      <div className="footer">
        <Button variant="accent" loading={busy} onClick={save}>Guardar y enviar al cliente</Button>
      </div>
    </>
  );
}

function MealEditor({ meal: m, patch, setFood, addFood, removeFood, onClose, onDelete }) {
  return (
    <div className="editor">
      <div className="row between">
        <select className="input" style={{ height: 40, width: 'auto', borderRadius: 999, padding: '0 12px', fontWeight: 600, fontSize: 13 }}
          aria-label="Tipo de comida" value={m.type} onChange={(e) => patch({ type: e.target.value })}>
          {MEAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <div className="row" style={{ gap: 4 }}>
          <button type="button" className="icon-btn" onClick={onDelete} aria-label="Quitar comida"><Icon name="trash" size={18} /></button>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar"><Icon name="x" size={18} /></button>
        </div>
      </div>

      <Input label="Nombre del plato" value={m.name} onChange={(e) => patch({ name: e.target.value })} placeholder="Pollo con arroz integral" autoFocus={!m.name} />

      <div className="field">
        <span className="field-label">Alimentos</span>
        {m.foods.map((f, i) => (
          <div key={i} className="food-row">
            <input className="input grow" aria-label={`Alimento ${i + 1}`} placeholder="Alimento" value={f.name} onChange={(e) => setFood(i, { name: e.target.value })} />
            <input className="input qty" aria-label={`Cantidad ${i + 1}`} placeholder="150 g" value={f.qty} onChange={(e) => setFood(i, { qty: e.target.value })} />
            <button type="button" className="icon-btn" onClick={() => removeFood(i)} aria-label="Quitar alimento"><Icon name="x" size={18} /></button>
          </div>
        ))}
        <Button variant="dashed" icon="plus" onClick={addFood}>Añadir alimento</Button>
      </div>

      <TextArea label="Receta (un paso por línea)" value={m.recipe} onChange={(e) => patch({ recipe: e.target.value })} placeholder={'1. Cuece el arroz 25 minutos.\n2. Cocina el pollo a la plancha.'} rows={4} />
      <Input label="Calorías (opcional)" type="number" inputMode="numeric" min="0" max="5000" value={m.kcal} onChange={(e) => patch({ kcal: e.target.value })} placeholder="640" />
      <TextArea label="Nota para el cliente (opcional)" value={m.notes} onChange={(e) => patch({ notes: e.target.value })} rows={2} />
    </div>
  );
}
