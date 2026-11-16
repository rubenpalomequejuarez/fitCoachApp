import type {
  AppData,
  Client,
  Exercise,
  Meal,
  RoutineTemplate,
  SessionLog,
} from "./types";

const normalizeSearchText = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");

/** Match every word across the visible fields, without accents or case barriers. */
export function matchesSearch(query: string, ...fields: string[]): boolean {
  const terms = normalizeSearchText(query).trim().split(/\s+/).filter(Boolean);
  const text = normalizeSearchText(fields.join(" "));
  return terms.every((term) => text.includes(term));
}

export const newId = () =>
  typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
export const today = () =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Madrid" }).format(
    new Date(),
  );
export const shiftDate = (date: string, days: number) => {
  const d = new Date(date + "T12:00:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const weekday = (date: string) =>
  (new Date(date + "T12:00:00").getDay() + 6) % 7;
export const dateLabel = (date: string, full = false) =>
  new Date(date + "T12:00:00").toLocaleDateString("es-ES", {
    day: "numeric",
    month: full ? "long" : "short",
    ...(full ? { year: "numeric" } : {}),
  });
export const assignedExercises = (client: Client) => client.assignments ?? [];
export const completionKey = (
  clientId: string,
  exerciseId: string,
  date = today(),
) => `${clientId}:${date}:${exerciseId}`;
export const trainingLoad = (log: Pick<SessionLog, "rpe" | "duration">) =>
  Math.round(log.rpe * log.duration);
export const cloneExercise = (
  exercise: Exercise,
  day = exercise.day,
  group = exercise.group,
): Exercise => ({
  ...structuredClone(exercise),
  id: newId(),
  sourceId: exercise.sourceId || exercise.id,
  day,
  group,
});
export const cloneMeal = (meal: Meal): Meal => ({
  ...structuredClone(meal),
  id: newId(),
  sourceId: meal.sourceId || meal.id,
});
/** Preserve the selected versions, including distinct adaptations of one base exercise. */
export const createRoutineTemplate = (
  name: string,
  exercises: Exercise[],
): RoutineTemplate => ({
  id: newId(),
  name: name.trim(),
  exercises: exercises.map((exercise) => ({
    ...cloneExercise(exercise),
    sourceId: exercise.id,
  })),
});
export const mealErrors = (meal: Meal): Record<string, string> => {
  const er: Record<string, string> = {};
  if (!meal.name.trim()) er.name = "Añade el nombre del plato.";
  if (!meal.recipe.trim()) er.recipe = "Explica la receta paso a paso.";
  if (
    !meal.ingredients.length ||
    meal.ingredients.some((i) => !i.name.trim() || !i.quantity.trim())
  )
    er.ingredients = "Completa el nombre y la cantidad de cada alimento.";
  if (!Number.isFinite(meal.kcal) || meal.kcal < 0)
    er.kcal = "Introduce calorías iguales o superiores a cero.";
  return er;
};

/** Libraries are templates. Each destination owns a deep copy, including nested ingredients. */
export function assignExercises(
  data: AppData,
  templates: Exercise[],
  clientIds: string[],
  days: number | readonly number[],
  routineName?: string,
): { data: AppData; added: number; skipped: number } {
  const targetDays = typeof days === "number" ? [days] : Array.from(new Set(days));
  let added = 0,
    skipped = 0;
  const clients = data.clients.map((c) => {
    if (!clientIds.includes(c.id)) return c;
    const assigned = [...assignedExercises(c)];
    for (const day of targetDays) {
      for (const template of templates) {
        const group = routineName?.trim() || template.group;
        const sourceId = template.sourceId || template.id;
        if (
          assigned.some(
            (x) => x.sourceId === sourceId && x.day === day && x.group === group,
          )
        ) {
          skipped++;
          continue;
        }
        assigned.push(cloneExercise(template, day, group));
        added++;
      }
    }
    return { ...c, assignments: assigned };
  });
  return { data: { ...data, clients }, added, skipped };
}
export function personalizeExercise(
  data: AppData,
  clientId: string,
  exercise: Exercise,
): AppData {
  return {
    ...data,
    clients: data.clients.map((c) =>
      c.id === clientId
        ? {
            ...c,
            assignments: assignedExercises(c).map((e) =>
              e.id === exercise.id ? structuredClone(exercise) : e,
            ),
          }
        : c,
    ),
  };
}
export function assignMeals(
  data: AppData,
  templates: Meal[],
  clientIds: string[],
  days: number[],
): AppData {
  return {
    ...data,
    clients: data.clients.map((c) => {
      if (!clientIds.includes(c.id)) return c;
      const diets = { ...c.diets };
      for (const day of days)
        diets[day] = [...(diets[day] || []), ...templates.map(cloneMeal)];
      return { ...c, diets };
    }),
  };
}
export function removeAssignedExercise(
  data: AppData,
  clientId: string,
  assignmentId: string,
): AppData {
  return {
    ...data,
    clients: data.clients.map((client) =>
      client.id === clientId
        ? {
            ...client,
            assignments: assignedExercises(client).filter(
              (e) => e.id !== assignmentId,
            ),
          }
        : client,
    ),
  };
}

export function restoreAssignedExercise(
  data: AppData,
  clientId: string,
  exercise: Exercise,
  index: number,
): AppData {
  return {
    ...data,
    clients: data.clients.map((client) => {
      if (client.id !== clientId) return client;
      const assignments = [...assignedExercises(client)];
      if (assignments.some((e) => e.id === exercise.id)) return client;
      assignments.splice(Math.max(0, index), 0, structuredClone(exercise));
      return { ...client, assignments };
    }),
  };
}

export function copyMenu(
  week: Record<number, Meal[]>,
  sourceDay: number,
  targetDays: number[],
  replace = false,
): Record<number, Meal[]> {
  const next = { ...week };
  for (const day of targetDays) {
    if (day === sourceDay) continue;
    next[day] = [
      ...(replace ? [] : next[day] || []),
      ...(week[sourceDay] || []).map(cloneMeal),
    ];
  }
  return next;
}

export function normalizeData(raw: unknown, defaults: AppData): AppData {
  const source =
    raw && typeof raw === "object" ? (raw as Partial<AppData>) : defaults;
  const exercises = Array.isArray(source.exercises)
    ? source.exercises
    : defaults.exercises;
  const original =
    Array.isArray(source.clients) && source.clients.length
      ? source.clients
      : defaults.clients;
  const completed = { ...(source.completed || {}) };
  const clients = original.map((c) => {
    const assignments = Array.isArray(c.assignments)
      ? c.assignments
      : exercises
          .filter((e) => (c.exerciseIds || []).includes(e.id))
          .map((e) => ({
            ...structuredClone(e),
            id: `assigned-${c.id}-${e.id}`,
            sourceId: e.id,
          }));
    for (const e of assignments) {
      const key = `${c.id}:${e.sourceId || e.id}`;
      if (key in completed) {
        const current = completionKey(c.id, e.id);
        if (!(current in completed)) completed[current] = completed[key];
        delete completed[key];
      }
    }
    return {
      ...c,
      diets: c.diets || {},
      exerciseIds: c.exerciseIds || [],
      assignments,
    };
  });
  return {
    clients,
    exercises,
    completed,
    mealLibrary: Array.isArray(source.mealLibrary)
      ? source.mealLibrary
      : structuredClone(defaults.mealLibrary),
    routines: Array.isArray(source.routines)
      ? source.routines
      : structuredClone(defaults.routines),
    sessionLogs: Array.isArray(source.sessionLogs)
      ? source.sessionLogs
      : structuredClone(defaults.sessionLogs).filter((s) =>
          clients.some((c) => c.id === s.clientId),
        ),
    schemaVersion: 2,
  };
}
export function demoSessions(clients: Client[]): SessionLog[] {
  const sessions: SessionLog[] = [];
  for (const c of clients.filter((c) => c.exerciseIds.length)) {
    let i = 0;
    for (let ago = 27; ago >= 1; ago--) {
      const date = shiftDate(today(), -ago),
        day = weekday(date);
      if (![0, 2, 4].includes(day)) continue;
      sessions.push({
        id: `demo-${c.id}-${date}`,
        clientId: c.id,
        date,
        routineDay: day,
        routineName:
          day === 0
            ? "Pierna y glúteo"
            : day === 2
              ? "Tren superior"
              : "Core y movilidad",
        exerciseIds: [],
        duration: [40, 45, 35, 50, 45, 40][i % 6],
        rpe: [5, 6, 4, 7, 6, 5, 4, 6][i % 8],
        notes: i % 3 === 0 ? "Buen ritmo y técnica controlada." : "",
        recordedAt: date + "T19:00:00.000Z",
        isDemo: true,
      });
      i++;
    }
  }
  return sessions;
}
export function validateSession(
  log: Pick<SessionLog, "date" | "rpe" | "duration">,
): Record<string, string> {
  const e: Record<string, string> = {};
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(log.date) ||
    Number.isNaN(Date.parse(log.date)) ||
    shiftDate(log.date, 0) !== log.date ||
    log.date > today()
  )
    e.date = "Elige una fecha válida que no sea futura.";
  if (!Number.isFinite(log.rpe) || log.rpe < 0 || log.rpe > 10)
    e.rpe = "Selecciona un esfuerzo entre 0 y 10.";
  if (!Number.isInteger(log.duration) || log.duration < 1 || log.duration > 600)
    e.duration = "Indica una duración de entre 1 y 600 minutos.";
  return e;
}
export function upsertSession(data: AppData, log: SessionLog): AppData {
  if (Object.keys(validateSession(log)).length)
    throw new Error("Valoración de sesión no válida");
  return {
    ...data,
    sessionLogs: [
      ...data.sessionLogs.filter(
        (s) =>
          !(
            s.clientId === log.clientId &&
            s.date === log.date &&
            s.routineDay === log.routineDay
          ),
      ),
      structuredClone(log),
    ],
  };
}
export function dailyLoads(logs: SessionLog[], start: string, end: string) {
  const days = [];
  for (let date = start; date <= end; date = shiftDate(date, 1)) {
    const sessions = logs.filter((s) => s.date === date),
      duration = sessions.reduce((a, s) => a + s.duration, 0),
      load = sessions.reduce((a, s) => a + trainingLoad(s), 0);
    days.push({
      date,
      sessions: sessions.length,
      duration,
      load,
      rpe: duration ? load / duration : null,
    });
  }
  return days;
}
export function csvSessions(logs: SessionLog[], client: Client) {
  const cell = (x: string | number) => {
    let s = String(x);
    if (/^[=+\-@]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  const rows = [
    [
      "Cliente",
      "Fecha",
      "Rutina",
      "Duración (min)",
      "RPE (0-10)",
      "Carga (u.a.)",
      "Notas",
      "Ejemplo",
    ],
    ...logs.map((s) => [
      client.name,
      s.date,
      s.routineName,
      s.duration,
      s.rpe,
      trainingLoad(s),
      s.notes,
      s.isDemo ? "Sí" : "No",
    ]),
  ];
  return "\uFEFF" + rows.map((row) => row.map(cell).join(";")).join("\r\n");
}
