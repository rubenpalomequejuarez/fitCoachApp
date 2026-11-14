import { useState } from "react";
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
import type { Client, Exercise, Meal } from "../types";
const newId = () =>
  typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `demo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
export function ClientsView({ onClient }: { onClient: (id: string) => void }) {
  const { data, setData, notify } = useStore();
  const [search, setSearch] = useState("");
  const [add, setAdd] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [goal, setGoal] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const filtered = data.clients.filter((c) =>
    `${c.name} ${c.goal}`.toLowerCase().includes(search.toLowerCase()),
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
              {data.clients.filter((c) => c.exerciseIds.length).length}
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
                className={`status-dot ${c.exerciseIds.length ? "" : "pending"}`}
              />
              {c.exerciseIds.length ? "Plan en marcha" : "Por preparar"}
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
}: {
  client: Client;
  onBack: () => void;
  onExerciseEdit: (e?: Exercise) => void;
  onDietEdit: () => void;
  onExercise: (e: Exercise) => void;
}) {
  const { data } = useStore();
  const list = data.exercises.filter((e) => client.exerciseIds.includes(e.id));
  const days = Object.values(client.diets).filter((m) => m.length).length;
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
          {list.length ? (
            <>
              {list.map((e) => (
                <ExerciseCard
                  key={e.id}
                  exercise={e}
                  onClick={() => onExercise(e)}
                />
              ))}
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
    </>
  );
}
export function ExerciseLibrary({
  onCreate,
  onExercise,
}: {
  onCreate: () => void;
  onExercise: (e: Exercise) => void;
}) {
  const { data } = useStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");
  const groups = ["Todos", ...new Set(data.exercises.map((e) => e.group))];
  const filtered = data.exercises.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) &&
      (filter === "Todos" || e.group === filter),
  );
  return (
    <>
      <PageTitle
        eyebrow="TU BIBLIOTECA DE MOVIMIENTO"
        title={
          <>
            Entrenar con intención<span className="olive-dot">.</span>
          </>
        }
        subtitle="Ejercicios que se adaptan a cada persona."
        action={
          <Button onClick={onCreate} icon={<Plus size={18} />}>
            Crear ejercicio
          </Button>
        }
      />
      <div className="library-toolbar">
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Buscar ejercicio"
        />
        <div className="filter-chips">
          {groups.map((g) => (
            <button
              className={filter === g ? "active" : ""}
              key={g}
              onClick={() => setFilter(g)}
            >
              {g}
            </button>
          ))}
        </div>
      </div>
      <div className="exercise-library-grid">
        {filtered.map((e) => (
          <button
            key={e.id}
            className="library-exercise"
            onClick={() => onExercise(e)}
          >
            <div className="library-exercise-image">
              <img
                src={
                  e.image.startsWith("data:") ? e.image : `/assets/${e.image}`
                }
                alt=""
              />
              {e.resource === "video" && (
                <span className="chip">
                  <Play size={12} />
                  Vídeo
                </span>
              )}
              <span className="library-open">
                <ArrowRight size={18} />
              </span>
            </div>
            <div className="library-exercise-text">
              <span className="eyebrow">{e.group.toUpperCase()}</span>
              <h3>{e.name}</h3>
              <p>
                {e.sets} × {e.reps}
                <span>·</span>
                <Clock size={13} />
                {e.rest} s descanso
              </p>
            </div>
          </button>
        ))}
      </div>
      {!filtered.length && (
        <EmptyState
          type="exercise"
          title="Aquí hay espacio para algo nuevo"
          description="Prueba otra búsqueda o crea un ejercicio."
          action={
            <Button variant="secondary" onClick={onCreate}>
              Crear ejercicio
            </Button>
          }
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
  const [selected, setSelected] = useState<string[]>(
    initialClientId
      ? [initialClientId]
      : exercise
        ? data.clients
            .filter((c) => c.exerciseIds.includes(exercise.id))
            .map((c) => c.id)
        : [],
  );
  const [query, setQuery] = useState("");
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
    if (!Object.keys(er).length) setAssign(true);
  }
  function save() {
    if (!selected.length) return;
    const id = exercise?.id || newId();
    const item: Exercise = {
      id,
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
    setData((d) => ({
      ...d,
      exercises: exercise
        ? d.exercises.map((e) => (e.id === id ? item : e))
        : [...d.exercises, item],
      clients: d.clients.map((c) =>
        selected.includes(c.id)
          ? { ...c, exerciseIds: [...new Set([...c.exerciseIds, id])] }
          : c,
      ),
    }));
    setAssign(false);
    notify(
      `Ejercicio ${exercise ? "actualizado y " : ""}asignado a ${selected.length} ${selected.length === 1 ? "cliente" : "clientes"}.`,
    );
    onSaved();
  }
  return (
    <>
      <Back onClick={onBack} label="Volver a ejercicios" />
      <PageTitle
        eyebrow="MOVIMIENTO A SU MEDIDA"
        title={exercise ? "Editar ejercicio" : "Crear un ejercicio"}
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
            <span className="eyebrow">UN PASO MÁS</span>
            <p>Selecciona quién recibirá este ejercicio.</p>
            <Button variant="accent" type="submit" icon={<Users size={18} />}>
              Asignar a cliente
              <ArrowRight size={17} />
            </Button>
          </div>
        </aside>
      </form>
      {assign && (
        <Modal
          title="¿A quién acompañamos?"
          onClose={() => setAssign(false)}
          footer={
            <Button
              variant="accent"
              disabled={!selected.length}
              onClick={save}
              icon={<Send size={17} />}
            >
              Asignar a {selected.length || ""}{" "}
              {selected.length === 1 ? "cliente" : "clientes"}
            </Button>
          }
        >
          <p>
            El ejercicio se añadirá a sus rutinas para el{" "}
            {FULL_DAYS[day].toLowerCase()}.
          </p>
          <SearchField
            placeholder="Buscar clientes"
            value={query}
            onChange={setQuery}
          />
          <div className="select-all">
            <button
              onClick={() =>
                setSelected(
                  selected.length === data.clients.length
                    ? []
                    : data.clients.map((c) => c.id),
                )
              }
            >
              {selected.length === data.clients.length
                ? "Quitar selección"
                : "Seleccionar todos"}
            </button>
            <span>{selected.length} seleccionados</span>
          </div>
          <div className="client-selector">
            {data.clients
              .filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
              .map((c) => (
                <label key={c.id}>
                  <input
                    type="checkbox"
                    checked={selected.includes(c.id)}
                    onChange={() =>
                      setSelected((s) =>
                        s.includes(c.id)
                          ? s.filter((x) => x !== c.id)
                          : [...s, c.id],
                      )
                    }
                  />
                  <Avatar client={c} />
                  <span>
                    <strong>{c.name}</strong>
                    <small>{c.goal}</small>
                  </span>
                  <span className="selection-check">
                    {selected.includes(c.id) && <Check size={16} />}
                  </span>
                </label>
              ))}
          </div>
        </Modal>
      )}
    </>
  );
}
export function DietsView({ onEdit }: { onEdit: (id: string) => void }) {
  const { data } = useStore();
  const [search, setSearch] = useState("");
  const list = data.clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
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
const blankMeal = (day: number): Meal => ({
  id: newId(),
  type: "Desayuno",
  name: "",
  kcal: 0,
  summary: "",
  image: seedMeals[0].image,
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
  const list = week[day] || [];
  const total = list.reduce((s, m) => s + (m.kcal || 0), 0);
  function update(id: string, patch: Partial<Meal>) {
    setWeek((w) => ({
      ...w,
      [day]: (w[day] || []).map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));
  }
  function validate(e: FormEvent) {
    e.preventDefault();
    const er: Record<string, string> = {};
    let first: number | null = null;
    for (const [d, ms] of Object.entries(week))
      for (const m of ms) {
        if (!m.name.trim()) er[`${m.id}-name`] = "Añade el nombre del plato.";
        if (!m.recipe.trim())
          er[`${m.id}-recipe`] = "Explica la receta paso a paso.";
        if (
          !m.ingredients.length ||
          m.ingredients.some((i) => !i.name.trim() || !i.quantity.trim())
        )
          er[`${m.id}-ingredients`] =
            "Completa el nombre y la cantidad de cada alimento.";
        if (!Number.isFinite(m.kcal) || m.kcal < 0)
          er[`${m.id}-kcal`] = "Las calorías deben ser un número positivo.";
        if (first === null && Object.keys(er).some((k) => k.startsWith(m.id)))
          first = +d;
      }
    if (!Object.values(week).some((ms) => ms.length))
      er.empty = "Añade al menos una comida antes de guardar.";
    setErrors(er);
    if (first !== null) setDay(first);
    if (!Object.keys(er).length) setConfirm(true);
  }
  function save() {
    setData((d) => ({
      ...d,
      clients: d.clients.map((c) =>
        c.id === client.id ? { ...c, diets: week } : c,
      ),
    }));
    setConfirm(false);
    notify(`Dieta guardada y disponible para ${client.name.split(" ")[0]}.`);
    onSaved();
  }
  return (
    <>
      <Back onClick={onBack} label="Volver a dietas" />
      <PageTitle
        eyebrow={`UN PLAN PARA ${client.name.split(" ")[0].toUpperCase()}`}
        title="Una semana en equilibrio"
        subtitle="Organiza las comidas. Deja espacio para disfrutar."
      />
      <form className="diet-editor" onSubmit={validate} noValidate>
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
            onClick={() => {
              if (!list.length) return;
              setWeek((w) =>
                Object.fromEntries(
                  DAYS.map((_, i) => [
                    i,
                    i === day
                      ? w[i]
                      : list.map((m) => ({
                          ...structuredClone(m),
                          id: newId(),
                        })),
                  ]),
                ),
              );
              notify("Menú copiado al resto de días. Revisa y guarda el plan.");
            }}
            disabled={!list.length}
          >
            <Copy size={15} />
            Copiar al resto de días
          </button>
        </div>
        {list.length ? (
          <div className="meal-editors">
            {list.map((m, index) => (
              <section className="meal-editor" key={m.id}>
                <header>
                  <span className="meal-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="field">
                    <label htmlFor={`type-${m.id}`}>Momento del día</label>
                    <select
                      id={`type-${m.id}`}
                      value={m.type}
                      onChange={(e) => {
                        const type = e.target.value;
                        update(m.id, {
                          type,
                          image:
                            seedMeals.find((x) => x.type === type)?.image ||
                            "bowl.jpg",
                        });
                      }}
                    >
                      {MEAL_TYPES.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    className="icon-button delete-button"
                    aria-label={`Eliminar ${m.type}`}
                    onClick={() =>
                      setWeek((w) => ({
                        ...w,
                        [day]: w[day].filter((x) => x.id !== m.id),
                      }))
                    }
                  >
                    <Trash2 size={18} />
                  </button>
                </header>
                <div className="meal-editor-fields">
                  <Field
                    label="Nombre del plato"
                    placeholder="Ej. Avena con frutos rojos"
                    value={m.name}
                    onChange={(e) => update(m.id, { name: e.target.value })}
                    error={errors[`${m.id}-name`]}
                  />
                  <Field
                    label="Calorías (opcional)"
                    type="number"
                    min="0"
                    value={m.kcal || ""}
                    placeholder="kcal"
                    onChange={(e) => update(m.id, { kcal: +e.target.value })}
                    error={errors[`${m.id}-kcal`]}
                  />
                </div>
                <div className="ingredients-editor">
                  <div className="ingredients-label">
                    <span>Alimentos</span>
                    <span>Cantidad</span>
                  </div>
                  {m.ingredients.map((x, i) => (
                    <div className="ingredient-fields" key={i}>
                      <input
                        aria-label={`Alimento ${i + 1} de ${m.type}`}
                        placeholder="Ej. Copos de avena"
                        value={x.name}
                        onChange={(e) =>
                          update(m.id, {
                            ingredients: m.ingredients.map((v, j) =>
                              j === i ? { ...v, name: e.target.value } : v,
                            ),
                          })
                        }
                      />
                      <input
                        aria-label={`Cantidad del alimento ${i + 1} de ${m.type}`}
                        placeholder="60 g"
                        value={x.quantity}
                        onChange={(e) =>
                          update(m.id, {
                            ingredients: m.ingredients.map((v, j) =>
                              j === i ? { ...v, quantity: e.target.value } : v,
                            ),
                          })
                        }
                      />
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={`Quitar alimento ${i + 1}`}
                        onClick={() =>
                          update(m.id, {
                            ingredients: m.ingredients.filter(
                              (_, j) => j !== i,
                            ),
                          })
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                  {errors[`${m.id}-ingredients`] && (
                    <p className="error-text" role="alert">
                      {errors[`${m.id}-ingredients`]}
                    </p>
                  )}
                  <button
                    type="button"
                    className="text-link"
                    onClick={() =>
                      update(m.id, {
                        ingredients: [
                          ...m.ingredients,
                          { name: "", quantity: "" },
                        ],
                      })
                    }
                  >
                    <Plus size={15} />
                    Añadir alimento
                  </button>
                </div>
                <TextArea
                  label="Receta paso a paso"
                  placeholder="Un paso por línea…"
                  rows={3}
                  value={m.recipe}
                  onChange={(e) => update(m.id, { recipe: e.target.value })}
                />
                {errors[`${m.id}-recipe`] && (
                  <p className="error-text" role="alert">
                    {errors[`${m.id}-recipe`]}
                  </p>
                )}
                <TextArea
                  label="Notas del entrenador (opcional)"
                  placeholder="Alternativas, preparación o algún consejo…"
                  rows={2}
                  value={m.notes}
                  onChange={(e) => update(m.id, { notes: e.target.value })}
                />
              </section>
            ))}
          </div>
        ) : (
          <EmptyState
            type="diet"
            title="Un día lleno de posibilidades"
            description="Añade la primera comida y empieza a preparar el menú."
          />
        )}
        <button
          type="button"
          className="add-meal"
          onClick={() =>
            setWeek((w) => ({
              ...w,
              [day]: [
                ...(w[day] || []),
                {
                  ...blankMeal(day),
                  type: MEAL_TYPES[list.length % 5],
                  image: seedMeals[list.length % 5].image,
                },
              ],
            }))
          }
        >
          <Plus size={20} />
          Añadir comida<span>{FULL_DAYS[day]}</span>
        </button>
        {errors.empty && (
          <p className="error-text" role="alert">
            {errors.empty}
          </p>
        )}
        <div className="diet-save-bar">
          <span>
            <Leaf size={17} />
            {Object.values(week).filter((ms) => ms.length).length} de 7 días
            preparados
          </span>
          <Button variant="accent" type="submit" icon={<Send size={17} />}>
            Guardar y enviar al cliente
          </Button>
        </div>
      </form>
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
              {Object.values(week).filter((ms) => ms.length).length}{" "}
              {Object.values(week).filter((ms) => ms.length).length === 1
                ? "día"
                : "días"}{" "}
              · {Object.values(week).reduce((s, m) => s + m.length, 0)}{" "}
              {Object.values(week).reduce((s, m) => s + m.length, 0) === 1
                ? "comida"
                : "comidas"}
            </p>
          </div>
          <p>
            El plan sustituirá su dieta semanal actual y estará disponible en su
            perfil de cliente.
          </p>
          <p className="form-hint">
            Demostración: la entrega ocurre dentro de esta app. No se envía
            email ni notificación externa.
          </p>
        </Modal>
      )}
    </>
  );
}
