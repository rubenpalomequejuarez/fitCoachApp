import { useState } from 'react';
import { Icon } from './icons.jsx';
import { ytThumb } from './utils.js';

// Miniatura cuadrada de un ejercicio en las listas.
export function ExTile({ media, size = '' }) {
  if (media?.type === 'image' && media.url) {
    return <div className={`tile ${size}`}><img src={media.url} alt="" loading="lazy" /></div>;
  }
  if (media?.type === 'video') {
    return <div className={`tile video ${size}`}><Icon name="play" size={22} /></div>;
  }
  return <div className={`tile ${size}`}><Icon name="image" size={22} /></div>;
}

// Imagen de YouTube que se oculta si el vídeo es privado y no tiene miniatura pública.
export function YtImage({ videoId, className = 'cover' }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <img
      className={className}
      src={ytThumb(videoId)}
      alt=""
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      onLoad={(e) => { if (e.currentTarget.naturalWidth <= 120) setFailed(true); }}
    />
  );
}

// Bloque grande de recurso explicativo: imagen o enlace a YouTube (no se incrusta el vídeo).
export function Media({ media }) {
  if (media?.type === 'video') {
    return (
      <a className="media" href={media.url} target="_blank" rel="noopener noreferrer" aria-label="Ver vídeo en YouTube">
        <YtImage videoId={media.videoId} />
        <span className="playbtn"><Icon name="play" size={28} strokeWidth={2.5} /></span>
        <span className="badge"><Icon name="youtube" size={16} /> Se abre en YouTube</span>
      </a>
    );
  }
  if (media?.type === 'image' && media.url) {
    return <div className="media"><img className="cover" src={media.url} alt="Imagen explicativa del ejercicio" /></div>;
  }
  return (
    <div className="media">
      <div className="ph"><Icon name="image" size={48} strokeWidth={1.5} />Sin imagen ni vídeo</div>
    </div>
  );
}
