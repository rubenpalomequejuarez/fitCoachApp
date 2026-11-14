import { useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Leaf,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sprout,
} from "lucide-react";
import { Brand, Button, Field, Modal } from "../components/ui";
import type { Role } from "../types";
import { useStore } from "../store";
export function Login({ onLogin }: { onLogin: (role: Role) => void }) {
  const [role, setRole] = useState<Role>("client");
  const [email, setEmail] = useState("ana@fitcoach.demo");
  const [password, setPassword] = useState("fitcoach2026");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [forgot, setForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetError, setResetError] = useState("");
  const { notify } = useStore();
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const x: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      x.email = "Escribe un email válido.";
    if (password.length < 6)
      x.password = "La contraseña debe tener al menos 6 caracteres.";
    setErrors(x);
    if (!Object.keys(x).length) onLogin(role);
  }
  return (
    <div className="login-page">
      <aside className="login-story">
        <Brand />
        <div className="story-copy">
          <span className="eyebrow">MENOS PRISA. MÁS EQUILIBRIO.</span>
          <h1>
            Tu bienestar,
            <br />
            un día
            <br />
            <em>a la vez.</em>
          </h1>
          <p>
            Comer con calma. Moverte con intención.
            <br />
            Un acompañamiento que va contigo.
          </p>
        </div>
        <div className="story-photos">
          <img
            className="photo-main"
            src="/assets/bowl.jpg"
            alt="Bowl mediterráneo con verduras frescas"
          />
          <div className="story-stamp">
            <Sprout size={26} />
            <span>
              Pequeños hábitos.
              <br />
              <strong>Grandes cambios.</strong>
            </span>
          </div>
          <img
            className="photo-small"
            src="/assets/oats.jpg"
            alt="Bol de avena con frutos rojos"
          />
        </div>
        <div className="story-footer">
          <span>BIENESTAR QUE SE CONSTRUYE</span>
          <Leaf size={22} />
        </div>
      </aside>
      <main className="login-main">
        <div className="login-top">
          <Brand small />
          <span>Tu espacio de bienestar</span>
        </div>
        <div className="login-card">
          <span className="mini-label">
            <span />A TU RITMO, CONTIGO
          </span>
          <h2>
            Qué bien tenerte
            <br />
            por aquí<span className="olive-dot">.</span>
          </h2>
          <p className="login-intro">
            Cada pequeño paso cuenta. Vamos con el de hoy.
          </p>
          <div className="segmented" aria-label="Seleccionar perfil">
            {(
              [
                { key: "trainer", label: "Entrenador" },
                { key: "client", label: "Cliente" },
              ] as const
            ).map((p) => (
              <button
                key={p.key}
                className={p.key === role ? "active" : ""}
                aria-pressed={p.key === role}
                onClick={() => {
                  setRole(p.key);
                  setEmail(
                    p.key === "client"
                      ? "ana@fitcoach.demo"
                      : "lucia@fitcoach.demo",
                  );
                  setErrors({});
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <form onSubmit={submit} noValidate>
            <Field
              label="Email"
              type="email"
              autoComplete="username"
              icon={<Mail size={18} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
            />
            <div className="password-field">
              <Field
                label="Contraseña"
                type={show ? "text" : "password"}
                autoComplete="current-password"
                icon={<LockKeyhole size={18} />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
              />
              <button
                type="button"
                className="show-password"
                aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button
              type="button"
              className="forgot-link"
              onClick={() => {
                setResetEmail(email);
                setForgot(true);
              }}
            >
              ¿Olvidaste tu contraseña?
            </button>
            <Button type="submit">
              Iniciar sesión
              <ArrowRight size={19} />
            </Button>
          </form>
          <div className="demo-hint">
            <ShieldCheck size={17} />
            <span>
              Prototipo interactivo · datos de demostración
              <br />
              <span>Elige un perfil y entra para explorar.</span>
            </span>
          </div>
        </div>
        <div className="login-footnote">
          <Sprout size={16} />
          Un espacio para cuidarte, sin complicaciones.
        </div>
      </main>
      {forgot && (
        <Modal title="Recuperar contraseña" onClose={() => setForgot(false)}>
          <div className="recovery-icon">
            <LockKeyhole size={28} />
          </div>
          <p>
            Escribe el email de tu cuenta para solicitar un enlace de
            recuperación.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
                setResetError("Escribe un email válido.");
                return;
              }
              setForgot(false);
              notify("Simulación completada. No se ha enviado ningún email.");
            }}
            noValidate
          >
            <Field
              label="Email"
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              error={resetError}
            />
            <Button type="submit">
              Solicitar enlace
              <ArrowRight size={18} />
            </Button>
            <p className="form-hint">
              Esta demo no envía correos electrónicos.
            </p>
          </form>
        </Modal>
      )}
    </div>
  );
}
