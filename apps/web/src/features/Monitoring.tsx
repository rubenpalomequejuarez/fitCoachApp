import { useId, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Check,
  CheckCheck,
  Clock,
  Download,
  Flame,
  Leaf,
  MessageCircle,
  PenLine,
  Send,
  TrendingUp,
} from "lucide-react";
import {
  Avatar,
  Back,
  Button,
  EmptyState,
  Field,
  Modal,
  PageTitle,
  TextArea,
} from "../components/ui";
import { useStore } from "../store";
import {
  assignedExercises,
  completionKey,
  csvSessions,
  dailyLoads,
  dateLabel,
  newId,
  shiftDate,
  today,
  trainingLoad,
  upsertSession,
  validateSession,
} from "../domain";
import { FULL_DAYS } from "../data";
import type { Client, Exercise, SessionLog } from "../types";

const effortNames: Record<number, string> = {
  0: "Sin esfuerzo",
  1: "Muy suave",
  2: "Suave",
  3: "Moderado",
  4: "Algo exigente",
  5: "Exigente",
  7: "Muy exigente",
  10: "Máximo",
};
export function SessionCheckIn({
  client,
  exercises,
  routineDay,
  onClose,
  onSaved,
}: {
  client: Client;
  exercises: Exercise[];
  routineDay: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { data, setData, notify } = useStore();
  const initial = data.sessionLogs.find(
    (s) =>
      s.clientId === client.id &&
      s.date === today() &&
      s.routineDay === routineDay &&
      !s.isDemo,
  );
  const [date, setDate] = useState(initial?.date || today());
  const [rpe, setRpe] = useState<number | null>(initial?.rpe ?? null);
  const [duration, setDuration] = useState(
    initial ? String(initial.duration) : "",
  );
  const [notes, setNotes] = useState(initial?.notes || "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formId = useId();
  const load =
    rpe !== null && +duration > 0 ? Math.round(rpe * +duration) : null;
  const matching = data.sessionLogs.find(
    (s) =>
      s.clientId === client.id &&
      s.date === date &&
      s.routineDay === routineDay &&
      !s.isDemo,
  );
  const completed = exercises.filter(
    (e) => data.completed[completionKey(client.id, e.id, date)],
  );
  const name =
    matching?.routineName ||
    [...new Set(exercises.map((e) => e.group))].join(" · ") ||
    `Rutina del ${FULL_DAYS[routineDay].toLowerCase()}`;
  function save(e: React.FormEvent) {
    e.preventDefault();
    const er = validateSession({ date, rpe: rpe ?? NaN, duration: +duration });
    setErrors(er);
    if (Object.keys(er).length) return;
    const log: SessionLog = {
      id: matching?.id || newId(),
      clientId: client.id,
      date,
      routineDay,
      routineName: name,
      exerciseIds: completed.length
        ? completed.map((e) => e.id)
        : matching?.exerciseIds || [],
      duration: +duration,
      rpe: rpe!,
      notes: notes.trim(),
      recordedAt: new Date().toISOString(),
      isDemo: false,
    };
    setData((d) => upsertSession(d, log));
    notify(
      matching
        ? "Valoración actualizada. Tu entrenadora verá los cambios."
        : "Sesión guardada. Gracias por compartir cómo te has sentido.",
    );
    onSaved();
  }
  return (
    <Modal
      title={
        initial ? "Editar valoración de la sesión" : "Un minuto para escucharte"
      }
      onClose={onClose}
      footer={
        <Button
          variant="accent"
          type="submit"
          form={formId}
          icon={<Send size={17} />}
        >
          {matching ? "Actualizar valoración" : "Guardar valoración"}
        </Button>
      }
    >
      <div className="checkin-intro">
        <span className="checkin-icon">
          <Activity size={25} />
        </span>
        <div>
          <strong>{name}</strong>
          <p>
            {completed.length} de {exercises.length} ejercicios marcados
          </p>
        </div>
      </div>
      <form id={formId} onSubmit={save} noValidate>
        <Field
          label="Fecha de la sesión"
          type="date"
          max={today()}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          error={errors.date}
        />
        <fieldset className="rpe-field">
          <legend>¿Cómo has sentido el entrenamiento?</legend>
          <p>Valora el esfuerzo de la sesión completa, de 0 a 10.</p>
          <div className="rpe-options">
            {Array.from({ length: 11 }, (_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`RPE ${i}${effortNames[i] ? ": " + effortNames[i] : ""}`}
                aria-pressed={rpe === i}
                className={rpe === i ? "selected" : ""}
                onClick={() => setRpe(i)}
              >
                {i}
              </button>
            ))}
          </div>
          <div className="rpe-anchors">
            <span>0 · Sin esfuerzo</span>
            <span>10 · Máximo</span>
          </div>
          <div className="rpe-chosen" aria-live="polite">
            {rpe === null ? (
              "Elige un número para tu sesión"
            ) : (
              <>
                <strong>
                  {rpe}
                  <small>/10</small>
                </strong>
                <span>
                  {effortNames[rpe] || "Esfuerzo percibido de la sesión"}
                </span>
              </>
            )}
          </div>
          {errors.rpe && (
            <p className="error-text" role="alert">
              {errors.rpe}
            </p>
          )}
        </fieldset>
        <Field
          label="Duración total (minutos)"
          inputMode="numeric"
          type="number"
          min="1"
          max="600"
          step="1"
          placeholder="Ej. 45"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          error={errors.duration}
          hint="Incluye el calentamiento y los descansos de la sesión."
        />
        <TextArea
          label="¿Algo que quieras contar? (opcional)"
          placeholder="Cómo te has sentido, algún ejercicio a adaptar…"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="checkin-load">
          <div>
            <span>CARGA INTERNA ESTIMADA</span>
            <p>Esfuerzo × duración</p>
          </div>
          <strong>
            {load === null ? "—" : load}
            <small> u.a.</small>
          </strong>
        </div>
        <p className="form-hint">
          Piensa en toda la sesión, no solo en la última serie. Para comparar
          tus respuestas, procura valorar siempre en un momento similar, por
          ejemplo unos 30 minutos después.
        </p>
      </form>
    </Modal>
  );
}
type DayLoad = ReturnType<typeof dailyLoads>[number];
function LoadChart({
  days,
  selected,
  onSelect,
  mode = "load",
}: {
  days: DayLoad[];
  selected: string;
  onSelect: (date: string) => void;
  mode?: "load" | "rpe";
}) {
  const id = useId();
  const W = 720,
    H = 220,
    left = 42,
    right = 15,
    top = 20,
    bottom = 40,
    pw = W - left - right,
    ph = H - top - bottom;
  const max =
    mode === "rpe"
      ? 10
      : Math.max(
          100,
          Math.ceil(Math.max(...days.map((d) => d.load), 0) / 100) * 100,
        );
  const step = pw / days.length;
  const x = (i: number) => left + step * (i + 0.5);
  const y = (n: number) => top + ph - (ph * n) / max;
  const segments: DayLoad[][] = [];
  let current: DayLoad[] = [];
  for (const d of days) {
    if (d.rpe !== null) {
      current.push(d);
    } else if (current.length) {
      segments.push(current);
      current = [];
    }
  }
  if (current.length) segments.push(current);
  return (
    <svg
      className="load-chart"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-labelledby={id}
    >
      <title id={id}>
        {mode === "load"
          ? "Carga interna diaria en unidades arbitrarias"
          : "RPE diario de 0 a 10; promedio ponderado si hay varias sesiones"}
        . Selecciona una fecha para ver el detalle.
      </title>
      {[0, 0.5, 1].map((v) => (
        <g key={v}>
          <line
            x1={left}
            x2={W - right}
            y1={y(max * v)}
            y2={y(max * v)}
            stroke="var(--color-border)"
            strokeDasharray={v ? "3 6" : undefined}
          />
          <text
            x={left - 10}
            y={y(max * v) + 4}
            textAnchor="end"
            className="chart-label"
          >
            {Math.round(max * v)}
          </text>
        </g>
      ))}
      {mode === "rpe" &&
        segments.map((segment, i) => (
          <polyline
            key={i}
            points={segment
              .map((d) => `${x(days.indexOf(d))},${y(d.rpe!)}`)
              .join(" ")}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="2.5"
          />
        ))}
      {days.map((d, i) => (
        <g key={d.date}>
          {mode === "load" ? (
            <rect
              x={x(i) - Math.max(3, step * 0.28)}
              y={y(d.load || 0)}
              width={Math.max(6, step * 0.56)}
              height={d.load ? Math.max(2, (ph * d.load) / max) : 2}
              rx="3"
              fill={
                selected === d.date
                  ? "var(--color-accent)"
                  : d.load
                    ? "var(--color-primary)"
                    : "var(--color-border)"
              }
              onClick={() => onSelect(d.date)}
            >
              <title>
                {dateLabel(d.date)}: {d.load} u.a. · {d.sessions} sesiones
              </title>
            </rect>
          ) : d.rpe !== null ? (
            <circle
              cx={x(i)}
              cy={y(d.rpe)}
              r={selected === d.date ? 6 : 4.5}
              fill={
                selected === d.date
                  ? "var(--color-accent)"
                  : "var(--color-primary)"
              }
              onClick={() => onSelect(d.date)}
            >
              <title>
                {dateLabel(d.date)}: RPE {d.rpe.toFixed(1)}
              </title>
            </circle>
          ) : null}
          {(i % Math.ceil(days.length / 7) === 0 || i === days.length - 1) && (
            <text
              x={x(i)}
              y={H - 15}
              textAnchor="middle"
              className="chart-label"
            >
              {new Date(d.date + "T12:00:00").toLocaleDateString("es-ES", {
                day: "numeric",
                month: "numeric",
              })}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
export function ProgressView({
  client,
  onBack,
  onClientChange,
}: {
  client: Client;
  onBack: () => void;
  onClientChange: (id: string) => void;
}) {
  const { data } = useStore();
  const [range, setRange] = useState(28);
  const [showDemo, setShowDemo] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const end = today(),
    start = shiftDate(end, 1 - range);
  const all = data.sessionLogs
    .filter((s) => s.clientId === client.id && (showDemo || !s.isDemo))
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        b.recordedAt.localeCompare(a.recordedAt),
    );
  const logs = all.filter((s) => s.date >= start && s.date <= end);
  const days = dailyLoads(logs, start, end);
  const current = all.filter(
      (s) => s.date >= shiftDate(end, -6) && s.date <= end,
    ),
    previous = all.filter(
      (s) => s.date >= shiftDate(end, -13) && s.date < shiftDate(end, -6),
    );
  const weekLoad = current.reduce((a, s) => a + trainingLoad(s), 0),
    previousLoad = previous.reduce((a, s) => a + trainingLoad(s), 0),
    totalMinutes = logs.reduce((a, s) => a + s.duration, 0),
    avg = logs.length
      ? logs.reduce((a, s) => a + s.rpe, 0) / logs.length
      : null;
  const delta = previousLoad
    ? Math.round(((weekLoad - previousLoad) / previousLoad) * 100)
    : null;
  const activeDate =
    selected && selected >= start && selected <= end
      ? selected
      : (logs[0]?.date ?? end);
  const detail = days.find((d) => d.date === activeDate)!;
  const selectedLogs = logs.filter((s) => s.date === activeDate);
  function download() {
    const blob = new Blob([csvSessions(logs, client)], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fitcoach-${client.id}-${start}-${end}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <>
      <Back onClick={onBack} label="Volver a clientes" />
      <PageTitle
        eyebrow="ACOMPAÑAR CON CONTEXTO"
        title={
          <>
            Escuchar. Ajustar.
            <br />
            Seguir avanzando<span className="olive-dot">.</span>
          </>
        }
        subtitle="El esfuerzo de cada sesión, convertido en una historia que puedes seguir."
        action={
          <Button
            variant="secondary"
            onClick={download}
            disabled={!logs.length}
            icon={<Download size={17} />}
          >
            Exportar registros
          </Button>
        }
      />
      <div className="monitoring-filters">
        <div className="monitoring-client">
          <Avatar client={client} />
          <div className="field">
            <label htmlFor="monitoring-client">Cliente</label>
            <select
              id="monitoring-client"
              value={client.id}
              onChange={(e) => onClientChange(e.target.value)}
            >
              {data.clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="monitoring-range" aria-label="Periodo de seguimiento">
          {[14, 28, 56].map((n) => (
            <button
              type="button"
              key={n}
              aria-pressed={range === n}
              className={range === n ? "active" : ""}
              onClick={() => setRange(n)}
            >
              {n} días
            </button>
          ))}
        </div>
        <label className="demo-toggle">
          <input
            type="checkbox"
            checked={showDemo}
            onChange={(e) => setShowDemo(e.target.checked)}
          />
          Incluir historial de ejemplo
        </label>
      </div>
      <div className="monitoring-stats">
        <div>
          <span>
            <Flame size={17} />
            Carga · últimos 7 días
          </span>
          <strong>
            {weekLoad.toLocaleString("es-ES")}
            <small> u.a.</small>
          </strong>
          <p>
            {delta === null ? (
              "Sin referencia de la semana anterior"
            ) : (
              <>
                {delta >= 0 ? (
                  <ArrowUpRight size={13} />
                ) : (
                  <ArrowDownRight size={13} />
                )}{" "}
                {delta > 0 ? "+" : ""}
                {delta}% frente a los 7 días anteriores
              </>
            )}
          </p>
        </div>
        <div>
          <span>
            <Activity size={17} />
            Esfuerzo medio
          </span>
          <strong>
            {avg === null ? "—" : avg.toFixed(1)}
            <small> /10</small>
          </strong>
          <p>
            {logs.length}{" "}
            {logs.length === 1 ? "sesión registrada" : "sesiones registradas"}{" "}
            en el periodo
          </p>
        </div>
        <div>
          <span>
            <Clock size={17} />
            Tiempo registrado
          </span>
          <strong>
            {totalMinutes}
            <small> min</small>
          </strong>
          <p>{range} días de seguimiento</p>
        </div>
      </div>
      {logs.length ? (
        <>
          <div className="monitoring-chart-grid">
            <section className="chart-panel">
              <header>
                <div>
                  <span className="eyebrow">VOLUMEN DE ESFUERZO</span>
                  <h2>Carga por día</h2>
                </div>
                <span className="chart-unit">u.a.</span>
              </header>
              <LoadChart
                days={days}
                selected={activeDate}
                onSelect={setSelected}
              />
              <p>
                Cada barra suma el esfuerzo × minutos de las sesiones de ese
                día.
              </p>
            </section>
            <section className="chart-panel">
              <header>
                <div>
                  <span className="eyebrow">CÓMO LO HA SENTIDO</span>
                  <h2>Esfuerzo percibido</h2>
                </div>
                <span className="chart-unit">0–10</span>
              </header>
              <LoadChart
                days={days}
                selected={activeDate}
                onSelect={setSelected}
                mode="rpe"
              />
              <p>
                Los días sin registro quedan vacíos. Si hay varias sesiones, el
                promedio se pondera por su duración.
              </p>
            </section>
          </div>
          <section className="daily-inspector">
            <div>
              <span className="eyebrow">UN DÍA CON CONTEXTO</span>
              <div className="field">
                <label htmlFor="inspect-date">Consultar día</label>
                <select
                  id="inspect-date"
                  value={activeDate}
                  onChange={(e) => setSelected(e.target.value)}
                >
                  {[...days].reverse().map((d) => (
                    <option key={d.date} value={d.date}>
                      {dateLabel(d.date, true)}
                      {d.sessions
                        ? ` · ${d.sessions} ${d.sessions === 1 ? "sesión" : "sesiones"}`
                        : " · sin registros"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="inspector-metrics">
              <span>
                <strong>{detail.load}</strong> u.a.
              </span>
              <span>
                <strong>
                  {detail.rpe === null ? "—" : detail.rpe.toFixed(1)}
                </strong>{" "}
                RPE
              </span>
              <span>
                <strong>{detail.duration}</strong> min
              </span>
            </div>
            {selectedLogs.length ? (
              <div className="inspector-notes">
                {selectedLogs.map((s) => (
                  <div key={s.id}>
                    <strong>
                      {s.routineName}
                      {s.isDemo && (
                        <span className="example-badge">Ejemplo</span>
                      )}
                    </strong>
                    <p>{s.notes || "Sin notas adicionales en esta sesión."}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No hay ninguna valoración registrada para este día.</p>
            )}
          </section>
          <section className="session-history">
            <div className="section-label">
              <h2>Historial de sesiones</h2>
              <span>
                {logs.length} {logs.length === 1 ? "registro" : "registros"}
              </span>
            </div>
            {logs.map((s) => (
              <article className="session-history-row" key={s.id}>
                <button
                  type="button"
                  onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                  aria-expanded={expanded === s.id}
                >
                  <span className="session-date">
                    <strong>{new Date(s.date + "T12:00:00").getDate()}</strong>
                    <small>
                      {new Date(s.date + "T12:00:00").toLocaleDateString(
                        "es-ES",
                        { month: "short" },
                      )}
                    </small>
                  </span>
                  <span className="session-name">
                    <strong>
                      {s.routineName}
                      {s.isDemo && (
                        <span className="example-badge">Ejemplo</span>
                      )}
                    </strong>
                    <small>
                      {s.duration} min ·{" "}
                      {s.exerciseIds.length
                        ? `${s.exerciseIds.length} ejercicios marcados`
                        : "Valoración global de sesión"}
                    </small>
                  </span>
                  <span className="session-rpe">
                    <strong>
                      {s.rpe}
                      <small>/10</small>
                    </strong>
                    <small>RPE</small>
                  </span>
                  <span className="session-load">
                    <strong>{trainingLoad(s)}</strong>
                    <small>u.a.</small>
                  </span>
                  <MessageCircle size={16} />
                </button>
                {expanded === s.id && (
                  <div className="session-expanded">
                    <span>{dateLabel(s.date, true)}</span>
                    <p>
                      {s.notes ||
                        "El cliente no ha añadido notas a esta sesión."}
                    </p>
                  </div>
                )}
              </article>
            ))}
          </section>
          <details className="chart-data-table">
            <summary>Ver datos de las gráficas en tabla</summary>
            <div>
              <table>
                <caption>Resumen diario de {client.name}</caption>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Sesiones</th>
                    <th>Minutos</th>
                    <th>RPE</th>
                    <th>Carga (u.a.)</th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((d) => (
                    <tr key={d.date}>
                      <td>{dateLabel(d.date)}</td>
                      <td>{d.sessions}</td>
                      <td>{d.duration}</td>
                      <td>{d.rpe === null ? "—" : d.rpe.toFixed(1)}</td>
                      <td>{d.load}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      ) : (
        <EmptyState
          type="exercise"
          title="El progreso empieza por escuchar"
          description={
            showDemo
              ? "Este cliente todavía no tiene valoraciones en el periodo elegido."
              : "Las valoraciones del cliente aparecerán aquí cuando termine una sesión y registre su esfuerzo."
          }
        />
      )}
      <div className="monitoring-method">
        <span>
          <Leaf size={22} />
        </span>
        <div>
          <strong>Una referencia para acompañar mejor</strong>
          <p>
            La carga interna se estima como RPE × duración en minutos. Se
            expresa en unidades arbitrarias y ayuda a comparar sesiones del
            mismo cliente. Los registros «Ejemplo» son ficticios.
          </p>
          <a
            href="https://pubmed.ncbi.nlm.nih.gov/11708692/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Sobre el método session-RPE
            <ArrowUpRight size={12} />
          </a>
        </div>
      </div>
    </>
  );
}
