import { useEffect, useState } from "react";
import {
  Bell,
  ChevronDown,
  Smartphone,
  Monitor,
  Leaf,
  ArrowRight,
  ArrowLeft,
  Check,
  Palette,
  X,
  LogOut,
  UserRound,
  RotateCcw,
} from "lucide-react";
import {
  Avatar,
  Brand,
  Button,
  Field,
  Modal,
  Nav,
  Logout,
  Toast,
  PageTitle,
} from "./components/ui";
import { useStore } from "./store";
import type { Role, Meal, Exercise, Client } from "./types";
import { Login } from "./features/Login";
import {
  DietView,
  MealDetail,
  ExercisesView,
  ExerciseDetail,
} from "./features/Client";
import {
  ClientsView,
  ClientProfile,
  ExerciseForm,
  DietsView,
  DietEditor,
} from "./features/Trainer";
import { ExerciseCatalogue, MealLibrary } from "./features/Library";
import { ProgressView } from "./features/Monitoring";
import { assignedExercises } from "./domain";
type Route = { page: string; id?: string };
export default function App() {
  const { data, toast, notify, reset } = useStore();
  const [role, setRole] = useState<Role | null>(null);
  const [route, setRoute] = useState<Route>({ page: "diet" });
  const [mobile, setMobile] = useState(false);
  const [profile, setProfile] = useState(false);
  const [system, setSystem] = useState(false);
  const [clientId, setClientId] = useState("ana");
  const [meal, setMeal] = useState<Meal | null>(null);
  const [editing, setEditing] = useState<Exercise | undefined>();
  const [assignClient, setAssignClient] = useState<string | undefined>();
  const [returnRoute, setReturnRoute] = useState<Route>({ page: "exercises" });
  const [notifications, setNotifications] = useState(false);
  const [detailOwnerId, setDetailOwnerId] = useState<string | undefined>();
  const [libraryTarget, setLibraryTarget] = useState<string | undefined>();
  const [exerciseDay, setExerciseDay] = useState<number | undefined>();
  const client = data.clients.find((c) => c.id === clientId) || data.clients[0];
  function go(page: string, id?: string) {
    setRoute({ page, id });
    setMeal(null);
    window.history.pushState(
      { page, id },
      "",
      `#${role || "login"}/${page}${id ? "/" + id : ""}`,
    );
  }
  useEffect(() => {
    const pop = (e: PopStateEvent) => {
      if (e.state?.page) {
        setRoute(e.state);
        setMeal(null);
      }
    };
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);
  useEffect(() => {
    document.querySelector(".app-main")?.scrollTo(0, 0);
  }, [route, meal]);
  function login(r: Role) {
    setRole(r);
    const page = r === "client" ? "diet" : "clients";
    setRoute({ page });
    window.history.replaceState({ page }, "", `#${r}/${page}`);
  }
  function logout() {
    setRole(null);
    setProfile(false);
    setMeal(null);
    window.history.replaceState(null, "", window.location.pathname);
  }
  function openExerciseForm(e?: Exercise, cid?: string) {
    setEditing(e);
    setAssignClient(cid);
    setReturnRoute(route);
    go("exercise-form");
  }
  const selectedClient = data.clients.find((c) => c.id === route.id);
  const detailOwner = data.clients.find((c) => c.id === detailOwnerId);
  const exercise = (
    role === "client"
      ? assignedExercises(client)
      : detailOwner
        ? assignedExercises(detailOwner)
        : data.exercises
  ).find((e) => e.id === route.id);
  const active =
    role === "client"
      ? route.page.startsWith("exercise")
        ? "exercises"
        : "diet"
      : route.page.startsWith("diet") || route.page === "meal-library"
        ? "diets"
        : route.page.startsWith("exercise")
          ? "exercises"
          : "clients";
  const trainer = { name: "Lucía Moreno", initials: "LM", tone: "olive" };
  const person = role === "client" ? client : trainer;
  let content;
  if (role === "client") {
    content = meal ? (
      <MealDetail meal={meal} onBack={() => setMeal(null)} />
    ) : route.page === "exercise-detail" && exercise ? (
      <ExerciseDetail
        exercise={exercise}
        clientId={client.id}
        onBack={() => go("exercises")}
      />
    ) : route.page === "exercises" ? (
      <ExercisesView
        client={client}
        initialDay={exerciseDay}
        onExercise={(e) => {
          setExerciseDay(e.day);
          go("exercise-detail", e.id);
        }}
      />
    ) : (
      <DietView client={client} onMeal={setMeal} />
    );
  } else {
    content =
      route.page === "client" && selectedClient ? (
        <ClientProfile
          client={selectedClient}
          onBack={() => go("clients")}
          onExerciseEdit={(e) => {
            if (e) {
              openExerciseForm(e, selectedClient.id);
            } else {
              setLibraryTarget(selectedClient.id);
              setReturnRoute(route);
              go("exercise-picker");
            }
          }}
          onDietEdit={() => go("diet-editor", selectedClient.id)}
          onProgress={() => go("progress", selectedClient.id)}
          onExercise={(e) => {
            setReturnRoute(route);
            setDetailOwnerId(selectedClient.id);
            go("exercise-detail", e.id);
          }}
        />
      ) : route.page === "progress" ? (
        <ProgressView
          client={selectedClient || data.clients[0]}
          onBack={() => go("client", selectedClient?.id || data.clients[0].id)}
          onClientChange={(id) => go("progress", id)}
        />
      ) : route.page === "exercises" || route.page === "exercise-picker" ? (
        <ExerciseCatalogue
          onCreate={(e) =>
            openExerciseForm(
              e,
              route.page === "exercise-picker" && !e
                ? libraryTarget
                : undefined,
            )
          }
          onExercise={(e) => {
            setDetailOwnerId(undefined);
            setReturnRoute(route);
            go("exercise-detail", e.id);
          }}
          initialClientId={
            route.page === "exercise-picker" ? libraryTarget : undefined
          }
          onBack={
            route.page === "exercise-picker"
              ? () => go("client", libraryTarget)
              : undefined
          }
          onAssigned={
            route.page === "exercise-picker"
              ? () => go("client", libraryTarget)
              : undefined
          }
        />
      ) : route.page === "exercise-form" ? (
        <ExerciseForm
          key={editing?.id || assignClient || "new"}
          exercise={editing}
          initialClientId={assignClient}
          onBack={() => go(returnRoute.page, returnRoute.id)}
          onSaved={() => go(returnRoute.page, returnRoute.id)}
        />
      ) : route.page === "exercise-detail" && exercise ? (
        <ExerciseDetail
          exercise={exercise}
          clientId={detailOwner?.id || client.id}
          trainer
          onBack={() => go(returnRoute.page, returnRoute.id)}
          onEdit={() => openExerciseForm(exercise, detailOwner?.id)}
        />
      ) : route.page === "diets" ? (
        <DietsView
          onEdit={(id) => go("diet-editor", id)}
          onLibrary={() => go("meal-library")}
        />
      ) : route.page === "meal-library" ? (
        <MealLibrary onBack={() => go("diets")} onPlans={() => go("diets")} />
      ) : route.page === "diet-editor" && selectedClient ? (
        <DietEditor
          key={selectedClient.id}
          client={selectedClient}
          onBack={() => go("diets")}
          onSaved={() => go("client", selectedClient.id)}
        />
      ) : (
        <ClientsView onClient={(id) => go("client", id)} />
      );
  }
  return (
    <>
      <div className={`prototype-tools ${mobile ? "with-frame" : ""}`}>
        <span className="prototype-label">
          <span />
          PROTOTIPO
        </span>
        <button
          title={mobile ? "Vista adaptable" : "Vista móvil 390 × 844"}
          aria-label={
            mobile
              ? "Activar vista adaptable"
              : "Activar vista móvil 390 por 844"
          }
          onClick={() => setMobile(!mobile)}
        >
          {mobile ? <Monitor size={17} /> : <Smartphone size={17} />}
          <span>{mobile ? "Vista adaptable" : "390 × 844"}</span>
        </button>
        <button
          aria-label="Ver sistema de diseño"
          onClick={() => setSystem(true)}
        >
          <Palette size={17} />
          <span>Diseño</span>
        </button>
      </div>
      <div className={mobile ? "preview-stage" : ""}>
        <div
          className={`${role ? "app-shell" : "login-shell"} ${mobile ? "preview-mobile" : ""}`}
        >
          {!role ? (
            <Login onLogin={login} />
          ) : (
            <div className="workspace">
              <aside className="sidebar">
                <Brand />
                <div className="sidebar-role">
                  <span />{" "}
                  {role === "client" ? "MI ESPACIO" : "ESPACIO ENTRENADOR"}
                </div>
                <Nav
                  role={role}
                  active={active}
                  onNavigate={(key) => go(key)}
                />
                <div className="sidebar-bottom">
                  <div className="sidebar-mantra">
                    <Leaf size={30} strokeWidth={1} />
                    <p>
                      El bienestar
                      <br />
                      se construye
                      <br />
                      <em>día a día.</em>
                    </p>
                    <span>Y CADA PASO CUENTA.</span>
                  </div>
                  <button
                    className="sidebar-profile"
                    onClick={() => setProfile(true)}
                  >
                    <Avatar client={person} />
                    <span>
                      <strong>{person.name}</strong>
                      <small>
                        {role === "client"
                          ? "Tu espacio personal"
                          : "Entrenadora personal"}
                      </small>
                    </span>
                    <ChevronDown size={15} />
                  </button>
                  <Logout onClick={logout} />
                </div>
              </aside>
              <div className="main-wrap">
                <header className="app-header">
                  <div className="desktop-breadcrumb">
                    Mi espacio <span>/</span>
                    <strong>
                      {active === "diet"
                        ? "Dieta semanal"
                        : active === "clients"
                          ? "Clientes"
                          : active === "diets"
                            ? "Dietas"
                            : "Ejercicios"}
                    </strong>
                  </div>
                  <div className="mobile-greeting">
                    <Brand small />
                    <span>
                      Hola, {person.name.split(" ")[0]} <Leaf size={13} />
                    </span>
                  </div>
                  <div className="header-actions">
                    <span className="header-date">
                      {new Date().toLocaleDateString("es-ES", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </span>
                    <button
                      className="notification-button"
                      aria-label="Ver novedades"
                      onClick={() => setNotifications(true)}
                    >
                      <Bell size={20} strokeWidth={1.6} />
                      <i />
                    </button>
                    <button
                      className="header-avatar"
                      onClick={() => setProfile(true)}
                      aria-label="Abrir perfil"
                    >
                      <Avatar client={person} size="sm" />
                    </button>
                  </div>
                </header>
                <main className="app-main" key={role}>
                  <div className="main-content">{content}</div>
                  <footer className="app-footer">
                    <Brand small />
                    <span>Un día a la vez. Un paso más cerca de ti.</span>
                    <Leaf size={17} />
                  </footer>
                </main>
                <Nav
                  role={role}
                  active={active}
                  onNavigate={(key) => go(key)}
                  mobile
                />
              </div>
            </div>
          )}
        </div>
      </div>
      {toast && <Toast text={toast} />}{" "}
      {profile && (
        <Modal title="Tu espacio" onClose={() => setProfile(false)}>
          <div className="confirm-client">
            <Avatar client={person} size="lg" />
            <h3>{person.name}</h3>
            <p>{role === "client" ? client.email : "lucia@fitcoach.demo"}</p>
          </div>
          <div className="profile-options">
            <div className="field">
              <label htmlFor="role-switch">Explorar como</label>
              <select
                id="role-switch"
                value={role || "client"}
                onChange={(e) => {
                  login(e.target.value as Role);
                  setProfile(false);
                }}
              >
                <option value="client">Cliente</option>
                <option value="trainer">Entrenador</option>
              </select>
            </div>
            {role === "client" && (
              <div className="field">
                <label htmlFor="client-switch">Cliente de demostración</label>
                <select
                  id="client-switch"
                  value={client.id}
                  onChange={(e) => {
                    setClientId(e.target.value);
                    go("diet");
                    setProfile(false);
                  }}
                >
                  {data.clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.id === "leo" ? " · sin planes iniciales" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <Button
              variant="secondary"
              onClick={() => {
                reset();
                setClientId("ana");
                setProfile(false);
                go(role === "client" ? "diet" : "clients");
              }}
              icon={<RotateCcw size={17} />}
            >
              Restablecer demo
            </Button>
            <Button
              variant="ghost"
              onClick={logout}
              icon={<LogOut size={17} />}
            >
              Cerrar sesión
            </Button>
          </div>
          <p className="form-hint">
            Datos ficticios. Esta demo no ofrece autenticación real ni
            sincronización entre dispositivos.
          </p>
        </Modal>
      )}
      {notifications && (
        <Modal title="Todo en su sitio" onClose={() => setNotifications(false)}>
          <div className="notification-note">
            <span>
              <Leaf size={29} />
            </span>
            <h3>
              {role === "client"
                ? "Tu plan va contigo"
                : "Listos para un nuevo día"}
            </h3>
            <p>
              {role === "client"
                ? "Consulta tu alimentación y tus ejercicios desde las pestañas de tu espacio."
                : "Revisa tus clientes y adapta sus planes cuando lo necesiten."}
            </p>
            <small>Prototipo · no hay notificaciones externas.</small>
          </div>
        </Modal>
      )}
      {system && <DesignSystem onClose={() => setSystem(false)} />}
    </>
  );
}
function DesignSystem({ onClose }: { onClose: () => void }) {
  const colors = [
    ["Oliva", "#5A6B2F"],
    ["Oliva profundo", "#3F4A24"],
    ["Arena clara", "#F5EFE3"],
    ["Arena media", "#EAE0CC"],
    ["Borde", "#D9CBAE"],
    ["Terracota", "#B85C38"],
    ["Texto", "#2B2A22"],
    ["Secundario", "#6E6A5C"],
    ["Completado", "#7A9A4E"],
    ["Error", "#B3402F"],
  ];
  return (
    <Modal title="Las bases de FitCoach" onClose={onClose}>
      <div className="design-system">
        <span className="eyebrow">NATURAL. CÁLIDO. EN EQUILIBRIO.</span>
        <h3>Un mismo lenguaje visual.</h3>
        <p>Variables compartidas para construir una experiencia coherente.</p>
        <h4>Paleta exacta</h4>
        <div className="swatch-grid">
          {colors.map(([label, hex]) => (
            <div key={hex}>
              <span style={{ background: hex }} />
              <strong>{label}</strong>
              <small>{hex}</small>
            </div>
          ))}
        </div>
        <h4>Tipografía · Inter</h4>
        <div className="type-specimen">
          <strong>Aa</strong>
          <span>
            Títulos · Semibold 600
            <br />
            Texto · Regular 400
            <br />
            12 / 14 / 16 / 20 / 28 / 40 px
          </span>
        </div>
        <h4>Botones y estados</h4>
        <div className="button-specimen">
          <Button>
            Principal
            <ArrowRight size={16} />
          </Button>
          <Button variant="accent">Acción clave</Button>
          <Button variant="secondary">Secundario</Button>
          <Button disabled>Deshabilitado</Button>
          <button className="button button-primary pressed-example">
            Pulsado
          </button>
        </div>
        <h4>Campos y validación</h4>
        <Field label="Email" placeholder="tu@email.com" />
        <Field
          label="Email"
          value="email incompleto"
          readOnly
          error="Escribe un email válido."
        />
        <h4>Espaciado y formas</h4>
        <p>
          Escala 4 · 8 · 12 · 16 · 24 · 32 · 48 px.
          <br />
          Radio 16 px. Iconos Lucide de trazo fino.
          <br />
          Auto-layout mediante Flexbox y Grid en el prototipo.
        </p>
        <h4>Interacciones accesibles</h4>
        <p>
          Foco visible, etiquetas, áreas táctiles de 44 px, navegación por
          teclado y respeto a la preferencia de movimiento reducido.
        </p>
      </div>
    </Modal>
  );
}
