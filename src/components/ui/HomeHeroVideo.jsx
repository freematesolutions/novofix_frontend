// components/ui/HomeHeroVideo.jsx
//
// Sección de video administrable en el Home (Req 16).
// Soporta:
//   - Video subido a Cloudinary o MP4/WebM externo (etiqueta <video>).
//   - Embed de YouTube y Vimeo (iframe responsive 16:9).
// Si el setting está deshabilitado o vacío, NO renderiza nada (fallback graceful).

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import useHomeHeroVideo from '@/state/useHomeHeroVideo.js';

function toYouTubeEmbed(url) {
  try {
    const u = new URL(url);
    // youtu.be/<id>
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.replace(/^\//, '').split('/')[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    // youtube.com/watch?v=<id>
    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${id}`;
      // youtube.com/embed/<id> ya viene listo
      if (u.pathname.startsWith('/embed/')) return url;
    }
  } catch { /* noop */ }
  return null;
}

function toVimeoEmbed(url) {
  try {
    const u = new URL(url);
    if (!u.hostname.includes('vimeo.com')) return null;
    if (u.hostname.includes('player.vimeo.com')) return url;
    const id = u.pathname.split('/').filter(Boolean)[0];
    return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
  } catch { return null; }
}

export default function HomeHeroVideo() {
  const { t, i18n } = useTranslation();
  const { data, loading } = useHomeHeroVideo();

  const computed = useMemo(() => {
    if (!data?.enabled || !data?.videoUrl) return null;
    const provider = data.provider || 'external';
    const title = (i18n.language || '').startsWith('en')
      ? (data.titleEn || data.titleEs || '')
      : (data.titleEs || data.titleEn || '');
    if (provider === 'youtube') {
      const embed = toYouTubeEmbed(data.videoUrl);
      return embed ? { kind: 'iframe', src: embed, title } : null;
    }
    if (provider === 'vimeo') {
      const embed = toVimeoEmbed(data.videoUrl);
      return embed ? { kind: 'iframe', src: embed, title } : null;
    }
    // cloudinary / external (mp4/webm)
    return { kind: 'video', src: data.videoUrl, poster: data.posterUrl || null, title };
  }, [data, i18n.language]);

  // Loading: no metemos esqueleto para no empujar el layout. Si no hay video, nada.
  if (loading || !computed) return null;

  return (
    <section
      aria-label={computed.title || t('home.heroVideo.aria', 'Video destacado de NovoFix')}
      className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10"
    >
      <div className="relative w-full rounded-3xl overflow-hidden shadow-xl bg-black aspect-video">
        {computed.kind === 'iframe' ? (
          <iframe
            src={computed.src}
            title={computed.title || 'NovoFix'}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
        ) : (
          <video
            src={computed.src}
            poster={computed.poster || undefined}
            controls
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover bg-black"
          >
            {t('home.heroVideo.unsupported', 'Tu navegador no soporta video HTML5.')}
          </video>
        )}
      </div>
      {computed.title ? (
        <h2 className="mt-4 text-lg sm:text-xl font-semibold text-gray-900 text-center">
          {computed.title}
        </h2>
      ) : null}
    </section>
  );
}
