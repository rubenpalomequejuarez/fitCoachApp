import { useState } from 'react';
import { api } from '../api.js';
import { Avatar, Button, Field, Input, Segmented, TextArea, TopBar, useAsync, useToast } from '../ui.jsx';
import { Icon } from '../icons.jsx';
import { YtImage } from '../shared.jsx';
import { DAYS, fileToDataUrl, parseYouTube, todayIdx } from '../utils.js';

// Formulario para crear un ejercicio (y asignarlo a uno o varios clientes) o editar uno existente.
export default function ExerciseForm({ exercise, clientId, onBack }) {
  const editing = !!exercise;
  const toast = useToast();
  const clients = useAsync(() => api.clients(), []);

  const [f, setF] = useState({
    name: exercise?.name || '',
    sets: String(exercise?.sets ?? 4),
    reps: String(exercise?.reps ?? '12'),
    rest: String(exercise?.rest ?? 60),
    day: exercise?.day ?? todayIdx(),
    description: exercise?.description || '',
    notes: exercise?.notes || '',
  });
  const [mediaType, setMediaType] = useState(exercise?.media?.type || 'video');
  const [videoUrl, setVideoUrl] = useState(exercise?.media?.type === 'video' ? exercise.media.url : '');
  const [image, setImage] = useState({ data: null, existing: exercise?.media?.type === 'image' ? exercise.media.url : null });
  const [selected, setSelected] = useState(clientId ? [clientId] : []);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const clearErr = (k) => setErrors((er) => (er[k] ? { ...er, [k]: undefined } : er));
  const set = (k) => (e) => { setF((s) => ({ ...s, [k]: e.target.value })); clearErr(k); };
  const yt = videoUrl.trim() ? parseYouTube(videoUrl) : null;
  const videoInvalid = videoUrl.trim() && !yt;
  const imageSrc = image.data || image.existing;

  async function pickImage(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setImage({ data: await fileToDataUrl(file), existing: null });
    } catch (err) {
      toast(err.message || 'No se ha podido leer la imagen', 'error');
    }
  }

  function validate() {
    const er = {};
    if (!f.name.trim()) er.name = 'Escribe el nombre del ejercicio';
    const sets = Number(f.sets);
    if (!Number.isInteger(sets) || sets < 1 || sets > 20) er.sets = '1 a 20';
    if (!f.reps.trim()) er.reps = 'Indica las repeticiones';
    const rest = Number(f.rest);
    if (f.rest === '' || !Number.isInteger(rest) || rest < 0 || rest > 600) er.rest = '0 a 600 s';
    if (mediaType === 'video' && videoInvalid) er.video = 'Pega un enlace de YouTube (youtube.com o youtu.be)';
    if (!editing && selected.length === 0) er.clients = 'Elige al menos un cliente';
    setErrors(er);
    return Object.keys(er).length === 0;
  }

  async function submit(e) {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;

    let media = null;
    if (mediaType === 'video' && yt) media = { type: 'video', url: videoUrl.trim() };
    if (mediaType === 'image') {
      if (image.data) media = { type: 'image', imageData: image.data };
      else if (image.existing) media = { type: 'image', url: image.existing };
    }
    const body = {
      name: f.name.trim(), sets: Number(f.sets), reps: f.reps.trim(), rest: Number(f.rest), day: f.day,
      description: f.description, notes: f.notes, media,
    };

    setBusy(true);
    try {
      if (editing) {
        await api.updateExercise(exercise.id, body);
        toast('Ejercicio actualizado');
      } else {
        await api.createExercise({ ...body, clientIds: selected });
        toast(selected.length === 1 ? 'Ejercicio asignado al cliente' : `Ejercicio asignado a ${selected.length} clientes`);
      }
      onBack();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm('¿Eliminar este ejercicio? El cliente dejará de verlo.')) return;
    setBusy(true);
    try {
      await api.deleteExercise(exercise.id);
      toast('Ejercicio eliminado');
      onBack();
    } catch (err) {
      setFormError(err.message);
      setBusy(false);
    }
  }

  const toggleClient = (id) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
    clearErr('clients');
  };

  return (
    <form className="screen" onSubmit={submit} noValidate>
      <TopBar title={editing ? 'Editar ejercicio' : 'Nuevo ejercicio'} onBack={onBack} />
      <div className="scroll">
        <Input label="Nombre del ejercicio" value={f.name} onChange={set('name')} placeholder="Sentadilla goblet" error={errors.name} />

        <div className="grid3">
          <Input label="Series" type="number" inputMode="numeric" min="1" max="20" value={f.sets} onChange={set('sets')} error={errors.sets} />
          <Input label="Repeticiones" value={f.reps} onChange={set('reps')} placeholder="12" error={errors.reps} />
          <Input label="Descanso (s)" type="number" inputMode="numeric" min="0" max="600" value={f.rest} onChange={set('rest')} error={errors.rest} />
        </div>

        <Field label="Día de la semana">
          <div className="daypills">
            {DAYS.map((d, i) => (
              <button key={d} type="button" className={`daypill${f.day === i ? ' active' : ''}`} aria-pressed={f.day === i} onClick={() => setF((s) => ({ ...s, day: i }))}>{d}</button>
            ))}
          </div>
        </Field>

        <Field label="Recurso explicativo">
          <Segmented value={mediaType} onChange={setMediaType} options={[{ value: 'image', label: 'Subir imagen' }, { value: 'video', label: 'Enlace de vídeo' }]} />
        </Field>

        {mediaType === 'video' ? (
          <>
            <Field label="Enlace de YouTube (vídeo privado o no listado)" error={errors.video || (videoInvalid ? 'No parece un enlace de YouTube' : '')}
              hint={yt ? undefined : 'El vídeo no se incrusta: se abre en YouTube, así la app es más ligera.'}>
              <div className="input-wrap">
                <input
                  className={`input${videoInvalid ? ' has-error' : yt ? ' is-valid' : ''}`}
                  aria-label="Enlace de YouTube"
                  placeholder="https://youtu.be/…"
                  inputMode="url"
                  value={videoUrl}
                  onChange={(e) => { setVideoUrl(e.target.value); clearErr('video'); }}
                />
                {yt && <span className="adorn ok"><Icon name="check" size={20} strokeWidth={2.5} /></span>}
              </div>
              {yt && <span className="field-msg ok">Enlace válido · vídeo de YouTube</span>}
            </Field>
            {yt && (
              <div className="preview">
                <div className="thumb"><YtImage videoId={yt.videoId} /><Icon name="play" size={22} strokeWidth={2.5} style={{ position: 'relative' }} /></div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>Vista previa de la miniatura</div>
                  <div className="sub" style={{ fontSize: 12 }}>El cliente lo abre en YouTube</div>
                </div>
              </div>
            )}
          </>
        ) : (
          <label className="upload">
            {imageSrc ? <img src={imageSrc} alt="Vista previa de la imagen" /> : (
              <>
                <Icon name="upload" size={26} />
                <span>Toca para elegir una imagen</span>
                <span style={{ fontSize: 12 }}>PNG, JPG o WebP</span>
              </>
            )}
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={pickImage} aria-label="Subir imagen" />
          </label>
        )}

        <TextArea label="Descripción técnica" value={f.description} onChange={set('description')} placeholder="Cómo se hace el ejercicio paso a paso" />
        <TextArea label="Notas para el cliente" value={f.notes} onChange={set('notes')} placeholder="Consejos, errores a evitar…" />

        {!editing && (
          <Field label="Asignar a" error={errors.clients}>
            {clients.loading ? <span className="sub">Cargando clientes…</span> : clients.error ? <span className="field-msg err">{clients.error}</span> : (
              <div className="chips">
                {clients.data.clients.map((c) => {
                  const on = selected.includes(c.id);
                  return (
                    <button key={c.id} type="button" className={`chip toggle${on ? ' on' : ''}`} aria-pressed={on} onClick={() => toggleClient(c.id)}>
                      {on && <Icon name="check" size={14} strokeWidth={3} />}{c.name}
                    </button>
                  );
                })}
              </div>
            )}
          </Field>
        )}

        {formError && <div className="form-error" role="alert">{formError}</div>}
        {editing && <Button variant="danger" icon="trash" onClick={remove} disabled={busy}>Eliminar ejercicio</Button>}
      </div>
      <div className="footer">
        <Button type="submit" variant="accent" loading={busy}>
          {editing ? 'Guardar cambios' : selected.length > 1 ? `Asignar a ${selected.length} clientes` : 'Asignar a cliente'}
        </Button>
      </div>
    </form>
  );
}
