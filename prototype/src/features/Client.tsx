import { useState } from "react";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  Leaf,
  Play,
  Check,
  CheckCheck,
  Utensils,
  Dumbbell,
  MessageCircle,
  Lightbulb,
  ExternalLink,
  Sprout,
} from "lucide-react";
import { Avatar, Back, Button, EmptyState, PageTitle } from "../components/ui";
import { DAYS, FULL_DAYS, youtubeId } from "../data";
import type { Client, Meal, Exercise } from "../types";
import { useStore } from "../store";
export function DayStrip({
  day,
  onChange,
  compact = false,
}: {
  day: number;
  onChange: (d: number) => void;
  compact?: boolean;
}) {
  const date = new Date();
  const current = (date.getDay() + 6) % 7;
  const monday = new Date(date);
  monday.setDate(date.getDate() - current);
  return (
    <div
      className={`day-strip ${compact ? "compact" : ""}`}
      aria-label="Días de la semana"
    >
      {DAYS.map((d, i) => {
        const n = new Date(monday);
        n.setDate(monday.getDate() + i);
        return (
          <button
            key={d}
            className={day === i ? "selected" : ""}
            aria-pressed={day === i}
            aria-label={`${FULL_DAYS[i]} ${n.getDate()}${i === current ? ", hoy" : ""}`}
            onClick={() => onChange(i)}
          >
            <span>{d}</span>
            {!compact && <strong>{n.getDate()}</strong>}
            <i className={i === current ? "today" : ""} />
          </button>
        );
      })}
    </div>
  );
}
export function MealCard({
  meal,
  onClick,
}: {
  meal: Meal;
  onClick: () => void;
}) {
  return (
    <button className="meal-card" onClick={onClick}>
      <img src={`/assets/${meal.image}`} alt="" loading="lazy" />
      <div className="meal-copy">
        <div className="meal-meta">
          <span>{meal.type}</span>
          {meal.kcal > 0 && (
            <span>
              <Flame size={12} />
              {meal.kcal} kcal
            </span>
          )}
        </div>
        <h3>{meal.name}</h3>
        <p>{meal.summary || meal.ingredients.map((x) => x.name).join(" · ")}</p>
        <span className="meal-recipe">
          Ver receta
          <ArrowUpRight size={13} />
        </span>
      </div>
      <ChevronRight className="meal-chevron" size={18} />
    </button>
  );
}
export function DietView({
  client,
  onMeal,
}: {
  client: Client;
  onMeal: (m: Meal) => void;
}) {
  const [day, setDay] = useState((new Date().getDay() + 6) % 7);
  const list = client.diets[day] || [];
  const total = list.reduce((s, m) => s + m.kcal, 0);
  const date = new Date();
  const formatted = date.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });
  return (
    <>
      <PageTitle
        eyebrow="NUTRIRTE TAMBIÉN ES CUIDARTE"
        title={
          <>
            Comer bien.
            <br className="mobile-only" /> Sentirte mejor
            <span className="olive-dot">.</span>
          </>
        }
        subtitle="Tu plan de hoy, pensado para ti."
      />
      <div className="diet-layout">
        <section className="diet-main">
          <div className="week-heading">
            <div>
              <h2>Tu semana, en equilibrio</h2>
              <p>{formatted.charAt(0).toUpperCase() + formatted.slice(1)}</p>
            </div>
            <span className="chip">
              <Leaf size={13} />
              Plan personalizado
            </span>
          </div>
          <DayStrip day={day} onChange={setDay} />
          <div className="section-label">
            <h2>
              {FULL_DAYS[day]}{" "}
              <span>
                · {list.length} {list.length === 1 ? "comida" : "comidas"}
              </span>
            </h2>
            <span className="micro-label">DISFRUTA EL PROCESO</span>
          </div>
          {list.length ? (
            <div className="meal-list">
              {list.map((m) => (
                <MealCard key={m.id} meal={m} onClick={() => onMeal(m)} />
              ))}
            </div>
          ) : (
            <EmptyState
              type="diet"
              title="Un nuevo día por preparar"
              description="Tu entrenador todavía no ha asignado una dieta para este día. Aparecerá aquí cuando esté lista."
            />
          )}
          <div className="gentle-footer">
            <Sprout size={18} />
            <span>La constancia se construye con pequeños pasos.</span>
          </div>
        </section>
        <aside className="wellness-sidebar">
          <div className="daily-summary">
            <div className="card-eyebrow">
              <Flame size={16} />
              TU DÍA, DE UN VISTAZO
            </div>
            <h2>Alimentación en equilibrio</h2>
            <div className="calorie-ring">
              <svg viewBox="0 0 180 180" aria-hidden="true">
                <circle className="ring-track" cx="90" cy="90" r="76" />
                <circle className="ring-main" cx="90" cy="90" r="76" />
                <circle className="ring-accent" cx="90" cy="90" r="76" />
              </svg>
              <div>
                <strong>{total.toLocaleString("es-ES")}</strong>
                <span>kcal planificadas</span>
              </div>
            </div>
            <div className="summary-stats">
              <div>
                <span className="stat-dot olive" />{" "}
                <strong>{list.length}</strong>
                <span>comidas</span>
              </div>
              <div>
                <span className="stat-dot clay" />
                <strong>
                  {Object.values(client.diets).filter((ms) => ms.length).length}
                </strong>
                <span>días para ti</span>
              </div>
              <div>
                <span className="stat-dot sand" />
                <strong>1</strong>
                <span>paso a la vez</span>
              </div>
            </div>
            <p>Un plan flexible. Un hábito a la vez.</p>
          </div>
          <div className="coach-note">
            <span className="quote-mark">“</span>
            <div className="card-eyebrow">UNA NOTA DE TU ENTRENADORA</div>
            <p>
              No buscamos días perfectos, sino pequeños hábitos que te hagan
              sentir bien.
            </p>
            <div>
              <Avatar
                client={{ name: "Lucía Moreno", initials: "LM", tone: "olive" }}
                size="sm"
              />
              <span>
                <strong>Lucía Moreno</strong>
                <small>Tu entrenadora personal</small>
              </span>
              <Leaf size={23} />
            </div>
          </div>
          <div className="wellness-mini">
            <span>
              <Utensils size={20} />
            </span>
            <div>
              <strong>Hecho a tu medida</strong>
              <p>Revisa cada receta para ver cantidades y alternativas.</p>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
export function MealDetail({
  meal,
  onBack,
}: {
  meal: Meal;
  onBack: () => void;
}) {
  return (
    <div className="detail-page">
      <Back onClick={onBack} label="Dieta semanal" />
      <div className="meal-detail-grid">
        <div className="detail-hero">
          <img src={`/assets/${meal.image}`} alt={meal.name} />
          <div className="image-caption">
            <Leaf size={14} />
            Sencillo, nutritivo y a tu ritmo
          </div>
        </div>
        <div className="detail-intro">
          <span className="eyebrow">{meal.type.toUpperCase()}</span>
          <h1>{meal.name}</h1>
          <div className="detail-badges">
            {meal.kcal > 0 && (
              <span className="chip">
                <Flame size={14} />
                {meal.kcal} kcal
              </span>
            )}
            <span className="chip">
              <Utensils size={14} />1 persona
            </span>
          </div>
          <p>
            {meal.summary || "Una comida preparada para ti por tu entrenador."}
          </p>
          <div className="note-box">
            <Lightbulb size={20} />
            <div>
              <h3>Notas de tu entrenadora</h3>
              <p>
                {meal.notes ||
                  "Sigue las cantidades indicadas y consulta cualquier duda con tu entrenador."}
              </p>
            </div>
          </div>
        </div>
        <section className="ingredients-panel">
          <h2>Lo que necesitas</h2>
          <p className="section-subtitle">Cantidades para una ración</p>
          <div className="ingredient-list">
            {meal.ingredients.map((x, i) => (
              <div key={i}>
                <span>
                  <i />
                  {x.name}
                </span>
                <strong>{x.quantity}</strong>
              </div>
            ))}
          </div>
        </section>
        <section className="recipe-panel">
          <h2>Manos a la cocina</h2>
          <p className="section-subtitle">Paso a paso, sin complicaciones</p>
          <ol className="recipe-steps">
            {meal.recipe
              .split("\n")
              .filter(Boolean)
              .map((step, i) => (
                <li key={i}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <p>{step}</p>
                </li>
              ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
export function ExerciseCard({
  exercise,
  completed,
  onClick,
}: {
  exercise: Exercise;
  completed?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`exercise-card ${completed ? "exercise-completed" : ""}`}
      onClick={onClick}
    >
      <div className="exercise-thumb">
        <img
          src={
            exercise.image.startsWith("data:")
              ? exercise.image
              : `/assets/${exercise.image}`
          }
          alt=""
        />
        {exercise.resource === "video" && (
          <span>
            <Play size={11} fill="currentColor" />
          </span>
        )}
      </div>
      <div className="exercise-copy">
        <h3>{exercise.name}</h3>
        <p>
          {exercise.sets} series × {exercise.reps} rep.
        </p>
        <span>
          {completed ? (
            <>
              <CheckCheck size={13} />
              Completado
            </>
          ) : (
            <>
              <Clock size={13} />
              {exercise.rest} s de descanso
            </>
          )}
        </span>
      </div>
      <ChevronRight size={18} />
    </button>
  );
}
export function ExercisesView({
  client,
  onExercise,
}: {
  client: Client;
  onExercise: (e: Exercise) => void;
}) {
  const { data } = useStore();
  const [day, setDay] = useState<number | null>(null);
  const assigned = data.exercises.filter((e) =>
    client.exerciseIds.includes(e.id),
  );
  const days = [...new Set(assigned.map((e) => e.day))].sort((a, b) => a - b);
  const selected = day !== null && days.includes(day) ? day : days[0];
  const list = assigned.filter((e) => e.day === selected);
  const done = list.filter(
    (e) => data.completed[`${client.id}:${e.id}`],
  ).length;
  return (
    <>
      <PageTitle
        eyebrow="MOVIMIENTO CON INTENCIÓN"
        title={
          <>
            Más fuerte.
            <br className="mobile-only" /> A tu ritmo
            <span className="olive-dot">.</span>
          </>
        }
        subtitle="Cada repetición es un pequeño paso hacia ti."
      />
      {!assigned.length ? (
        <EmptyState
          type="exercise"
          title="Tu próxima rutina empieza aquí"
          description="Tu entrenador todavía no te ha asignado ejercicios. En cuanto tu plan esté listo, podrás consultarlo aquí."
        />
      ) : (
        <div className="exercise-layout">
          <section>
            <div className="routine-tabs">
              {days.map((d, i) => (
                <button
                  key={d}
                  className={selected === d ? "active" : ""}
                  onClick={() => setDay(d)}
                >
                  <span>Día {i + 1}</span>
                  <strong>{FULL_DAYS[d]}</strong>
                </button>
              ))}
            </div>
            <div className="routine-banner">
              <div>
                <span className="eyebrow">
                  DÍA {days.indexOf(selected) + 1} ·{" "}
                  {FULL_DAYS[selected]?.toUpperCase()}
                </span>
                <h2>{list[0]?.group || "Tu rutina personalizada"}</h2>
                <p>
                  <Dumbbell size={14} />
                  {list.length} ejercicios<span>·</span>
                  <Clock size={14} />A tu ritmo
                </p>
              </div>
              <span className="routine-icon">
                <Dumbbell size={43} strokeWidth={1.2} />
              </span>
            </div>
            <div className="progress-row">
              <span>Tu progreso de hoy</span>
              <strong>
                {done} de {list.length}
              </strong>
            </div>
            <div className="progress-track">
              <span style={{ width: `${(done / list.length) * 100}%` }} />
            </div>
            <div className="exercise-list">
              {list.map((e) => (
                <ExerciseCard
                  key={e.id}
                  exercise={e}
                  completed={data.completed[`${client.id}:${e.id}`]}
                  onClick={() => onExercise(e)}
                />
              ))}
            </div>
          </section>
          <aside className="wellness-sidebar">
            <div className="coach-note">
              <span className="quote-mark">“</span>
              <div className="card-eyebrow">RECUERDA</div>
              <p>
                Escucha tu cuerpo. La técnica y la constancia valen más que las
                prisas.
              </p>
              <div>
                <Avatar
                  client={{
                    name: "Lucía Moreno",
                    initials: "LM",
                    tone: "olive",
                  }}
                  size="sm"
                />
                <span>
                  <strong>Lucía Moreno</strong>
                  <small>Tu entrenadora personal</small>
                </span>
              </div>
            </div>
            <div className="note-box">
              <Lightbulb size={21} />
              <div>
                <h3>Antes de empezar</h3>
                <p>Revisa la técnica y los consejos de cada ejercicio.</p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
export function ExerciseDetail({
  exercise,
  clientId,
  onBack,
  trainer = false,
  onEdit,
}: {
  exercise: Exercise;
  clientId: string;
  onBack: () => void;
  trainer?: boolean;
  onEdit?: () => void;
}) {
  const { data, setData, notify } = useStore();
  const key = `${clientId}:${exercise.id}`;
  const completed = !!data.completed[key];
  const id = youtubeId(exercise.url);
  return (
    <div className="detail-page exercise-detail">
      <Back onClick={onBack} label="Ejercicios" />
      <div className="exercise-detail-grid">
        <div className="exercise-visual">
          <img
            src={
              exercise.image.startsWith("data:")
                ? exercise.image
                : `/assets/${exercise.image}`
            }
            alt={`Ilustración de ${exercise.name}`}
          />
          {exercise.resource === "video" && (
            <div className="video-overlay">
              {id ? (
                <a
                  className="video-play"
                  href={`https://www.youtube.com/watch?v=${id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Ver vídeo en YouTube"
                >
                  <Play size={27} fill="currentColor" />
                </a>
              ) : (
                <span className="video-play muted">
                  <Play size={27} />
                </span>
              )}
              <span>
                {id ? "Se abre en YouTube" : "Enlace de vídeo pendiente"}
              </span>
            </div>
          )}
        </div>
        <section>
          <span className="eyebrow">
            {FULL_DAYS[exercise.day]?.toUpperCase()} ·{" "}
            {exercise.group.toUpperCase()}
          </span>
          <h1>{exercise.name}</h1>
          <div className="exercise-metrics">
            <div>
              <strong>{exercise.sets}</strong>
              <span>series</span>
            </div>
            <div>
              <strong>{exercise.reps}</strong>
              <span>repeticiones</span>
            </div>
            <div>
              <strong>
                {exercise.rest}
                <small> s</small>
              </strong>
              <span>descanso</span>
            </div>
          </div>
          {exercise.resource === "video" &&
            (id ? (
              <a
                className="button button-secondary video-link"
                href={`https://www.youtube.com/watch?v=${id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Play size={17} />
                Ver vídeo
                <ExternalLink size={16} />
                <small>Se abre en YouTube</small>
              </a>
            ) : (
              <div className="note-box">
                <Play size={18} />
                <p>El entrenador todavía no ha añadido el enlace de vídeo.</p>
              </div>
            ))}
          <h2>Cuida la técnica</h2>
          <p className="technique-text">{exercise.technique}</p>
          <div className="note-box">
            <MessageCircle size={21} />
            <div>
              <h3>Consejos de tu entrenadora</h3>
              <p>
                {exercise.notes ||
                  "Realiza el movimiento con control y respeta el descanso indicado."}
              </p>
            </div>
          </div>
          {trainer ? (
            <Button onClick={onEdit}>Editar ejercicio</Button>
          ) : (
            <label className={`complete-control ${completed ? "checked" : ""}`}>
              <input
                type="checkbox"
                checked={completed}
                onChange={() => {
                  setData((d) => ({
                    ...d,
                    completed: { ...d.completed, [key]: !completed },
                  }));
                  if (!completed) notify("Un paso más. ¡Ejercicio completado!");
                }}
              />
              <span className="custom-check">
                {completed && <Check size={16} />}
              </span>
              <span>
                <strong>
                  {completed
                    ? "Ejercicio completado"
                    : "Marcar como completado"}
                </strong>
                <small>
                  {completed
                    ? "Tu progreso se ha guardado."
                    : "Cada pequeño esfuerzo cuenta."}
                </small>
              </span>
            </label>
          )}
        </section>
      </div>
    </div>
  );
}
