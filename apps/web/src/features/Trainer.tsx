import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowRight,
  ChevronRight,
  Plus,
  Search,
  Users,
  Dumbbell,
  Utensils,
  PenLine,
  Leaf,
  Link,
  ImagePlus,
  Check,
  Trash2,
  Send,
  Play,
  UserRound,
  Clock,
  BookOpen,
  Copy,
  AlertCircle,
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
  TextArea,
} from "../components/ui";
import { DayStrip, ExerciseCard } from "./Client";
import {
  DAYS,
  FULL_DAYS,
  MEAL_TYPES,
  youtubeId,
  meals as seedMeals,
} from "../data";
import { useStore } from "../store";
import { BarChart3, BookMarked } from "lucide-react";
import {
  AssignmentDialog,
  LibraryTabs,
  MealPicker,
  DayChoices,
  SaveRoutineDialog,
} from "./Library";
import { MealEditorCard } from "../components/MealEditorCard";
import {
  newId,
  assignedExercises,
  personalizeExercise,
  cloneMeal,
  copyMenu,
  mealErrors,
  matchesSearch,
  removeAssignedExercise,
  restoreAssignedExercise,
} from "../domain";
import type { Client, Exercise, Meal } from "../types";
export function ClientsView({ onClient }: { onClient: (id: string) => void }) {
  const { data, setData, notify } = useStore();
  const [search, setSearch] = useState("");
  const [add, setAdd] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [goal, setGoal] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const filtered = data.clients.filter((c) =>
    matchesSearch(search, c.name, c.goal),
  );
  function save(e: FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (name.trim().length < 2) err.name = "Añade el nombre del cliente.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      err.email = "Escribe un email válido.";
    else if (
      data.clients.some((c) => c.email.toLowerCase() === email.toLowerCase())
    )
      err.email = "Ya hay un cliente con este email.";
    if (!goal.trim()) err.goal = "Indica el objetivo de tu cliente.";
    setErrors(err);
    if (Object.keys(err).length) return;
    const id = newId();
    setData((d) => ({
      ...d,
      clients: [
        ...d.clients,
        {
          id,
          name: name.trim(),
          email: email.trim(),
          goal: goal.trim(),
          initials: name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((n) => n[0])
            .join("")
            .toUpperCase(),
          tone: "olive",
          joined: "Nuevo cliente",
          diets: {},
          exerciseIds: [],
        },
      ],
    }));
    setAdd(false);
    setName("");
    setEmail("");
    setGoal("");
    notify("Cliente añadido. Ya puedes preparar su plan.");
    onClient(id);
  }
  return (
    <>
      <PageTitle
        eyebrow="ACOMPAÑAR ES HACER EQUIPO"
        title={
          <>
            Pequeños pasos.
            <br />
            Grandes progresos<span className="olive-dot">.</span>
          </>
        }
        subtitle="Un espacio para acompañar a cada persona."
        action={
          <Button onClick={() => setAdd(true)} icon={<Plus size={18} />}>
            Añadir cliente
          </Button>
        }
      />
      <div className="trainer-stats">
        <div>
          <span className="stats-icon">
            <Users size={20} />
          </span>
          <div>
            <strong>{data.clients.length}</strong>
            <span>Clientes contigo</span>
          </div>
        </div>
        <div>
          <span className="stats-icon">
            <Dumbbell size={20} />
          </span>
          <div>
            <strong>
              {data.clients.filter((c) => assignedExercises(c).length).length}
            </strong>
            <span>Con rutina asignada</span>
          </div>
        </div>
        <div>
          <span className="stats-icon clay">
            <Utensils size={20} />
          </span>
          <div>
            <strong>
              {
                data.clients.filter((c) =>
                  Object.values(c.diets).some((m) => m.length),
                ).length
              }
            </strong>
            <span>Con plan de alimentación</span>
          </div>
        </div>
      </div>
      <div className="list-toolbar">
        <h2>
          Tus clientes{" "}
          <span className="count-badge">{data.clients.length}</span>
        </h2>
        <SearchField
          placeholder="Buscar cliente u objetivo"
          value={search}
          onChange={setSearch}
        />
      </div>
      <div className="clients-grid">
        {filtered.map((c) => (
          <button
            className="client-card"
            key={c.id}
            onClick={() => onClient(c.id)}
          >
            <div className="client-card-top">
              <Avatar client={c} size="lg" />
              <ChevronRight size={20} />
            </div>
            <h3>{c.name}</h3>
            <p>{c.goal}</p>
            <div className="client-card-bottom">
              <span
                className={`status-dot ${assignedExercises(c).length ? "" : "pending"}`}
              />
              {assignedExercises(c).length ? "Plan en marcha" : "Por preparar"}
              <span>
                {c.joined === "Nuevo cliente"
                  ? "Nuevo"
                  : c.joined.replace("Desde ", "")}
              </span>
            </div>
          </button>
        ))}
      </div>
      {!filtered.length && (
        <EmptyState
          type="clients"
          title="No encontramos coincidencias"
          description="Prueba con otro nombre o añade tu primer cliente."
          action={
            <Button variant="secondary" onClick={() => setSearch("")}>
              Limpiar búsqueda
            </Button>
          }
        />
      )}
      <div className="trainer-tip">
        <Leaf size={28} strokeWidth={1.2} />
        <div>
          <h3>Cada persona tiene su propio ritmo.</h3>
          <p>
            Entra en su ficha para adaptar la alimentación y el entrenamiento.
          </p>
        </div>
      </div>
      {add && (
        <Modal title="Un nuevo comienzo" onClose={() => setAdd(false)}>
          <p>Añade a tu cliente y empieza a construir su plan.</p>
          <form onSubmit={save} noValidate>
            <Field
              label="Nombre y apellidos"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              placeholder="Ej. Laura Sánchez"
            />
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              placeholder="cliente@email.com"
            />
            <Field
              label="Objetivo"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              error={errors.goal}
              placeholder="Ej. Ganar fuerza y mejorar mis hábitos"
            />
            <Button type="submit" icon={<Plus size={18} />}>
              Añadir cliente
            </Button>
            <p className="form-hint">
              Se añade a esta demo; no se envía ninguna invitación.
            </p>
          </form>
        </Modal>
      )}
    </>
  );
}
export function ClientProfile({
  client,
  onBack,
  onExerciseEdit,
  onDietEdit,
  onExercise,
  onProgress,
}: {
  client: Client;
  onBack: () => void;
  onExerciseEdit: (e?: Exercise) => void;
  onDietEdit: () => void;
  onProgress: () => void;
  onExercise: (e: Exercise) => void;
}) {
  const { setData } = useStore();
  const [removed, setRemoved] = useState<{
    clientId: string;
    exercise: Exercise;
    index: number;
  } | null>(null);
  const [focusTarget, setFocusTarget] = useState("");
  const [routineDay, setRoutineDay] = useState<number | null>(null);
  const list = assignedExercises(client);
  const lastRemoved =
    removed &&
    removed.clientId === client.id &&
    !list.some((e) => e.id === removed.exercise.id)
      ? removed
      : null;
  const displayList = [...list];
  if (lastRemoved) displayList.splice(lastRemoved.index, 0, lastRemoved.exercise);
  const days = Object.values(client.diets).filter((m) => m.length).length;
  useEffect(() => {
    if (focusTarget) {
      document.getElementById(focusTarget)?.focus({ preventScroll: true });
    }
  }, [focusTarget]);

  function removeExercise(exercise: Exercise) {
    setRemoved({
      clientId: client.id,
      exercise: structuredClone(exercise),
      index: list.findIndex((e) => e.id === exercise.id),
    });
    setData((data) => removeAssignedExercise(data, client.id, exercise.id));
    setFocusTarget(`undo-${exercise.id}`);
  }

  function undoRemoval() {
    if (!lastRemoved) return;
    const { clientId, exercise, index } = lastRemoved;
    setData((data) => restoreAssignedExercise(data, clientId, exercise, index));
    setRemoved(null);
    setFocusTarget(`remove-${exercise.id}`);
  }
  return (
    <>
      <Back onClick={onBack} label="Todos los clientes" />
      <div className="client-profile-header">
        <Avatar client={client} size="lg" />
        <div>
          <span className="eyebrow">UN PLAN A SU MEDIDA</span>
          <h1>{client.name}</h1>
          <p>{client.email}</p>
        </div>
        <span className="chip">
          <Leaf size={13} />
          {client.joined}
        </span>
      </div>
      <div className="goal-banner">
        <span>
          <UserRound size={19} />
        </span>
        <div>
          <small>SU OBJETIVO</small>
          <strong>{client.goal}</strong>
        </div>
      </div>
      <button
        type="button"
        className="client-progress-link"
        onClick={onProgress}
      >
        <span>
          <BarChart3 size={23} />
        </span>
        <div>
          <strong>Progreso y esfuerzo</strong>
          <small>Sesiones, RPE y evolución de la carga</small>
        </div>
        <ArrowRight size={19} />
      </button>
      <div className="profile-sections">
        <section className="profile-section">
          <div className="profile-section-heading">
            <h2>
              <Dumbbell size={20} />
              Ejercicios asignados
            </h2>
            <Button
              variant="ghost"
              onClick={() => onExerciseEdit()}
              icon={<PenLine size={16} />}
            >
              Editar
            </Button>
          </div>
          {displayList.length ? (
            <>
              {FULL_DAYS.map((day, dayIndex) => {
                const exercises = displayList.filter((e) => e.day === dayIndex);
                return exercises.length ? (
                  <div className="assigned-day-group" key={day}>
                    <div className="assigned-day-heading">
                      <h3 className="assigned-day-title">{day}</h3>
                      {list.some((exercise) => exercise.day === dayIndex) && (
                        <button
                          type="button"
                          className="text-link"
                          aria-label={`Guardar ejercicios del ${day.toLowerCase()} como rutina`}
                          onClick={() => setRoutineDay(dayIndex)}
                        >
                          <BookMarked size={14} />
                          Guardar día como rutina
                        </button>
                      )}
                    </div>
                    {exercises.map((e) =>
                      lastRemoved?.exercise.id === e.id ? (
                        <div className="assignment-undo" key={e.id} role="status">
                          <div>
                            <strong>{e.name}</strong>
                            <p>Retirado del plan de {client.name.split(" ")[0]}.</p>
                          </div>
                          <button
                            id={`undo-${e.id}`}
                            type="button"
                            className="text-link"
                            aria-label={`Deshacer retirada de ${e.name}`}
                            onClick={undoRemoval}
                          >
                            Deshacer
                          </button>
                        </div>
                      ) : (
                        <div className="assigned-exercise-row" key={e.id}>
                          <ExerciseCard
                            exercise={e}
                            onClick={() => onExercise(e)}
                          />
                          <div className="assigned-exercise-actions">
                            <button
                              type="button"
                              className="text-link"
                              onClick={() => onExerciseEdit(e)}
                            >
                              <PenLine size={14} />
                              Ajustar solo para {client.name.split(" ")[0]}
                            </button>
                            <button
                              id={`remove-${e.id}`}
                              type="button"
                              className="text-link"
                              aria-label={`Quitar ${e.name} del ${day.toLowerCase()} de ${client.name}`}
                              onClick={() => removeExercise(e)}
                            >
                              <Trash2 size={14} />
                              Quitar del plan
                            </button>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                ) : null;
              })}
              <Button
                variant="secondary"
                onClick={() => onExerciseEdit()}
                icon={<Plus size={16} />}
              >
                Asignar ejercicio
              </Button>
            </>
          ) : (
            <EmptyState
              type="exercise"
              title="Una rutina por construir"
              description="Asigna el primer ejercicio para dar forma a su semana."
              action={
                <Button
                  variant="secondary"
                  onClick={() => onExerciseEdit()}
                  icon={<Plus size={16} />}
                >
                  Añadir ejercicio
                </Button>
              }
            />
          )}
        </section>
        <section className="profile-section">
          <div className="profile-section-heading">
            <h2>
              <Utensils size={20} />
              Dieta semanal
            </h2>
            <Button
              variant="ghost"
              onClick={onDietEdit}
              icon={<PenLine size={16} />}
            >
              Editar
            </Button>
          </div>
          {days ? (
            <>
              <div className="diet-plan-preview">
                <span className="card-eyebrow">
                  <Leaf size={14} />
                  ALIMENTACIÓN PERSONALIZADA
                </span>
                <h3>
                  Su semana,
                  <br />
                  en equilibrio.
                </h3>
                <p>
                  {days} {days === 1 ? "día planificado" : "días planificados"}{" "}
                  para {client.name.split(" ")[0]}
                </p>
                <div className="week-dots">
                  {DAYS.map((d, i) => (
                    <span
                      key={d}
                      className={client.diets[i]?.length ? "filled" : ""}
                    >
                      {d[0]}
                    </span>
                  ))}
                </div>
              </div>
              <Button variant="secondary" onClick={onDietEdit}>
                Ver y editar dieta
                <ArrowRight size={17} />
              </Button>
            </>
          ) : (
            <EmptyState
              type="diet"
              title="Su plan está por empezar"
              description="Prepara una dieta adaptada a su día a día."
              action={
                <Button
                  variant="secondary"
                  onClick={onDietEdit}
                  icon={<Plus size={16} />}
                >
                  Crear dieta
                </Button>
              }
            />
          )}
        </section>
      </div>
      {routineDay !== null && (
        <SaveRoutineDialog
          exercises={list.filter((exercise) => exercise.day === routineDay)}
          initialName={`Rutina del ${FULL_DAYS[routineDay].toLowerCase()}`}
          onClose={() => setRoutineDay(null)}
          onSaved={() => setRoutineDay(null)}
        />
      )}
    </>
  );
}
export function ExerciseForm({
  exercise,
  initialClientId,
  onBack,
  onSaved,
}: {
  exercise?: Exercise;
  initialClientId?: string;
  onBack: () => void;
  onSaved: () => void;
}) {
  const { data, setData, notify } = useStore();
  const [name, setName] = useState(exercise?.name || "");
  const [sets, setSets] = useState(String(exercise?.sets || 3));
  const [reps, setReps] = useState(exercise?.reps || "12");
  const [rest, setRest] = useState(String(exercise?.rest ?? 60));
  const [day, setDay] = useState(exercise?.day ?? 0);
  const [notes, setNotes] = useState(exercise?.notes || "");
  const [technique, setTechnique] = useState(exercise?.technique || "");
  const [group, setGroup] = useState(exercise?.group || "Rutina personalizada");
  const [resource, setResource] = useState<"image" | "video">(
    exercise?.resource || "image",
  );
  const [url, setUrl] = useState(exercise?.url || "");
  const [image, setImage] = useState(exercise?.image || "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [assign, setAssign] = useState(false);
  const personal = !!(initialClientId && exercise?.sourceId);
  const owner = data.clients.find((c) => c.id === initialClientId);
  const [prepared, setPrepared] = useState<Exercise | null>(null);
  const videoId = youtubeId(url);
  function validate(e: FormEvent) {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (name.trim().length < 2) er.name = "Escribe el nombre del ejercicio.";
    if (!Number.isInteger(+sets) || +sets < 1 || +sets > 20)
      er.sets = "Entre 1 y 20 series.";
    if (!reps.trim()) er.reps = "Indica las repeticiones.";
    if (!Number.isInteger(+rest) || +rest < 0 || +rest > 600)
      er.rest = "Entre 0 y 600 segundos.";
    if (!technique.trim())
      er.technique = "Añade una explicación de la técnica.";
    if (resource === "video" && !videoId)
      er.url = "Introduce un enlace válido de YouTube o youtu.be.";
    if (resource === "image" && !image)
      er.image = "Sube una imagen para explicar el ejercicio.";
    setErrors(er);
    if (Object.keys(er).length) return;
    const item: Exercise = {
      id: exercise?.id || newId(),
      sourceId: exercise?.sourceId,
      name: name.trim(),
      sets: +sets,
      reps: reps.trim(),
      rest: +rest,
      day,
      notes,
      technique,
      resource,
      url: resource === "video" ? url : "",
      image: resource === "image" ? image : "squat.svg",
      group: group.trim() || "Rutina personalizada",
    };
    if (personal && initialClientId) {
      setData((d) => personalizeExercise(d, initialClientId, item));
      notify(
        `Ejercicio adaptado solo para ${owner?.name.split(" ")[0] || "este cliente"}.`,
      );
      onSaved();
      return;
    }
    const intent = (e.nativeEvent as SubmitEvent).submitter?.getAttribute(
      "data-action",
    );
    if (intent === "assign") {
      setPrepared(item);
      setAssign(true);
      return;
    }
    setData((d) => ({
      ...d,
      exercises: exercise
        ? d.exercises.map((x) => (x.id === item.id ? item : x))
        : [...d.exercises, item],
    }));
    notify(
      "Ejercicio guardado en tu biblioteca. Las asignaciones conservan sus ajustes.",
    );
    onSaved();
  }
  return (
    <>
      <Back
        onClick={onBack}
        label={personal ? "Volver al cliente" : "Volver a ejercicios"}
      />
      <PageTitle
        eyebrow="MOVIMIENTO A SU MEDIDA"
        title={
          personal
            ? "Adaptar ejercicio"
            : exercise
              ? "Editar ejercicio de biblioteca"
              : "Crear un ejercicio"
        }
        subtitle="Una buena explicación marca la diferencia."
      />
      <form className="editor-layout" noValidate onSubmit={validate}>
        <section className="editor-main">
          <div className="form-section">
            <h2>
              <Dumbbell size={19} />
              Lo esencial
            </h2>
            <Field
              label="Nombre del ejercicio"
              placeholder="Ej. Sentadilla goblet"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
            />
            <div className="three-fields">
              <Field
                label="Series"
                type="number"
                min="1"
                max="20"
                value={sets}
                onChange={(e) => setSets(e.target.value)}
                error={errors.sets}
              />
              <Field
                label="Repeticiones"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                error={errors.reps}
              />
              <Field
                label="Descanso (s)"
                type="number"
                min="0"
                max="600"
                value={rest}
                onChange={(e) => setRest(e.target.value)}
                error={errors.rest}
              />
            </div>
            <Field
              label="Rutina o grupo"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
            />
            <div className="field">
              <label>Día de la semana</label>
              <DayStrip day={day} onChange={setDay} compact />
            </div>
            <TextArea
              label="Descripción técnica"
              rows={4}
              placeholder="Explica cómo realizar el movimiento…"
              value={technique}
              onChange={(e) => setTechnique(e.target.value)}
            />
            {errors.technique && (
              <p className="error-text" role="alert">
                {errors.technique}
              </p>
            )}
            <TextArea
              label="Notas para tu cliente"
              rows={3}
              placeholder="Consejos, adaptaciones o puntos importantes…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </section>
        <aside className="editor-side">
          <div className="form-section">
            <h2>Una imagen vale mucho</h2>
            <p className="section-subtitle">
              Elige cómo explicar el ejercicio.
            </p>
            <div className="resource-selector">
              <button
                type="button"
                className={resource === "image" ? "active" : ""}
                onClick={() => setResource("image")}
              >
                <ImagePlus size={22} />
                Subir imagen
              </button>
              <button
                type="button"
                className={resource === "video" ? "active" : ""}
                onClick={() => setResource("video")}
              >
                <Link size={22} />
                Enlace de vídeo
              </button>
            </div>
            {resource === "image" ? (
              <>
                <label className="upload-zone">
                  {image ? (
                    <img
                      src={
                        image.startsWith("data:") ? image : `/assets/${image}`
                      }
                      alt="Vista previa del ejercicio"
                    />
                  ) : (
                    <>
                      <ImagePlus size={30} />
                      <strong>Seleccionar imagen</strong>
                      <span>JPG, PNG o WebP · hasta 1 MB</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      if (
                        !["image/jpeg", "image/png", "image/webp"].includes(
                          f.type,
                        ) ||
                        f.size > 1_000_000
                      ) {
                        setErrors((er) => ({
                          ...er,
                          image:
                            "Elige una imagen JPG, PNG o WebP de hasta 1 MB.",
                        }));
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => {
                        setImage(String(reader.result));
                        setErrors((er) => ({ ...er, image: "" }));
                      };
                      reader.readAsDataURL(f);
                    }}
                  />
                </label>
                {image && (
                  <p className="form-hint">Pulsa la imagen para cambiarla.</p>
                )}
                {errors.image && (
                  <p className="error-text" role="alert">
                    {errors.image}
                  </p>
                )}
                <button
                  type="button"
                  className="text-link demo-image"
                  onClick={() => {
                    setImage("squat.svg");
                    setErrors((er) => ({ ...er, image: "" }));
                  }}
                >
                  Usar ilustración de demostración
                  <ArrowRight size={14} />
                </button>
              </>
            ) : (
              <>
                <Field
                  label="URL de YouTube"
                  placeholder="https://www.youtube.com/watch?v=…"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  error={
                    errors.url ||
                    (url && !videoId
                      ? "El enlace no tiene un formato válido."
                      : undefined)
                  }
                  hint="Vídeo privado o no listado. No se incrusta en la app."
                />
                {videoId && (
                  <div className="youtube-preview">
                    <img
                      src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
                      alt="Miniatura del vídeo de YouTube"
                    />
                    <Play size={32} />
                    <span>Se abre en YouTube</span>
                  </div>
                )}
                <div className="note-box small-note">
                  <AlertCircle size={17} />
                  <p>
                    Para vídeos privados, concede acceso a las cuentas de tus
                    clientes en YouTube. Compartir el enlace no cambia sus
                    permisos.
                  </p>
                </div>
              </>
            )}
          </div>
          <div className="editor-save">
            <span className="eyebrow">
              {personal
                ? `SOLO PARA ${owner?.name.split(" ")[0].toUpperCase()}`
                : "PREPARADO PARA REUTILIZAR"}
            </span>
            <p>
              {personal
                ? "Estos cambios se aplican a esta asignación del cliente."
                : "Guarda el ejercicio como base o asígnalo directamente a uno o varios clientes."}
            </p>
            <Button
              variant={personal ? "accent" : "primary"}
              type="submit"
              data-action="save"
              icon={personal ? <PenLine size={17} /> : <BookMarked size={17} />}
            >
              {personal
                ? "Guardar cambios del cliente"
                : "Guardar en biblioteca"}
            </Button>
            {!personal && (
              <Button
                variant="accent"
                type="submit"
                data-action="assign"
                icon={<Users size={17} />}
              >
                Guardar y asignar
              </Button>
            )}
          </div>
        </aside>
      </form>
      {assign && prepared && (
        <AssignmentDialog
          exerciseItems={[prepared]}
          initialClientId={initialClientId}
          saveToLibrary
          onClose={() => setAssign(false)}
          onAssigned={() => {
            setAssign(false);
            onSaved();
          }}
        />
      )}
    </>
  );
}
export function DietsView({
  onEdit,
  onLibrary,
}: {
  onEdit: (id: string) => void;
  onLibrary: () => void;
}) {
  const { data } = useStore();
  const [search, setSearch] = useState("");
  const list = data.clients.filter((c) =>
    matchesSearch(search, c.name),
  );
  return (
    <>
      <PageTitle
        eyebrow="ALIMENTACIÓN QUE ACOMPAÑA"
        title={
          <>
            Una semana para cuidarse<span className="olive-dot">.</span>
          </>
        }
        subtitle="Planes sencillos, personalizados y fáciles de seguir."
      />
      <LibraryTabs kind="meal" active="plans" onChange={onLibrary} />
      <div className="list-toolbar">
        <h2>Planes de tus clientes</h2>
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Buscar cliente"
        />
      </div>
      <div className="diet-client-grid">
        {list.map((c) => {
          const n = Object.values(c.diets).filter((m) => m.length).length;
          return (
            <div className="diet-client-card" key={c.id}>
              <div>
                <Avatar client={c} />
                <span>
                  <h3>{c.name}</h3>
                  <p>{c.goal}</p>
                </span>
              </div>
              <div className="week-dots">
                {DAYS.map((d, i) => (
                  <span className={c.diets[i]?.length ? "filled" : ""} key={d}>
                    {d}
                  </span>
                ))}
              </div>
              <div className="diet-card-bottom">
                <span>{n ? `${n} días preparados` : "Sin dieta asignada"}</span>
                <Button
                  variant="ghost"
                  onClick={() => onEdit(c.id)}
                  icon={n ? <PenLine size={15} /> : <Plus size={15} />}
                >
                  {n ? "Editar plan" : "Crear dieta"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      {!list.length && (
        <EmptyState
          type="diet"
          title="No encontramos ese cliente"
          description="Prueba con otro nombre."
        />
      )}
    </>
  );
}
const blankMeal = (index: number): Meal => ({
  id: newId(),
  type: MEAL_TYPES[index % 5],
  name: "",
  kcal: 0,
  summary: "",
  image: seedMeals[index % 5].image,
  ingredients: [{ name: "", quantity: "" }],
  recipe: "",
  notes: "",
});
export function DietEditor({
  client,
  onBack,
  onSaved,
}: {
  client: Client;
  onBack: () => void;
  onSaved: () => void;
}) {
  const { setData, notify } = useStore();
  const [day, setDay] = useState(0);
  const [week, setWeek] = useState<Record<number, Meal[]>>(() =>
    structuredClone(client.diets),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState(false);
  const [picker, setPicker] = useState(false);
  const [copy, setCopy] = useState(false);
  const [targets, setTargets] = useState<number[]>([]);
  const [replace, setReplace] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [validationAttempt, setValidationAttempt] = useState(0);
  const [duplicatedId, setDuplicatedId] = useState("");
  const list = week[day] || [];
  const total = list.reduce((s, m) => s + (m.kcal || 0), 0);
  const days = Object.values(week).filter((ms) => ms.length).length;
  useEffect(() => {
    if (!validationAttempt) return;
    const form = formRef.current;
    const target =
      form?.querySelector<HTMLElement>('[aria-invalid="true"]') ||
      form?.querySelector<HTMLButtonElement>(".add-meal");
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: "center" });
  }, [validationAttempt]);
  useEffect(() => {
    if (!duplicatedId) return;
    const target = formRef.current?.querySelector<HTMLInputElement>(
      `[data-meal-id="${duplicatedId}"] input`,
    );
    target?.focus({ preventScroll: true });
    target?.select();
    target?.scrollIntoView({ block: "center" });
  }, [duplicatedId]);
  function duplicateMeal(meal: Meal) {
    const copy = {
      ...cloneMeal(meal),
      name: meal.name.trim() ? `${meal.name} (copia)` : "",
    };
    setWeek((week) => ({
      ...week,
      [day]: (week[day] || []).flatMap((item) =>
        item.id === meal.id ? [item, copy] : [item],
      ),
    }));
    setDuplicatedId(copy.id);
    notify("Comida duplicada en el borrador. Puedes adaptar esta copia.");
  }
  function update(id: string, patch: Partial<Meal>) {
    setWeek((w) => ({
      ...w,
      [day]: (w[day] || []).map((m) =>
        m.id === id
          ? {
              ...m,
              ...patch,
              summary: (patch.ingredients || m.ingredients)
                .map((i) => i.name)
                .join(" · "),
            }
          : m,
      ),
    }));
  }
  function validate(e: FormEvent) {
    e.preventDefault();
    const er: Record<string, string> = {};
    let first: number | null = null;
    for (const [d, items] of Object.entries(week))
      for (const m of items) {
        const issues = mealErrors(m);
        for (const [k, v] of Object.entries(issues)) er[m.id + "|" + k] = v;
        if (Object.keys(issues).length && first === null) first = +d;
      }
    if (!Object.values(week).some((ms) => ms.length))
      er.empty = "Añade al menos una comida antes de guardar.";
    setErrors(er);
    if (first !== null) setDay(first);
    if (Object.keys(er).length) {
      setValidationAttempt((attempt) => attempt + 1);
    } else {
      setConfirm(true);
    }
  }
  function save() {
    setData((d) => ({
      ...d,
      clients: d.clients.map((c) =>
        c.id === client.id ? { ...c, diets: structuredClone(week) } : c,
      ),
    }));
    setConfirm(false);
    notify(`Dieta guardada y disponible para ${client.name.split(" ")[0]}.`);
    onSaved();
  }
  function toLibrary(meal: Meal) {
    if (Object.keys(mealErrors(meal)).length) {
      notify(
        "Completa el plato, sus cantidades y la receta antes de guardarlo como base.",
      );
      return;
    }
    const item = { ...cloneMeal(meal), sourceId: undefined };
    setData((d) => ({ ...d, mealLibrary: [...d.mealLibrary, item] }));
    notify(
      "Copia guardada en tu biblioteca. El menú del cliente conserva sus ajustes.",
    );
  }
  return (
    <>
      <Back onClick={onBack} label="Volver a dietas" />
      <PageTitle
        eyebrow={`UN PLAN PARA ${client.name.split(" ")[0].toUpperCase()}`}
        title="Una semana en equilibrio"
        subtitle="Añade tus platos y adapta cada ración a su día a día."
      />
      <form ref={formRef} className="diet-editor" onSubmit={validate} noValidate>
        <div className="diet-editor-bar">
          <DayStrip day={day} onChange={setDay} compact />
          <div className="plan-day-summary">
            <span>{FULL_DAYS[day]}</span>
            <strong>{total.toLocaleString("es-ES")} kcal</strong>
          </div>
        </div>
        <div className="day-editor-title">
          <h2>
            {FULL_DAYS[day]}{" "}
            <span>
              · {list.length} {list.length === 1 ? "comida" : "comidas"}
            </span>
          </h2>
          <button
            type="button"
            className="text-link"
            disabled={!list.length}
            onClick={() => {
              setTargets([]);
              setReplace(false);
              setCopy(true);
            }}
          >
            <Copy size={15} />
            Copiar menú a otros días
          </button>
        </div>
        <div className="diet-library-shortcut">
          <span>
            <BookOpen size={23} />
          </span>
          <div>
            <strong>Tu biblioteca, al alcance</strong>
            <p>Elige varios platos y ajusta sus cantidades aquí.</p>
          </div>
          <Button
            variant="secondary"
            onClick={() => setPicker(true)}
            icon={<Plus size={16} />}
          >
            Añadir desde biblioteca
          </Button>
        </div>
        {list.length ? (
          <div className="meal-editors">
            {list.map((m, index) => (
              <MealEditorCard
                key={m.id}
                meal={m}
                index={index}
                onChange={(patch) => update(m.id, patch)}
                onDuplicate={() => duplicateMeal(m)}
                onDelete={() =>
                  setWeek((w) => ({
                    ...w,
                    [day]: w[day].filter((x) => x.id !== m.id),
                  }))
                }
                onSaveToLibrary={() => toLibrary(m)}
                errors={Object.fromEntries(
                  Object.entries(errors)
                    .filter(([k]) => k.startsWith(m.id + "|"))
                    .map(([k, v]) => [k.slice(m.id.length + 1), v]),
                )}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            type="diet"
            title="Un día lleno de posibilidades"
            description="Selecciona platos de tu biblioteca o crea una comida para este cliente."
          />
        )}
        <button
          type="button"
          className="add-meal"
          onClick={() =>
            setWeek((w) => ({
              ...w,
              [day]: [...(w[day] || []), blankMeal(list.length)],
            }))
          }
        >
          <Plus size={20} />
          Crear comida para este cliente<span>{FULL_DAYS[day]}</span>
        </button>
        {errors.empty && (
          <p className="error-text" role="alert">
            {errors.empty}
          </p>
        )}
        <div className="diet-save-bar">
          <span>
            <Leaf size={17} />
            {days} de 7 días preparados
          </span>
          <Button variant="accent" type="submit" icon={<Send size={17} />}>
            Guardar y enviar al cliente
          </Button>
        </div>
      </form>
      {picker && (
        <MealPicker
          onClose={() => setPicker(false)}
          onPick={(items) => {
            setWeek((w) => ({ ...w, [day]: [...(w[day] || []), ...items] }));
            setPicker(false);
            notify(
              `${items.length} ${items.length === 1 ? "plato añadido" : "platos añadidos"} al borrador del ${FULL_DAYS[day].toLowerCase()}.`,
            );
          }}
        />
      )}
      {copy && (
        <Modal
          title={`Copiar el menú del ${FULL_DAYS[day].toLowerCase()}`}
          onClose={() => setCopy(false)}
          footer={
            <Button
              disabled={!targets.length}
              onClick={() => {
                setWeek((w) => copyMenu(w, day, targets, replace));
                setCopy(false);
                notify(
                  "Menús copiados. Puedes adaptar cada día antes de guardar.",
                );
              }}
              icon={<Copy size={17} />}
            >
              Copiar a {targets.length || ""}{" "}
              {targets.length === 1 ? "día" : "días"}
            </Button>
          }
        >
          <p>{list.length} comidas. Cada día recibe su propia copia.</p>
          <DayChoices selected={targets} onChange={setTargets} exclude={day} />
          <div className="copy-options">
            <label>
              <input
                type="radio"
                name="copy-mode"
                checked={!replace}
                onChange={() => setReplace(false)}
              />
              <span>
                <strong>Añadir al menú actual</strong>
                <small>Conserva las comidas de los días elegidos.</small>
              </span>
            </label>
            <label>
              <input
                type="radio"
                name="copy-mode"
                checked={replace}
                onChange={() => setReplace(true)}
              />
              <span>
                <strong>Sustituir el menú de esos días</strong>
                <small>Reemplaza sus comidas dentro de este borrador.</small>
              </span>
            </label>
          </div>
        </Modal>
      )}
      {confirm && (
        <Modal
          title="Su semana está lista"
          onClose={() => setConfirm(false)}
          footer={
            <Button variant="accent" onClick={save} icon={<Send size={17} />}>
              Guardar y enviar al cliente
            </Button>
          }
        >
          <div className="confirm-client">
            <Avatar client={client} size="lg" />
            <h3>{client.name}</h3>
            <p>
              {days} {days === 1 ? "día" : "días"} ·{" "}
              {Object.values(week).reduce((s, m) => s + m.length, 0)} comidas
            </p>
          </div>
          <p>
            El plan sustituirá su dieta semanal actual. Cada plato conserva las
            cantidades y notas que has adaptado para {client.name.split(" ")[0]}
            .
          </p>
          <p className="form-hint">
            Demostración: el plan se actualiza en este navegador. No se envían
            mensajes externos.
          </p>
        </Modal>
      )}
    </>
  );
}
