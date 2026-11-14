import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Icon } from './icons.jsx';
import { initials } from './utils.js';

export function Avatar({ name, size = 44, tone = 'solid' }) {
  return (
    <div className={`avatar ${tone}`} style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}>
      {initials(name)}
    </div>
  );
}

export function Button({ variant = 'primary', icon, loading, children, className = '', ...p }) {
  return (
    <button type="button" {...p} className={`btn btn-${variant} ${className}`} disabled={loading || p.disabled}>
      {icon && <Icon name={icon} size={18} />}
      {loading ? 'Un momento…' : children}
    </button>
  );
}

// Botón pequeño en forma de píldora (p. ej. "Añadir cliente").
export function Pill({ icon, children, variant = 'solid', ...p }) {
  return (
    <button type="button" {...p} className={`pill pill-${variant}`}>
      {icon && <Icon name={icon} size={14} strokeWidth={2.5} />}
      {children}
    </button>
  );
}

export function Field({ label, error, hint, children }) {
  return (
    <div className="field">
      {label && <span className="field-label">{label}</span>}
      {children}
      {error ? <span className="field-msg err" role="alert">{error}</span> : hint ? <span className="field-msg">{hint}</span> : null}
    </div>
  );
}

export function Input({ label, error, hint, ...p }) {
  return (
    <Field label={label} error={error} hint={hint}>
      <input className={`input${error ? ' has-error' : ''}`} aria-label={label} {...p} />
    </Field>
  );
}

export function TextArea({ label, error, hint, rows = 3, ...p }) {
  return (
    <Field label={label} error={error} hint={hint}>
      <textarea className={`input textarea${error ? ' has-error' : ''}`} rows={rows} aria-label={label} {...p} />
    </Field>
  );
}

export function Segmented({ options, value, onChange }) {
  return (
    <div className="seg" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          className={value === o.value ? 'active' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function TopBar({ title, onBack, right }) {
  return (
    <div className="topbar">
      {onBack && (
        <button type="button" className="round-btn" onClick={onBack} aria-label="Volver">
          <Icon name="left" size={22} />
        </button>
      )}
      <h1>{title}</h1>
      {right}
    </div>
  );
}

export function TabBar({ tabs, active, onChange }) {
  return (
    <nav className="tabbar">
      {tabs.map((t) => (
        <button key={t.id} type="button" className={active === t.id ? 'active' : ''} onClick={() => onChange(t.id)}>
          <Icon name={t.icon} size={24} />
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

export function Empty({ icon = 'image', title, text, action }) {
  return (
    <div className="empty">
      <div className="empty-icon"><Icon name={icon} size={28} /></div>
      <strong>{title}</strong>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

export const Loading = () => <div className="center muted">Cargando…</div>;

export function ErrorState({ message, onRetry }) {
  return (
    <div className="empty">
      <strong>No se han podido cargar los datos</strong>
      <p>{message}</p>
      {onRetry && <Button variant="secondary" onClick={onRetry}>Reintentar</Button>}
    </div>
  );
}

// Carga de datos con estados de carga y error.
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const run = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fnRef.current();
      setState({ loading: false, error: null, data });
    } catch (e) {
      setState({ loading: false, error: e.message, data: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { run(); }, [run]);
  const setData = useCallback((d) => setState((s) => ({ ...s, data: typeof d === 'function' ? d(s.data) : d })), []);
  return { ...state, reload: run, setData };
}

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef();
  const show = useCallback((message, type = 'ok') => {
    clearTimeout(timer.current);
    setToast({ message, type, id: Date.now() });
    timer.current = setTimeout(() => setToast(null), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {toast && (
        <div key={toast.id} className={`toast toast-${toast.type}`} role="status">
          {toast.message}
        </div>
      )}
    </ToastCtx.Provider>
  );
}
