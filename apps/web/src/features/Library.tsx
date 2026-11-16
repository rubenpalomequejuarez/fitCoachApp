import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Check,
  Copy,
  Dumbbell,
  Flame,
  Leaf,
  PenLine,
  Plus,
  Search,
  Send,
  Users,
  Utensils,
  X,
} from "lucide-react";
import {
  Avatar,
  Back,
  Button,
  EmptyState,
  Field,
  Modal,
  PageTitle,
  SearchField,
} from "../components/ui";
import { MealEditorCard } from "../components/MealEditorCard";
import { DAYS, FULL_DAYS, MEAL_TYPES } from "../data";
import {
  assignExercises,
  assignMeals,
  cloneMeal,
  createRoutineTemplate,
  mealErrors,
  newId,
  matchesSearch,
} from "../domain";
import { useStore } from "../store";
import type { Exercise, Meal, RoutineTemplate } from "../types";

export function LibraryTabs({
  active,
  onChange,
  kind = "exercise",
}: {
  active: string;
  onChange: (key: string) => void;
  kind?: "exercise" | "meal";
}) {
  const items =
    kind === "exercise"
      ? [
          ["exercises", "Ejercicios"],
          ["routines", "Mis rutinas"],
        ]
      : [
          ["plans", "Planes de clientes"],
          ["meals", "Biblioteca de platos"],
        ];
  return (
    <div
      className="library-tabs"
      role="tablist"
      aria-label={
        kind === "exercise"
          ? "Biblioteca de entrenamiento"
          : "Biblioteca de alimentación"
      }
    >
      {items.map(([key, label]) => (
        <button
          type="button"
          role="tab"
          aria-selected={active === key}
          className={active === key ? "active" : ""}
          key={key}
          onClick={() => onChange(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
export function DayChoices({
  selected,
  onChange,
  exclude,
}: {
  selected: number[];
  onChange: (days: number[]) => void;
  exclude?: number;
}) {
  const availableDays = DAYS.map((_, i) => i).filter((i) => i !== exclude);
  const allSelected = availableDays.every((day) => selected.includes(day));
  return (
    <>
      <div className="day-choices" role="group" aria-label="Elegir días">
        {DAYS.map((d, i) => (
          <button
            type="button"
            key={d}
            disabled={i === exclude}
            aria-label={FULL_DAYS[i]}
            aria-pressed={selected.includes(i)}
            className={selected.includes(i) ? "selected" : ""}
            onClick={() =>
              onChange(
                selected.includes(i)
                  ? selected.filter((x) => x !== i)
                  : [...selected, i],
              )
            }
          >
            {d}
            {selected.includes(i) && <Check size={12} />}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="text-link"
        onClick={() => onChange(allSelected ? [] : availableDays)}
      >
        {allSelected
          ? "Quitar selección de días"
          : exclude === undefined
            ? "Seleccionar toda la semana"
            : "Seleccionar el resto de la semana"}
      </button>
    </>
  );
}
export function AssignmentDialog({
  exerciseItems,
  mealItems,
  initialClientId,
  routineName,
  onClose,
  onAssigned,
  saveToLibrary = false,
}: {
  exerciseItems?: Exercise[];
  mealItems?: Meal[];
  initialClientId?: string;
  routineName?: string;
  onClose: () => void;
  onAssigned: () => void;
  saveToLibrary?: boolean;
}) {
  const { data, setData, notify } = useStore();
  const [clients, setClients] = useState(
    initialClientId ? [initialClientId] : [],
  );
  const [search, setSearch] = useState("");
  const [days, setDays] = useState<number[]>([exerciseItems?.[0]?.day ?? 0]);
  const [group, setGroup] = useState(routineName || "");
  const [error, setError] = useState("");
  const isExercise = !!exerciseItems;
  const count = exerciseItems?.length || mealItems?.length || 0;
  const visibleClients = data.clients.filter((c) =>
    matchesSearch(search, c.name),
  );
  const visibleIds = visibleClients.map((c) => c.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => clients.includes(id));
  const hiddenSelected = clients.filter((id) => !visibleIds.includes(id)).length;

  function toggleVisibleClients() {
    setClients((selected) =>
      allVisibleSelected
        ? selected.filter((id) => !visibleIds.includes(id))
        : [...new Set([...selected, ...visibleIds])],
    );
    setError("");
  }

  function save() {
    if (!clients.length || !days.length || !count) return;
    let next = data;
    if (exerciseItems) {
      if (saveToLibrary)
        next = {
          ...next,
          exercises: [
            ...next.exercises.filter(
              (e) => !exerciseItems.some((x) => x.id === e.id),
            ),
            ...structuredClone(exerciseItems),
          ],
        };
      const result = assignExercises(
        next,
        exerciseItems,
        clients,
        days,
        group,
      );
      if (!result.added) {
        setError(
          "Estos ejercicios ya figuran en los planes elegidos. Prueba otros días o cambia el nombre de la rutina.",
        );
        return;
      }
      setData(result.data);
      notify(
        `${result.added} ${result.added === 1 ? "ejercicio asignado" : "ejercicios asignados"}${result.skipped ? ` · ${result.skipped} ya estaban en el plan` : ""}.`,
      );
    } else {
      setData(assignMeals(next, mealItems || [], clients, days));
      notify(
        `${count} ${count === 1 ? "plato añadido" : "platos añadidos"} a ${clients.length} ${clients.length === 1 ? "cliente" : "clientes"} · ${days.length} ${days.length === 1 ? "día" : "días"}.`,
      );
    }
    onAssigned();
  }
  return (
    <Modal
      title={isExercise ? "Asignar entrenamiento" : "Añadir platos al plan"}
      onClose={onClose}
      footer={
        <Button
          variant="accent"
          disabled={!clients.length || !days.length || !count}
          onClick={save}
          icon={<Send size={17} />}
        >
          Asignar a {clients.length || ""}{" "}
          {clients.length === 1 ? "cliente" : "clientes"}
        </Button>
      }
    >
      <div className="selection-summary">
        <span>
          {isExercise ? <Dumbbell size={19} /> : <Utensils size={19} />}
        </span>
        <div>
          <strong>
            {count}{" "}
            {isExercise
              ? count === 1
                ? "ejercicio seleccionado"
                : "ejercicios seleccionados"
              : count === 1
                ? "plato seleccionado"
                : "platos seleccionados"}
          </strong>
          <p>Podrás adaptar cada copia desde la ficha del cliente.</p>
        </div>
      </div>
      <div className="field">
        <label>
          {isExercise
            ? "Días de entrenamiento"
            : "Días a los que añadir los platos"}
        </label>
        <DayChoices
          selected={days}
          onChange={(nextDays) => {
            setDays(nextDays);
            setError("");
          }}
        />
        <p className="form-hint" aria-live="polite">
          {days.length
            ? `${days.length} ${days.length === 1 ? "día seleccionado" : "días seleccionados"}. Cada día recibe su propia copia.`
            : "Selecciona al menos un día."}
        </p>
      </div>
      {isExercise && (
        <Field
          label="Nombre de la rutina (opcional)"
          placeholder="Mantener el grupo de cada ejercicio"
          value={group}
          onChange={(e) => {
            setGroup(e.target.value);
            setError("");
          }}
        />
      )}
      <SearchField
        value={search}
        onChange={setSearch}
        placeholder="Buscar clientes"
      />
      <div className="select-all">
        <button
          type="button"
          disabled={!visibleClients.length}
          onClick={toggleVisibleClients}
        >
          {allVisibleSelected ? "Quitar visibles" : "Seleccionar visibles"}
        </button>
        <span aria-live="polite">
          {clients.length} {clients.length === 1 ? "seleccionado" : "seleccionados"}
          {hiddenSelected > 0 && ` · ${hiddenSelected} fuera del filtro`}
        </span>
      </div>
      <div className="client-selector">
        {!visibleClients.length && (
          <p className="form-hint">No hay clientes que coincidan con la búsqueda.</p>
        )}
        {visibleClients.map((c) => (
          <label key={c.id}>
            <input
              type="checkbox"
              checked={clients.includes(c.id)}
              onChange={() => {
                setClients((selected) =>
                  selected.includes(c.id)
                    ? selected.filter((id) => id !== c.id)
                    : [...selected, c.id],
                );
                setError("");
              }}
            />
            <Avatar client={c} />
            <span>
              <strong>{c.name}</strong>
              <small>{c.goal}</small>
            </span>
            <span className="selection-check">
              {clients.includes(c.id) && <Check size={16} />}
            </span>
          </label>
        ))}
      </div>
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
      <p className="form-hint">
        {isExercise
          ? "Las asignaciones guardan sus propias series, repeticiones y notas."
          : "Cada menú recibe una copia independiente, incluidas cantidades y receta."}
      </p>
    </Modal>
  );
}
export function SaveRoutineDialog({
  exercises,
  initialName = "",
  onClose,
  onSaved,
}: {
  exercises: Exercise[];
  initialName?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { setData, notify } = useStore();
  const [name, setName] = useState(initialName);
  const [error, setError] = useState("");

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim().length < 2) {
      setError("Pon un nombre a esta rutina.");
      event.currentTarget.querySelector("input")?.focus();
      return;
    }
    if (!exercises.length) return;
    const routine = createRoutineTemplate(name, exercises);
    setData((data) => ({ ...data, routines: [...data.routines, routine] }));
    notify("Rutina guardada en Mis rutinas. Ya puedes volver a asignarla.");
    onSaved();
  }

  return (
    <Modal title="Una rutina para reutilizar" onClose={onClose}>
      <p>
        {exercises.length} {exercises.length === 1 ? "ejercicio" : "ejercicios"}.
        Se guardan sus series, repeticiones, descansos y notas. Al asignarla,
        cada cliente recibirá su propia copia.
      </p>
      <form onSubmit={save} noValidate>
        <Field
          label="Nombre de la rutina"
          placeholder="Ej. Fuerza de cuerpo completo"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setError("");
          }}
          error={error}
        />
        <ul className="routine-save-preview" aria-label="Ejercicios de la rutina">
          {exercises.map((exercise) => (
            <li key={exercise.id}>
              <strong>{exercise.name}</strong>
              <span>
                {exercise.sets} × {exercise.reps} · {exercise.rest} s descanso
              </span>
              {exercise.notes && <small>{exercise.notes}</small>}
            </li>
          ))}
        </ul>
        <Button
          type="submit"
          disabled={!exercises.length}
          icon={<BookOpen size={16} />}
        >
          Guardar rutina
        </Button>
      </form>
    </Modal>
  );
}
export function ExerciseCatalogue({
  onCreate,
  onExercise,
  initialClientId,
  onAssigned,
  onBack,
}: {
  onCreate: (exercise?: Exercise) => void;
  onExercise: (exercise: Exercise) => void;
  initialClientId?: string;
  onAssigned?: () => void;
  onBack?: () => void;
}) {
  const { data } = useStore();
  const [tab, setTab] = useState("exercises");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [selected, setSelected] = useState<string[]>([]);
  const [assign, setAssign] = useState<Exercise[] | null>(null);
  const [routine, setRoutine] = useState<RoutineTemplate | null>(null);
  const [saveRoutine, setSaveRoutine] = useState(false);
  const groups = ["Todos", ...new Set(data.exercises.map((e) => e.group))];
  const chosen = data.exercises.filter((e) => selected.includes(e.id));
  const list = data.exercises.filter(
    (e) =>
      matchesSearch(search, e.name, e.group) &&
      (filter === "Todos" || e.group === filter),
  );
  const target = data.clients.find((c) => c.id === initialClientId);
  function changeTab(nextTab: string) {
    if (nextTab === tab) return;
    setTab(nextTab);
    setSearch("");
  }
  return (
    <>
      {onBack && <Back onClick={onBack} label="Volver al cliente" />}
      <PageTitle
        eyebrow={
          target
            ? `PREPARANDO EL PLAN DE ${target.name.split(" ")[0].toUpperCase()}`
            : "TU BIBLIOTECA DE MOVIMIENTO"
        }
        title={
          <>
            Prepara una vez.
            <br />
            Acompaña a tu manera<span className="olive-dot">.</span>
          </>
        }
        subtitle="Selecciona, asigna y adapta cada entrenamiento."
        action={
          <Button onClick={() => onCreate()} icon={<Plus size={18} />}>
            Crear ejercicio
          </Button>
        }
      />
      <LibraryTabs active={tab} onChange={changeTab} />
      <div className="library-toolbar">
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder={
            tab === "exercises" ? "Buscar ejercicio o grupo" : "Buscar rutina"
          }
        />
        {tab === "exercises" && (
          <div className="filter-chips">
            {groups.map((g) => (
              <button
                type="button"
                key={g}
                className={filter === g ? "active" : ""}
                onClick={() => setFilter(g)}
              >
                {g}
              </button>
            ))}
          </div>
        )}
      </div>
      {tab === "exercises" ? (
        <>
          <div className="catalogue-guidance">
            <Check size={15} />
            <span>
              Marca varios ejercicios para asignarlos juntos o guardarlos como
              rutina.
            </span>
            <button
              type="button"
              onClick={() =>
                setSelected(
                  list.every((e) => selected.includes(e.id))
                    ? selected.filter((id) => !list.some((e) => e.id === id))
                    : [...new Set([...selected, ...list.map((e) => e.id)])],
                )
              }
            >
              {list.length && list.every((e) => selected.includes(e.id))
                ? "Quitar visibles"
                : "Seleccionar visibles"}
            </button>
          </div>
          <div className="exercise-library-grid">
            {list.map((e) => (
              <article
                className={`catalogue-exercise ${selected.includes(e.id) ? "chosen" : ""}`}
                key={e.id}
              >
                <label className="catalogue-checkbox">
                  <input
                    type="checkbox"
                    aria-label={`Seleccionar ${e.name}`}
                    checked={selected.includes(e.id)}
                    onChange={() =>
                      setSelected((a) =>
                        a.includes(e.id)
                          ? a.filter((id) => id !== e.id)
                          : [...a, e.id],
                      )
                    }
                  />
                  <span>{selected.includes(e.id) && <Check size={14} />}</span>
                </label>
                <button
                  type="button"
                  className="catalogue-preview"
                  onClick={() => onExercise(e)}
                >
                  <div className="library-exercise-image">
                    <img
                      src={
                        e.image.startsWith("data:")
                          ? e.image
                          : `/assets/${e.image}`
                      }
                      alt=""
                    />
                  </div>
                  <div className="library-exercise-text">
                    <span className="eyebrow">{e.group}</span>
                    <h3>{e.name}</h3>
                    <p>
                      {e.sets} × {e.reps}
                      <span>·</span>
                      {e.rest} s descanso
                    </p>
                  </div>
                </button>
                <div className="catalogue-actions">
                  <button type="button" onClick={() => onCreate(e)}>
                    <PenLine size={14} />
                    Editar original
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRoutine(null);
                      setAssign([e]);
                    }}
                  >
                    <Plus size={14} />
                    Asignar
                  </button>
                </div>
              </article>
            ))}
          </div>
          {!list.length && (
            <EmptyState
              type="exercise"
              title="No encontramos ese ejercicio"
              description="Prueba otra búsqueda o añade uno a tu biblioteca."
              action={
                <Button variant="secondary" onClick={() => onCreate()}>
                  Crear ejercicio
                </Button>
              }
            />
          )}
        </>
      ) : (
        <div className="routine-library-grid">
          {data.routines
            .filter((r) => matchesSearch(search, r.name))
            .map((r) => (
              <article className="routine-template" key={r.id}>
                <span className="routine-template-icon">
                  <Dumbbell size={26} />
                </span>
                <span className="eyebrow">RUTINA GUARDADA</span>
                <h2>{r.name}</h2>
                <p>{r.exercises.length} ejercicios listos para personalizar</p>
                <ul>
                  {r.exercises.map((e) => (
                    <li key={e.id}>
                      {e.name}
                      <span>
                        {e.sets} × {e.reps}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setRoutine(r);
                    setAssign(r.exercises);
                  }}
                  icon={<Users size={16} />}
                >
                  Asignar rutina
                </Button>
              </article>
            ))}
        </div>
      )}
      {chosen.length > 0 && tab === "exercises" && (
        <div className="selection-bar">
          <div>
            <strong>{chosen.length} seleccionados</strong>
            <button type="button" onClick={() => setSelected([])}>
              Limpiar
            </button>
          </div>
          <Button
            variant="secondary"
            onClick={() => setSaveRoutine(true)}
            icon={<BookOpen size={16} />}
          >
            Guardar rutina
          </Button>
          <Button
            variant="accent"
            onClick={() => {
              setRoutine(null);
              setAssign(chosen);
            }}
            icon={<Users size={16} />}
          >
            Asignar selección
          </Button>
        </div>
      )}
      {assign && (
        <AssignmentDialog
          exerciseItems={assign}
          routineName={routine?.name}
          initialClientId={initialClientId}
          onClose={() => setAssign(null)}
          onAssigned={() => {
            setAssign(null);
            setSelected([]);
            onAssigned?.();
          }}
        />
      )}
      {saveRoutine && (
        <SaveRoutineDialog
          exercises={chosen}
          onClose={() => setSaveRoutine(false)}
          onSaved={() => {
            setSaveRoutine(false);
            changeTab("routines");
          }}
        />
      )}
    </>
  );
}
const blankDish = (): Meal => ({
  id: newId(),
  type: "Desayuno",
  name: "",
  kcal: 0,
  summary: "",
  image: "oats.jpg",
  ingredients: [{ name: "", quantity: "" }],
  recipe: "",
  notes: "",
});
function DishForm({
  meal,
  duplicate = false,
  onClose,
}: {
  meal?: Meal;
  duplicate?: boolean;
  onClose: () => void;
}) {
  const { setData, notify } = useStore();
  const isEditing = !!meal && !duplicate;
  const [draft, setDraft] = useState(() =>
    duplicate && meal
      ? { ...cloneMeal(meal), sourceId: undefined, name: `${meal.name} (copia)` }
      : structuredClone(meal || blankDish()),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  function save(e: React.FormEvent) {
    e.preventDefault();
    const er = mealErrors(draft);
    setErrors(er);
    if (Object.keys(er).length) return;
    const item = {
      ...draft,
      summary: draft.ingredients.map((i) => i.name).join(" · "),
    };
    setData((d) => ({
      ...d,
      mealLibrary: isEditing
        ? d.mealLibrary.map((m) => (m.id === meal.id ? item : m))
        : [...d.mealLibrary, item],
    }));
    notify(
      isEditing
        ? "Plato actualizado en la biblioteca. Los menús asignados conservan sus adaptaciones."
        : "Plato guardado en tu biblioteca.",
    );
    onClose();
  }
  return (
    <Modal
      title={
        duplicate
          ? "Duplicar plato"
          : isEditing
            ? "Editar plato de biblioteca"
            : "Un plato para volver a disfrutar"
      }
      onClose={onClose}
    >
      <p>
        {duplicate && meal
          ? `Adapta esta copia de ${meal.name} y guárdala como otra receta de tu biblioteca.`
          : "Guarda la receta base. Podrás ajustar cada ración en el plan de cada cliente."}
      </p>
      <form onSubmit={save} noValidate>
        <MealEditorCard
          meal={draft}
          onChange={(patch) => setDraft((m) => ({ ...m, ...patch }))}
          errors={errors}
        />
        <Button type="submit" icon={<BookOpen size={17} />}>
          {duplicate ? "Guardar copia" : "Guardar en biblioteca"}
        </Button>
      </form>
    </Modal>
  );
}
export function MealLibrary({
  onBack,
  onPlans,
}: {
  onBack: () => void;
  onPlans: () => void;
}) {
  const { data } = useStore();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("Todos");
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<{ meal?: Meal; duplicate?: boolean }>();
  const [assign, setAssign] = useState<Meal[] | null>(null);
  const list = data.mealLibrary.filter(
    (m) =>
      matchesSearch(search, m.name, ...m.ingredients.map((i) => i.name)) &&
      (type === "Todos" || type === m.type),
  );
  const chosen = data.mealLibrary.filter((m) => selected.includes(m.id));
  return (
    <>
      <PageTitle
        eyebrow="TU RECETARIO PERSONAL"
        title={
          <>
            Tus platos.
            <br />
            Mil formas de cuidarse<span className="olive-dot">.</span>
          </>
        }
        subtitle="Recetas reutilizables y raciones adaptadas a cada persona."
        action={
          <Button onClick={() => setEditing({})} icon={<Plus size={18} />}>
            Crear plato
          </Button>
        }
      />
      <LibraryTabs kind="meal" active="meals" onChange={onPlans} />
      <div className="library-toolbar">
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Buscar plato o alimento"
        />
        <div className="filter-chips">
          {["Todos", ...MEAL_TYPES].map((t) => (
            <button
              key={t}
              type="button"
              className={type === t ? "active" : ""}
              onClick={() => setType(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="meal-library-grid">
        {list.map((m) => (
          <article
            className={`dish-card ${selected.includes(m.id) ? "chosen" : ""}`}
            key={m.id}
          >
            <label className="catalogue-checkbox">
              <input
                type="checkbox"
                aria-label={`Seleccionar ${m.name}`}
                checked={selected.includes(m.id)}
                onChange={() =>
                  setSelected((a) =>
                    a.includes(m.id)
                      ? a.filter((id) => id !== m.id)
                      : [...a, m.id],
                  )
                }
              />
              <span>{selected.includes(m.id) && <Check size={14} />}</span>
            </label>
            <img src={`/assets/${m.image}`} alt="" loading="lazy" />
            <div className="dish-card-content">
              <div>
                <span className="eyebrow">{m.type}</span>
                {m.kcal > 0 && (
                  <span>
                    <Flame size={12} />
                    {m.kcal} kcal
                  </span>
                )}
              </div>
              <h3>{m.name}</h3>
              <p>{m.ingredients.map((i) => i.name).join(" · ")}</p>
            </div>
            <div className="catalogue-actions">
              <button type="button" onClick={() => setEditing({ meal: m })}>
                <PenLine size={14} />
                Editar receta
              </button>
              <button type="button" onClick={() => setAssign([m])}>
                <Plus size={14} />
                Asignar
              </button>
              <button
                type="button"
                className="duplicate-dish"
                aria-label={`Duplicar ${m.name}`}
                onClick={() => setEditing({ meal: m, duplicate: true })}
              >
                <Copy size={14} />
                Duplicar plato
              </button>
            </div>
          </article>
        ))}
      </div>
      {!list.length && (
        <EmptyState
          type="diet"
          title="Aquí cabe una nueva receta"
          description="Prueba otra búsqueda o crea tu primer plato."
          action={
            <Button variant="secondary" onClick={() => setEditing({})}>
              Crear plato
            </Button>
          }
        />
      )}
      <div className="gentle-footer">
        <Leaf size={17} />
        Las cantidades se adaptan en el menú de cada cliente.
      </div>
      {chosen.length > 0 && (
        <div className="selection-bar">
          <div>
            <strong>{chosen.length} platos</strong>
            <button type="button" onClick={() => setSelected([])}>
              Limpiar selección
            </button>
          </div>
          <Button
            variant="accent"
            onClick={() => setAssign(chosen)}
            icon={<Send size={16} />}
          >
            Asignar platos
          </Button>
        </div>
      )}
      {editing !== undefined && (
        <DishForm
          key={`${editing.meal?.id || "new"}-${editing.duplicate ? "copy" : "edit"}`}
          meal={editing.meal}
          duplicate={editing.duplicate}
          onClose={() => setEditing(undefined)}
        />
      )}{" "}
      {assign && (
        <AssignmentDialog
          mealItems={assign}
          onClose={() => setAssign(null)}
          onAssigned={() => {
            setAssign(null);
            setSelected([]);
          }}
        />
      )}
    </>
  );
}
export function MealPicker({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick: (meals: Meal[]) => void;
}) {
  const { data } = useStore();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("Todos");
  const [selected, setSelected] = useState<string[]>([]);
  const list = data.mealLibrary.filter(
    (m) =>
      matchesSearch(search, m.name, ...m.ingredients.map((i) => i.name)) &&
      (type === "Todos" || type === m.type),
  );
  return (
    <Modal
      title="Añadir desde mi biblioteca"
      onClose={onClose}
      footer={
        <Button
          variant="accent"
          disabled={!selected.length}
          onClick={() =>
            onPick(
              data.mealLibrary
                .filter((m) => selected.includes(m.id))
                .map(cloneMeal),
            )
          }
          icon={<Plus size={17} />}
        >
          Añadir {selected.length || ""}{" "}
          {selected.length === 1 ? "plato" : "platos"}
        </Button>
      }
    >
      <SearchField
        placeholder="Buscar plato o alimento"
        value={search}
        onChange={setSearch}
      />
      <div className="filter-chips picker-filters">
        {["Todos", ...MEAL_TYPES].map((t) => (
          <button
            key={t}
            type="button"
            className={type === t ? "active" : ""}
            onClick={() => setType(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="dish-picker">
        {list.map((m) => (
          <label
            key={m.id}
            className={selected.includes(m.id) ? "selected" : ""}
          >
            <input
              type="checkbox"
              aria-label={`Elegir ${m.name}`}
              checked={selected.includes(m.id)}
              onChange={() =>
                setSelected((a) =>
                  a.includes(m.id)
                    ? a.filter((id) => id !== m.id)
                    : [...a, m.id],
                )
              }
            />
            <img src={`/assets/${m.image}`} alt="" />
            <span>
              <small>{m.type}</small>
              <strong>{m.name}</strong>
              <small>
                {m.kcal ? `${m.kcal} kcal · ` : ""}
                {m.ingredients.length} alimentos
              </small>
            </span>
            <span className="selection-check">
              {selected.includes(m.id) && <Check size={15} />}
            </span>
          </label>
        ))}
      </div>
      {!list.length && (
        <p className="form-hint">No encontramos platos con esa búsqueda.</p>
      )}
      <p className="form-hint">
        Después de añadirlos, podrás cambiar alimentos, cantidades y notas solo
        para este cliente.
      </p>
    </Modal>
  );
}
