import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
const code = ts.transpileModule(
  fs.readFileSync(new URL("../src/domain.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.ESNext } },
).outputText;
const d = await import(
  "data:text/javascript;base64," + Buffer.from(code).toString("base64")
);
const exercise = {
  id: "squat",
  name: "Sentadilla",
  sets: 3,
  reps: "12",
  rest: 90,
  day: 0,
  notes: "Base",
  technique: "Movimiento controlado",
  resource: "image",
  image: "squat.svg",
  url: "",
  group: "Fuerza",
};
const meal = {
  id: "oats",
  name: "Avena",
  type: "Desayuno",
  kcal: 420,
  summary: "Avena",
  image: "oats.jpg",
  ingredients: [{ name: "Avena", quantity: "60 g" }],
  recipe: "Mezclar y dejar reposar.",
  notes: "Base",
};
const client = (id) => ({
  id,
  name: id,
  email: id + "@example.com",
  goal: "Fuerza",
  initials: id.toUpperCase(),
  tone: "olive",
  joined: "Nuevo",
  diets: {},
  exerciseIds: [],
  assignments: [],
});
const base = () => ({
  clients: [client("a"), client("b")],
  exercises: [structuredClone(exercise)],
  completed: {},
  mealLibrary: [structuredClone(meal)],
  routines: [],
  sessionLogs: [],
  schemaVersion: 2,
});
const log = (patch = {}) => ({
  id: "log",
  clientId: "a",
  date: d.today(),
  routineDay: 0,
  routineName: "Fuerza",
  exerciseIds: [],
  rpe: 7,
  duration: 45,
  notes: "Bien",
  recordedAt: new Date().toISOString(),
  isDemo: false,
  ...patch,
});

test("search finds accented names and ingredients with or without accents and case", () => {
  assert.equal(d.matchesSearch("GLUTEO", "Pierna y glúteo"), true);
  assert.equal(d.matchesSearch("garcia", "Ana García"), true);
  assert.equal(d.matchesSearch("salmon", "Salmón con verduras"), true);
  assert.equal(d.matchesSearch("CHÍA", "Semillas de chia"), true);
  assert.equal(d.matchesSearch("garci\u0301a", "Ana García"), true);
});
test("search matches every word in any order across visible fields", () => {
  assert.equal(
    d.matchesSearch("gluteo goblet", "Sentadilla goblet", "Pierna y glúteo"),
    true,
  );
  assert.equal(
    d.matchesSearch("chia avena", "Avena con frutos rojos", "Semillas de chía"),
    true,
  );
  assert.equal(
    d.matchesSearch("garcia fuerza", "Ana García", "Ganar fuerza y sentirme bien"),
    true,
  );
  assert.equal(
    d.matchesSearch("avena pollo", "Avena con frutos rojos", "Semillas de chía"),
    false,
  );
});
test("search ignores surrounding and repeated whitespace and preserves partial matching", () => {
  assert.equal(
    d.matchesSearch("  gluteo  \t  gob  ", "Sentadilla goblet", "Pierna y glúteo"),
    true,
  );
  assert.equal(d.matchesSearch(" \n\t ", "Cualquier plato"), true);
  assert.equal(d.matchesSearch("", ""), true);
  assert.equal(d.matchesSearch("garcia", ""), false);
});

test("assigning and personalizing an exercise preserves the library and every other client", () => {
  const original = base();
  const result = d.assignExercises(
    original,
    [exercise],
    ["a", "b"],
    2,
    "Mi rutina",
  );
  assert.equal(result.added, 2);
  const a = result.data.clients[0].assignments[0],
    b = result.data.clients[1].assignments[0];
  assert.notEqual(a.id, b.id);
  assert.notEqual(a.id, exercise.id);
  assert.equal(a.sourceId, "squat");
  assert.equal(a.day, 2);
  assert.equal(original.clients[0].assignments.length, 0);
  const changed = d.personalizeExercise(result.data, "a", {
    ...a,
    sets: 5,
    notes: "Solo para a",
  });
  assert.equal(changed.clients[0].assignments[0].sets, 5);
  assert.equal(changed.clients[1].assignments[0].sets, 3);
  assert.equal(changed.exercises[0].notes, "Base");
  assert.equal(result.data.clients[0].assignments[0].sets, 3);
});
test("duplicate assignments are skipped, but another day is an independent assignment", () => {
  const one = d.assignExercises(base(), [exercise], ["a"], 0).data;
  const same = d.assignExercises(one, [exercise], ["a"], 0);
  assert.equal(same.added, 0);
  assert.equal(same.skipped, 1);
  assert.equal(d.assignExercises(one, [exercise], ["a"], 1).added, 1);
});
test("assigning a week fills missing days and preserves the customized copies", () => {
  const monday = d.assignExercises(
    base(), [exercise], ["a"], 0, "Mi rutina",
  ).data;
  const tuned = d.personalizeExercise(monday, "a", {
    ...monday.clients[0].assignments[0],
    sets: 5,
  });
  const result = d.assignExercises(
    tuned, [exercise], ["a", "b"], [0, 2, 4, 2], "Mi rutina",
  );
  const [a, b] = result.data.clients.map((c) => c.assignments);
  assert.equal(result.added, 5);
  assert.equal(result.skipped, 1);
  assert.deepEqual(a.map((e) => e.day), [0, 2, 4]);
  assert.deepEqual(b.map((e) => e.day), [0, 2, 4]);
  assert.deepEqual(a.map((e) => e.sets), [5, 3, 3]);
  assert.equal(new Set([...a, ...b].map((e) => e.id)).size, 6);
  assert.equal(result.data.exercises[0].sets, 3);
});
test("removing one assignment preserves other days, clients, templates and session history", () => {
  let state = d.assignExercises(base(), [exercise], ["a", "b"], [0, 2]).data;
  const first = state.clients[0].assignments[0];
  state = d.personalizeExercise(state, "a", { ...first, sets: 5 });
  state.clients[0].exerciseIds = [exercise.id];
  state.completed[d.completionKey("a", first.id)] = true;
  state.sessionLogs = [log({ exerciseIds: [first.id] })];
  const removed = d.removeAssignedExercise(state, "a", first.id);
  assert.equal(state.clients[0].assignments.length, 2);
  assert.deepEqual(removed.clients[0].assignments.map((e) => e.day), [2]);
  assert.equal(removed.clients[1].assignments.length, 2);
  assert.deepEqual(removed.exercises, state.exercises);
  assert.deepEqual(removed.completed, state.completed);
  assert.deepEqual(removed.sessionLogs, state.sessionLogs);
  const reloaded = d.normalizeData(removed, base());
  assert.equal(reloaded.clients[0].assignments.some((e) => e.id === first.id), false);
  const empty = d.removeAssignedExercise(
    removed,
    "a",
    removed.clients[0].assignments[0].id,
  );
  assert.equal(d.normalizeData(empty, base()).clients[0].assignments.length, 0);
});
test("undo restores the adjusted assignment in its original position only once", () => {
  let state = d.assignExercises(base(), [exercise, { ...exercise, id: "row" }], ["a"], 0).data;
  const first = { ...state.clients[0].assignments[0], sets: 5, notes: "Mi ajuste" };
  state = d.personalizeExercise(state, "a", first);
  const removed = d.removeAssignedExercise(state, "a", first.id);
  const restored = d.restoreAssignedExercise(removed, "a", first, 0);
  assert.deepEqual(restored.clients[0].assignments, state.clients[0].assignments);
  const retried = d.restoreAssignedExercise(restored, "a", first, 0);
  assert.equal(retried.clients[0].assignments.length, 2);
  restored.clients[0].assignments[0].notes = "Nuevo ajuste";
  assert.equal(first.notes, "Mi ajuste");
});
test("saving a routine snapshots distinct adjusted versions in their original order", () => {
  const versions = [
    {
      ...exercise,
      id: "assigned-heavy",
      sourceId: exercise.id,
      sets: 5,
      notes: "Pesado",
      group: "Fuerza",
    },
    {
      ...exercise,
      id: "assigned-light",
      sourceId: exercise.id,
      sets: 2,
      notes: "Ligero",
      group: "Técnica",
    },
  ];
  const original = structuredClone(versions);
  const routine = d.createRoutineTemplate("  Mi día de pierna  ", versions);
  assert.equal(routine.name, "Mi día de pierna");
  assert.deepEqual(routine.exercises.map((e) => e.sets), [5, 2]);
  assert.deepEqual(routine.exercises.map((e) => e.notes), ["Pesado", "Ligero"]);
  assert.equal(
    new Set([...versions, ...routine.exercises].map((e) => e.id)).size,
    4,
  );
  assert.deepEqual(versions, original);
  const assigned = d.assignExercises(
    base(), routine.exercises, ["b"], 2, routine.name,
  );
  assert.equal(assigned.added, 2);
  routine.exercises[0].notes = "Otro ajuste";
  assert.equal(versions[0].notes, "Pesado");
  assert.equal(assigned.data.clients[1].assignments[0].notes, "Pesado");
});
test("a reused client routine preserves its snapshot and each destination's adjustments", () => {
  let state = d.assignExercises(base(), [exercise], ["a"], 0).data;
  const original = state.clients[0].assignments[0];
  state = d.personalizeExercise(state, "a", {
    ...original,
    sets: 5,
    rest: 120,
    notes: "Mi ajuste reutilizable",
  });
  const routine = d.createRoutineTemplate("Pierna adaptada", state.clients[0].assignments);
  state = { ...state, routines: [routine] };
  const reused = d.assignExercises(state, routine.exercises, ["b"], [1, 3], routine.name).data;
  const [tuesday, thursday] = reused.clients[1].assignments;
  const adjusted = d.personalizeExercise(reused, "b", { ...tuesday, sets: 7 });
  assert.equal(adjusted.clients[0].assignments[0].sets, 5);
  assert.equal(adjusted.clients[1].assignments[0].sets, 7);
  assert.equal(adjusted.clients[1].assignments[1].sets, 5);
  assert.equal(thursday.rest, 120);
  assert.equal(thursday.notes, "Mi ajuste reutilizable");
  assert.equal(adjusted.routines[0].exercises[0].sets, 5);
  assert.equal(adjusted.exercises[0].sets, 3);
  assert.notEqual(tuesday.id, thursday.id);
  assert.notEqual(tuesday.id, routine.exercises[0].id);
  assert.deepEqual(d.normalizeData(adjusted, base()).routines, [routine]);
  const repeated = d.assignExercises(adjusted, routine.exercises, ["b"], [1, 3], routine.name);
  assert.equal(repeated.added, 0);
  assert.equal(repeated.skipped, 2);
  assert.equal(repeated.data.clients[1].assignments[0].sets, 7);
});
test("meal ingredients are independent for each client and destination day", () => {
  const state = d.assignMeals(base(), [meal], ["a", "b"], [0, 1]);
  state.clients[0].diets[0][0].ingredients[0].quantity = "90 g";
  assert.equal(state.clients[0].diets[1][0].ingredients[0].quantity, "60 g");
  assert.equal(state.clients[1].diets[0][0].ingredients[0].quantity, "60 g");
  assert.equal(state.mealLibrary[0].ingredients[0].quantity, "60 g");
  assert.notEqual(
    state.clients[0].diets[0][0].id,
    state.clients[1].diets[0][0].id,
  );
});
test("copying a menu appends by default and replaces only when requested", () => {
  const week = {
    0: [structuredClone(meal)],
    1: [{ ...structuredClone(meal), id: "other" }],
  };
  const append = d.copyMenu(week, 0, [0, 1, 2]);
  assert.equal(append[0].length, 1);
  assert.equal(append[1].length, 2);
  assert.equal(append[2].length, 1);
  append[2][0].ingredients[0].quantity = "80 g";
  assert.equal(week[0][0].ingredients[0].quantity, "60 g");
  assert.equal(d.copyMenu(week, 0, [1], true)[1].length, 1);
});
test("migration preserves existing menus and moves legacy completion once", () => {
  const raw = base();
  raw.clients[0].exerciseIds = ["squat"];
  delete raw.clients[0].assignments;
  raw.clients[0].diets = { 4: [structuredClone(meal)] };
  raw.completed = { "a:squat": true };
  delete raw.mealLibrary;
  delete raw.routines;
  delete raw.sessionLogs;
  const state = d.normalizeData(raw, base());
  const ex = state.clients[0].assignments[0];
  assert.equal(state.completed[d.completionKey("a", ex.id)], true);
  assert.equal(state.completed["a:squat"], undefined);
  assert.equal(state.clients[0].diets[4][0].ingredients[0].quantity, "60 g");
  state.completed[d.completionKey("a", ex.id)] = false;
  assert.equal(
    d.normalizeData(state, base()).completed[d.completionKey("a", ex.id)],
    false,
  );
  assert.equal(state.mealLibrary.length, 1);
});
test("completion is scoped to the actual date", () => {
  assert.notEqual(
    d.completionKey("a", "exercise", d.today()),
    d.completionKey("a", "exercise", d.shiftDate(d.today(), -1)),
  );
});
test("session load and validation handle RPE zero, missing input and impossible dates", () => {
  assert.equal(d.trainingLoad(log()), 315);
  assert.deepEqual(d.validateSession(log({ rpe: 0 })), {});
  assert.ok(d.validateSession(log({ rpe: NaN })).rpe);
  assert.ok(d.validateSession(log({ rpe: 11 })).rpe);
  assert.ok(d.validateSession(log({ duration: 0 })).duration);
  assert.ok(d.validateSession(log({ date: d.shiftDate(d.today(), 1) })).date);
  assert.ok(d.validateSession(log({ date: "2026-02-31" })).date);
});
test("editing a check-in replaces the matching session without duplicating its load", () => {
  let state = base();
  state = d.upsertSession(state, log());
  state = d.upsertSession(state, log({ id: "revised", rpe: 8 }));
  assert.equal(state.sessionLogs.length, 1);
  assert.equal(d.trainingLoad(state.sessionLogs[0]), 360);
  state = d.upsertSession(state, log({ id: "another-client", clientId: "b" }));
  assert.equal(state.sessionLogs.length, 2);
});
test("a submitted check-in replaces the demo session for the same client and day", () => {
  const state = base();
  state.sessionLogs = [log({ isDemo: true })];
  const next = d.upsertSession(state, log({ id: "submitted", rpe: 4 }));
  assert.equal(next.sessionLogs.length, 1);
  assert.equal(next.sessionLogs[0].isDemo, false);
  assert.equal(next.sessionLogs[0].rpe, 4);
});
test("daily charts sum multiple sessions and leave missing RPE empty", () => {
  const date = d.today();
  const rows = d.dailyLoads(
    [
      log({ duration: 40, rpe: 6 }),
      log({ id: "second", routineDay: 2, duration: 20, rpe: 8 }),
    ],
    d.shiftDate(date, -1),
    date,
  );
  assert.equal(rows[0].load, 0);
  assert.equal(rows[0].rpe, null);
  assert.equal(rows[1].load, 400);
  assert.equal(rows[1].duration, 60);
  assert.equal(rows[1].sessions, 2);
  assert.ok(Math.abs(rows[1].rpe - 400 / 60) < 0.00001);
});
test("CSV keeps notes and protects spreadsheet formulas", () => {
  const csv = d.csvSessions(
    [log({ notes: '=HYPERLINK("x")\nNotas' })],
    client("a"),
  );
  assert.ok(csv.startsWith("\uFEFF"));
  assert.ok(csv.includes("'=HYPERLINK"));
  assert.ok(csv.includes("315"));
  assert.ok(csv.includes('""x""'));
});
