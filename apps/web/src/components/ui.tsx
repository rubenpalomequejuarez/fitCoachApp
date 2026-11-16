import { useEffect, useRef, useId } from "react";
import type {
  ReactNode,
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Leaf,
  X,
  Search,
  Utensils,
  Dumbbell,
  Users,
  BookOpen,
  LogOut,
} from "lucide-react";
import type { Role, Client } from "../types";
export function Brand({ small = false }: { small?: boolean }) {
  return (
    <div className={`brand ${small ? "brand-small" : ""}`}>
      <span className="brand-icon">
        <Leaf size={small ? 20 : 26} strokeWidth={1.7} />
      </span>
      <span>
        fitcoach<span className="brand-dot">.</span>
      </span>
    </div>
  );
}
export function Button({
  variant = "primary",
  children,
  icon,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "accent" | "secondary" | "ghost";
  icon?: ReactNode;
}) {
  return (
    <button type="button" className={`button button-${variant}`} {...props}>
      {icon}
      {children}
    </button>
  );
}
export function Field({
  label,
  error,
  hint,
  icon,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
}) {
  const id = useId();
  return (
    <div className={`field ${error ? "field-error" : ""}`}>
      <label htmlFor={id}>{label}</label>
      <div className="input-wrap">
        {icon}
        <input
          id={id}
          aria-invalid={!!error}
          aria-describedby={error || hint ? `${id}-hint` : undefined}
          {...props}
        />
      </div>
      {(error || hint) && (
        <small id={`${id}-hint`} role={error ? "alert" : undefined}>
          {error || hint}
        </small>
      )}
    </div>
  );
}
export function TextArea({
  label,
  hint,
  error,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
  error?: string;
}) {
  const id = useId();
  return (
    <div className={`field ${error ? "field-error" : ""}`}>
      <label htmlFor={id}>{label}</label>
      <textarea
        id={id}
        aria-invalid={!!error}
        aria-describedby={error || hint ? `${id}-hint` : undefined}
        {...props}
      />
      {(error || hint) && (
        <small id={`${id}-hint`} role={error ? "alert" : undefined}>
          {error || hint}
        </small>
      )}
    </div>
  );
}
export function SearchField({
  value,
  onChange,
  placeholder = "Buscar…",
}: {
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="search-field">
      <Search size={18} />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button aria-label="Borrar búsqueda" onClick={() => onChange("")}>
          <X size={16} />
        </button>
      )}
    </label>
  );
}
export function Avatar({
  client,
  size = "md",
}: {
  client: Pick<Client, "name" | "initials" | "tone">;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <span
      aria-label={client.name}
      className={`avatar avatar-${size} avatar-${client.tone}`}
    >
      {client.initials}
    </span>
  );
}
export function PageTitle({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
export function Back({
  onClick,
  label = "Volver",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button className="back-button" onClick={onClick}>
      <ArrowLeft size={18} />
      {label}
    </button>
  );
}
export function EmptyState({
  type,
  title,
  description,
  action,
}: {
  type: "diet" | "exercise" | "clients";
  title: string;
  description: string;
  action?: ReactNode;
}) {
  const Icon =
    type === "diet" ? Utensils : type === "exercise" ? Dumbbell : Users;
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon size={34} strokeWidth={1.3} />
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
      <span className="empty-sprig">
        <Leaf size={64} strokeWidth={0.7} />
      </span>
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
  footer,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const titleId = useId();
  useEffect(() => {
    const prev = document.activeElement as HTMLElement;
    const root = ref.current;
    (
      root?.querySelector<HTMLElement>(
        ".modal-body input,.modal-body select,.modal-body textarea",
      ) || root?.querySelector<HTMLElement>("button")
    )?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab" && root) {
        const els = Array.from(
          root.querySelectorAll<HTMLElement>(
            'button:not(:disabled),input:not(:disabled),textarea,select,a[href],[tabindex="0"]',
          ),
        );
        const a = els[0],
          b = els.at(-1);
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault();
          b?.focus();
        } else if (!e.shiftKey && document.activeElement === b) {
          e.preventDefault();
          a?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      prev?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header>
          <h2 id={titleId}>{title}</h2>
          <button className="icon-button" aria-label="Cerrar" onClick={onClose}>
            <X size={22} />
          </button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer>{footer}</footer>}
      </div>
    </div>
  );
}
export function Toast({ text }: { text: string }) {
  return (
    <div className="toast" role="status">
      <Check size={18} />
      {text}
    </div>
  );
}
export const navItems = (role: Role) =>
  role === "client"
    ? [
        { key: "diet", label: "Dieta semanal", icon: Utensils },
        { key: "exercises", label: "Ejercicios", icon: Dumbbell },
      ]
    : [
        { key: "clients", label: "Clientes", icon: Users },
        { key: "exercises", label: "Ejercicios", icon: Dumbbell },
        { key: "diets", label: "Dietas", icon: BookOpen },
      ];
export function Nav({
  role,
  active,
  onNavigate,
  mobile = false,
}: {
  role: Role;
  active: string;
  onNavigate: (key: string) => void;
  mobile?: boolean;
}) {
  return (
    <nav
      className={mobile ? "bottom-nav" : "side-nav"}
      aria-label="Navegación principal"
    >
      {navItems(role).map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          aria-current={key === active ? "page" : undefined}
          className={key === active ? "active" : ""}
          onClick={() => onNavigate(key)}
        >
          <Icon size={21} strokeWidth={1.7} />
          <span>{label}</span>
          {!mobile && key === active && <ChevronRight size={16} />}
        </button>
      ))}
    </nav>
  );
}
export function Logout({ onClick }: { onClick: () => void }) {
  return (
    <button className="logout" onClick={onClick}>
      <LogOut size={18} />
      Cerrar sesión
    </button>
  );
}
export function LinkArrow({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button className="text-link" onClick={onClick}>
      {children}
      <ArrowRight size={15} />
    </button>
  );
}
