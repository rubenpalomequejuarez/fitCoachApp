import { useMemo, useState } from 'react';
import { api } from '../api.js';
import { Avatar, Button, Empty, ErrorState, Loading, TabBar, TopBar, useAsync, useToast } from '../ui.jsx';
import { Icon } from '../icons.jsx';
import { ExTile, Media } from '../shared.jsx';
import {
  DAYS, DAYS_LONG, firstName, fmtKcal, fmtRest, kcalOf, longDate, recipeSteps, todayIdx, weekDates,
} from '../utils.js';

const TABS = [
  { id: 'diet', label: 'Dieta semanal', icon: 'utensils' },
  { id: 'exercises', label: 'Ejercicios', icon: 'dumbbell' },
];

export default function ClientApp({ user, onLogout }) {
  const toast = useToast();
  const [tab, setTab] = useState('diet');
  const [detail, setDetail] = useState(null); // { type: 'meal', meal, day } | { type: 'exercise', id }
  const diet = useAsync(() => api.clientDiet(), []);
  const ex = useAsync(() => api.clientExercises(), []);

  async function toggle(id, done) {
    const patch = (value) => ex.setData((d) => ({ ...d, exercises: d.exercises.map((e) => (e.id === id ? { ...e, done: value } : e)) }));
    patch(done);
    try {
      await api.completeExercise(id, done);
    } catch (err) {
      patch(!done);
      toast(err.message, 'error');
    }
  }

  if (detail?.type === 'meal') {
    return <MealDetail meal={detail.meal} day={detail.day} onBack={() => setDetail(null)} />;
  }
  if (detail?.type === 'exercise') {
    const exercise = ex.data?.exercises.find((e) => e.id === detail.id);
    if (exercise) return <ExerciseDetail exercise={exercise} onToggle={toggle} onBack={() => setDetail(null)} />;
  }

  return (
    <div className="screen">
      <div className="header">
        <Avatar name={user.name} />
        <div className="grow">
          <h1>Hola, {firstName(user.name)}</h1>
          <p>{tab === 'diet' ? longDate() : 'Tu rutina de esta semana'}</p>
        </div>
        <button type="button" className="round-btn" onClick={onLogout} aria-label="Cerrar sesión" title="Cerrar sesión">
          <Icon name="logout" size={20} />
        </button>
      </div>

      {tab === 'diet' ? (
        <DietTab state={diet} onOpen={(meal, day) => setDetail({ type: 'meal', meal, day })} />
      ) : (
        <ExercisesTab state={ex} onOpen={(id) => setDetail({ type: 'exercise', id })} onToggle={toggle} />
      )}

      <TabBar tabs={TABS} active={tab} onChange={setTab} />
    </div>
  );
}

function DietTab({ state, onOpen }) {
  const [sel, setSel] = useState(todayIdx());
  const dates = useMemo(weekDates, []);
  if (state.loading) return <Loading />;
  if (state.error) return <ErrorState message={state.error} onRetry={state.reload} />;

  const days = state.data.diet?.days || {};
  const meals = days[sel] || [];
  const total = kcalOf(meals);

  return (
    <div className="scroll">
      <div className="daystrip">
        {dates.map((d, i) => (
          <button
            key={i}
            type="button"
            className={`daychip${sel === i ? ' active' : ''}`}
            onClick={() => setSel(i)}
            aria-label={`${DAYS_LONG[i]} ${d.getDate()}`}
            aria-pressed={sel === i}
          >
            <small>{DAYS[i]}</small>
            <b>{d.getDate()}</b>
          </button>
        ))}
      </div>

      <div className="row between">
        <h2 className="section-title lg">{sel === todayIdx() ? 'Menú de hoy' : `Menú del ${DAYS_LONG[sel].toLowerCase()}`}</h2>
        {total > 0 && <span className="chip kcal"><Icon name="flame" size={14} />{fmtKcal(total)}</span>}
      </div>

      {meals.length === 0 ? (
        <Empty
          icon="utensils"
          title={state.data.diet ? 'Día libre de menú' : 'Aún no tienes dieta'}
          text={state.data.diet ? 'Tu entrenador no ha añadido comidas para este día.' : 'Cuando tu entrenador te la envíe, aparecerá aquí.'}
        />
      ) : (
        meals.map((m) => (
          <button key={m.id} type="button" className="card meal clickable" onClick={() => onOpen(m, sel)}>
            <div className="tile"><Icon name="utensils" size={22} /></div>
            <div className="grow">
              <div className="eyebrow">{m.type}</div>
              <div className="title-sm">{m.name}</div>
              {m.foods.length > 0 && <div className="sub">{m.foods.slice(0, 3).map((f) => f.name).join(' · ')}</div>}
            </div>
            <div className="right">
              {m.kcal != null && <span className="kcal" style={{ color: 'var(--text)' }}>{m.kcal} kcal</span>}
              <Icon name="right" size={18} />
            </div>
          </button>
        ))
      )}
    </div>
  );
}

function MealDetail({ meal, day, onBack }) {
  const steps = recipeSteps(meal.recipe);
  return (
    <div className="screen">
      <TopBar title={meal.type} onBack={onBack} />
      <div className="scroll">
        <h2 className="page-title">{meal.name}</h2>
        <div className="chips">
          {meal.kcal != null && <span className="chip"><Icon name="flame" size={15} />{meal.kcal} kcal</span>}
          <span className="chip"><Icon name="utensils" size={15} />{meal.type} · {DAYS_LONG[day]}</span>
        </div>

        {meal.foods.length > 0 && (
          <>
            <h3 className="section-title">Alimentos</h3>
            <div className="card list-card">
              {meal.foods.map((f, i) => (
                <div key={i} className="list-row between">
                  <span>{f.name}</span>
                  <strong style={{ color: 'var(--oliva-d)' }}>{f.qty}</strong>
                </div>
              ))}
            </div>
          </>
        )}

        {steps.length > 0 && (
          <>
            <h3 className="section-title">Receta</h3>
            <div className="steps">
              {steps.map((s, i) => (
                <div key={i} className="step"><span className="n">{i + 1}</span><span>{s}</span></div>
              ))}
            </div>
          </>
        )}

        {meal.notes && (
          <div className="note"><strong>Nota de tu entrenador</strong><p>{meal.notes}</p></div>
        )}
      </div>
    </div>
  );
}

function ExercisesTab({ state, onOpen, onToggle }) {
  if (state.loading) return <Loading />;
  if (state.error) return <ErrorState message={state.error} onRetry={state.reload} />;

  const list = state.data.exercises;
  if (list.length === 0) {
    return (
      <div className="scroll">
        <Empty icon="dumbbell" title="Aún no tienes ejercicios" text="Cuando tu entrenador te asigne una rutina, la verás aquí." />
      </div>
    );
  }

  const done = list.filter((e) => e.done).length;
  const groups = [...new Set(list.map((e) => e.day))].sort((a, b) => a - b);

  return (
    <div className="scroll">
      <div className="card pad" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="row between">
          <strong style={{ fontSize: 14 }}>Progreso semanal</strong>
          <span className="sub" style={{ fontWeight: 500 }}>{done} de {list.length}</span>
        </div>
        <div className="progress" role="progressbar" aria-valuenow={done} aria-valuemax={list.length}>
          <div style={{ width: `${(done / list.length) * 100}%` }} />
        </div>
      </div>

      {groups.map((day) => {
        const items = list.filter((e) => e.day === day);
        return (
          <div key={day} style={{ display: 'contents' }}>
            <div className="group-head">
              <h2>{DAYS_LONG[day]}</h2>
              <span>{items.length} {items.length === 1 ? 'ejercicio' : 'ejercicios'}</span>
            </div>
            {items.map((e) => (
              <div key={e.id} className="card ex clickable" role="button" tabIndex={0} onClick={() => onOpen(e.id)} onKeyDown={(k) => { if (k.key === 'Enter') onOpen(e.id); }}>
                <ExTile media={e.media} size="lg" />
                <div className="grow">
                  <div className="title-sm">{e.name}</div>
                  <div className="sub">{e.sets} × {e.reps} · descanso {fmtRest(e.rest)}</div>
                </div>
                <button
                  type="button"
                  className={`check${e.done ? ' on' : ''}`}
                  aria-label={e.done ? 'Desmarcar como completado' : 'Marcar como completado'}
                  aria-pressed={e.done}
                  onClick={(ev) => { ev.stopPropagation(); onToggle(e.id, !e.done); }}
                >
                  {e.done && <Icon name="check" size={14} strokeWidth={3} />}
                </button>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function ExerciseDetail({ exercise: e, onToggle, onBack }) {
  return (
    <div className="screen">
      <TopBar title="Ejercicio" onBack={onBack} />
      <div className="scroll">
        <Media media={e.media} />
        <h2 className="page-title">{e.name}</h2>
        <div className="stats">
          <div className="card stat"><b>{e.sets}</b><span>series</span></div>
          <div className="card stat"><b>{e.reps}</b><span>repeticiones</span></div>
          <div className="card stat"><b>{fmtRest(e.rest)}</b><span>descanso</span></div>
        </div>
        {e.description && (
          <>
            <h3 className="section-title">Cómo se hace</h3>
            <p className="body-text">{e.description}</p>
          </>
        )}
        {e.notes && <div className="note"><strong>Consejo de tu entrenador</strong><p>{e.notes}</p></div>}
      </div>
      <div className="footer">
        <Button variant={e.done ? 'success' : 'primary'} icon={e.done ? 'check' : undefined} onClick={() => onToggle(e.id, !e.done)}>
          {e.done ? 'Completado · toca para deshacer' : 'Marcar como completado'}
        </Button>
      </div>
    </div>
  );
}
