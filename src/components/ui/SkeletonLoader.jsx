import { useTranslation } from 'react-i18next';

/**
 * SkeletonLoader — Sistema de indicadores de carga tipo skeleton con efecto shimmer.
 * Reemplaza los spinners giratorios para dar una sensación más fluida y moderna.
 *
 * Variantes disponibles:
 * - <SkeletonLoader />              → Bloque individual
 * - <PageSkeleton />                → Fallback de Suspense (ruta lazy)
 * - <CardSkeleton />                → Tarjeta de proveedor
 * - <FeaturedProviderSkeleton />    → Carrusel de profesionales destacados
 * - <ListSkeleton />                → Lista de solicitudes/propuestas/reservas
 * - <SearchResultSkeleton />        → Resultados de búsqueda
 * - <NotificationSkeleton />        → Notificaciones
 * - <ReviewSkeleton />              → Reseñas
 * - <ProfileOverlaySkeleton />      → Overlay de carga de perfil
 * - <CalendarSkeleton />            → Calendario/slots
 * - <ChatListSkeleton />            → Lista de chats
 * - <DetailSkeleton />              → Detalle de solicitud/propuesta
 * - <AdminSkeleton />               → Dashboard admin
 */

/* ─── Bloque base skeleton con shimmer ─── */
function SkeletonLoader({ className = '', width, height, rounded = 'rounded-lg', style = {} }) {
  return (
    <div
      className={`skeleton-shimmer ${rounded} ${className}`}
      style={{ width, height, ...style }}
      aria-hidden="true"
    />
  );
}

/* ─── PageSkeleton — Fallback de Suspense para rutas lazy ─── */
export function PageSkeleton() {
  const { t } = useTranslation();
  return (
    <div className="animate-fade-in space-y-6 py-4" role="status" aria-label={t('common.loadingContent')}>
      {/* Barra de título */}
      <div className="flex items-center gap-3">
        <SkeletonLoader className="h-8 w-8 shrink-0" rounded="rounded-lg" />
        <SkeletonLoader className="h-6 w-48 sm:w-64" />
      </div>
      {/* Bloque de contenido */}
      <div className="space-y-4">
        <SkeletonLoader className="h-4 w-full" />
        <SkeletonLoader className="h-4 w-5/6" />
        <SkeletonLoader className="h-4 w-3/4" />
      </div>
      {/* Cards placeholder */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        {[1, 2].map(i => (
          <div key={i} className="rounded-2xl border border-gray-100 bg-white p-4 space-y-3">
            <SkeletonLoader className="h-32 w-full" rounded="rounded-xl" />
            <SkeletonLoader className="h-4 w-3/4" />
            <SkeletonLoader className="h-3 w-1/2" />
          </div>
        ))}
      </div>
      <span className="sr-only">{t('common.loadingContent')}</span>
    </div>
  );
}

/* ─── CardSkeleton — Tarjeta de proveedor individual ─── */
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 space-y-3" aria-hidden="true">
      <div className="flex items-center gap-3">
        <SkeletonLoader className="w-12 h-12 shrink-0" rounded="rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonLoader className="h-4 w-32" />
          <SkeletonLoader className="h-3 w-20" />
        </div>
        <SkeletonLoader className="h-6 w-16" rounded="rounded-full" />
      </div>
      <SkeletonLoader className="h-3 w-full" />
      <SkeletonLoader className="h-3 w-4/5" />
      <div className="flex gap-2 pt-1">
        <SkeletonLoader className="h-7 w-20" rounded="rounded-full" />
        <SkeletonLoader className="h-7 w-24" rounded="rounded-full" />
        <SkeletonLoader className="h-7 w-16" rounded="rounded-full" />
      </div>
    </div>
  );
}

/* ─── FeaturedProviderSkeleton — Carrusel de destacados ─── */
export function FeaturedProviderSkeleton({ count = 4 }) {
  const { t } = useTranslation();
  return (
    <div className="animate-fade-in" role="status" aria-label={t('common.loadingContent')}>
      <div className="flex gap-4 overflow-hidden pl-4 sm:pl-6 lg:pl-8 pr-4 sm:pr-6 lg:pr-8 pb-4">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="shrink-0 w-[260px] sm:w-[300px] rounded-2xl border border-gray-100 bg-white p-4 space-y-3"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            {/* Avatar + info */}
            <div className="flex items-center gap-3">
              <SkeletonLoader className="w-14 h-14 shrink-0" rounded="rounded-xl" />
              <div className="flex-1 space-y-2">
                <SkeletonLoader className="h-4 w-28" />
                <SkeletonLoader className="h-3 w-16" />
              </div>
            </div>
            {/* Rating */}
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(s => (
                <SkeletonLoader key={s} className="w-4 h-4" rounded="rounded-sm" />
              ))}
              <SkeletonLoader className="h-4 w-8 ml-2" />
            </div>
            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
              <SkeletonLoader className="h-6 w-20" rounded="rounded-full" />
              <SkeletonLoader className="h-6 w-16" rounded="rounded-full" />
            </div>
            {/* Button */}
            <SkeletonLoader className="h-9 w-full" rounded="rounded-xl" />
          </div>
        ))}
      </div>
      <span className="sr-only">{t('common.loadingContent')}</span>
    </div>
  );
}

/* ─── SearchResultSkeleton — Resultados de búsqueda ─── */
export function SearchResultSkeleton({ count = 3 }) {
  const { t } = useTranslation();
  return (
    <div className="animate-fade-in space-y-4" role="status" aria-label={t('common.loadingContent')}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
      <span className="sr-only">{t('common.loadingContent')}</span>
    </div>
  );
}

/* ─── ListSkeleton — Lista genérica (solicitudes, reservas, propuestas) ─── */
export function ListSkeleton({ count = 3, variant = 'default' }) {
  const { t } = useTranslation();
  return (
    <div
      className="animate-fade-in bg-white/60 backdrop-blur-xl rounded-3xl border border-brand-100/40 shadow-lg p-4 sm:p-6 space-y-4"
      role="status"
      aria-label={t('common.loadingContent')}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl border border-gray-50 bg-white"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          {/* Icono/avatar */}
          <SkeletonLoader
            className={`shrink-0 ${variant === 'booking' ? 'w-12 h-12' : 'w-10 h-10'}`}
            rounded={variant === 'booking' ? 'rounded-xl' : 'rounded-lg'}
          />
          {/* Contenido */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <SkeletonLoader className="h-4 w-32 sm:w-48" />
              <SkeletonLoader className="h-5 w-16" rounded="rounded-full" />
            </div>
            <SkeletonLoader className="h-3 w-full" />
            <SkeletonLoader className="h-3 w-2/3" />
            {variant === 'booking' && (
              <div className="flex gap-2 pt-1">
                <SkeletonLoader className="h-7 w-20" rounded="rounded-lg" />
                <SkeletonLoader className="h-7 w-24" rounded="rounded-lg" />
              </div>
            )}
          </div>
        </div>
      ))}
      <span className="sr-only">{t('common.loadingContent')}</span>
    </div>
  );
}

/* ─── NotificationSkeleton — Notificaciones ─── */
export function NotificationSkeleton({ count = 4 }) {
  const { t } = useTranslation();
  return (
    <div className="animate-fade-in space-y-1" role="status" aria-label={t('common.loadingContent')}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-3 sm:p-4 rounded-xl">
          <SkeletonLoader className="w-9 h-9 shrink-0" rounded="rounded-full" />
          <div className="flex-1 space-y-2">
            <SkeletonLoader className="h-3.5 w-4/5" />
            <SkeletonLoader className="h-3 w-3/5" />
            <SkeletonLoader className="h-2.5 w-20" />
          </div>
        </div>
      ))}
      <span className="sr-only">{t('common.loadingContent')}</span>
    </div>
  );
}

/* ─── ReviewSkeleton — Reseñas ─── */
export function ReviewSkeleton({ count = 3 }) {
  const { t } = useTranslation();
  return (
    <div
      className="animate-fade-in bg-white/60 backdrop-blur-xl rounded-3xl border border-brand-100/40 shadow-lg p-4 sm:p-6 space-y-4"
      role="status"
      aria-label={t('common.loadingContent')}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-4 rounded-2xl border border-gray-50 bg-white">
          <SkeletonLoader className="w-10 h-10 shrink-0" rounded="rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <SkeletonLoader className="h-4 w-28" />
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <SkeletonLoader key={s} className="w-3.5 h-3.5" rounded="rounded-sm" />
                ))}
              </div>
            </div>
            <SkeletonLoader className="h-3 w-full" />
            <SkeletonLoader className="h-3 w-3/4" />
            <SkeletonLoader className="h-2.5 w-24" />
          </div>
        </div>
      ))}
      <span className="sr-only">{t('common.loadingContent')}</span>
    </div>
  );
}

/* ─── DetailSkeleton — Detalle de solicitud/propuesta ─── */
export function DetailSkeleton() {
  const { t } = useTranslation();
  return (
    <div className="animate-fade-in space-y-5" role="status" aria-label={t('common.loadingContent')}>
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <SkeletonLoader className="w-12 h-12 shrink-0" rounded="rounded-xl" />
          <div className="flex-1 space-y-2">
            <SkeletonLoader className="h-5 w-48" />
            <SkeletonLoader className="h-3 w-32" />
          </div>
          <SkeletonLoader className="h-7 w-20" rounded="rounded-full" />
        </div>
        <SkeletonLoader className="h-3 w-full" />
        <SkeletonLoader className="h-3 w-5/6" />
        <SkeletonLoader className="h-3 w-2/3" />
      </div>
      {/* Content blocks */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <SkeletonLoader className="h-4 w-36" />
        <div className="grid grid-cols-2 gap-3">
          <SkeletonLoader className="h-20" rounded="rounded-xl" />
          <SkeletonLoader className="h-20" rounded="rounded-xl" />
        </div>
      </div>
      {/* Action buttons */}
      <div className="flex gap-3">
        <SkeletonLoader className="h-10 flex-1" rounded="rounded-xl" />
        <SkeletonLoader className="h-10 flex-1" rounded="rounded-xl" />
      </div>
      <span className="sr-only">{t('common.loadingContent')}</span>
    </div>
  );
}

/* ─── ProfileOverlaySkeleton — Overlay de carga de perfil ─── */
export function ProfileOverlaySkeleton() {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" role="status" aria-label={t('common.loadingContent')}>
      <div className="bg-white rounded-2xl p-6 shadow-2xl w-72 space-y-4">
        <div className="flex items-center gap-3">
          <SkeletonLoader className="w-14 h-14 shrink-0" rounded="rounded-full" />
          <div className="flex-1 space-y-2">
            <SkeletonLoader className="h-4 w-28" />
            <SkeletonLoader className="h-3 w-20" />
          </div>
        </div>
        <SkeletonLoader className="h-3 w-full" />
        <SkeletonLoader className="h-3 w-4/5" />
        <SkeletonLoader className="h-9 w-full" rounded="rounded-xl" />
      </div>
    </div>
  );
}

/* ─── CalendarSkeleton — Slots de calendario ─── */
export function CalendarSkeleton() {
  const { t } = useTranslation();
  return (
    <div className="animate-fade-in space-y-3" role="status" aria-label={t('common.loadingContent')}>
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-50 bg-white">
          <SkeletonLoader className="w-10 h-10 shrink-0" rounded="rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <SkeletonLoader className="h-3.5 w-32" />
            <SkeletonLoader className="h-3 w-24" />
          </div>
          <SkeletonLoader className="h-7 w-16" rounded="rounded-lg" />
        </div>
      ))}
      <span className="sr-only">{t('common.loadingContent')}</span>
    </div>
  );
}

/* ─── ChatListSkeleton — Lista de conversaciones ─── */
export function ChatListSkeleton({ count = 4 }) {
  const { t } = useTranslation();
  return (
    <div className="animate-fade-in space-y-1" role="status" aria-label={t('common.loadingContent')}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
          <SkeletonLoader className="w-10 h-10 shrink-0" rounded="rounded-full" />
          <div className="flex-1 min-w-0 space-y-1.5">
            <SkeletonLoader className="h-3.5 w-28" />
            <SkeletonLoader className="h-3 w-40" />
          </div>
          <SkeletonLoader className="h-2.5 w-10" />
        </div>
      ))}
      <span className="sr-only">{t('common.loadingContent')}</span>
    </div>
  );
}

/* ─── AdminSkeleton — Dashboard admin ─── */
export function AdminSkeleton() {
  const { t } = useTranslation();
  return (
    <div className="animate-fade-in space-y-6" role="status" aria-label={t('common.loadingContent')}>
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
            <SkeletonLoader className="h-3 w-20" />
            <SkeletonLoader className="h-7 w-16" />
          </div>
        ))}
      </div>
      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-50">
          <SkeletonLoader className="h-4 w-32" />
        </div>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center gap-3 p-4 border-b border-gray-50 last:border-0">
            <SkeletonLoader className="w-8 h-8 shrink-0" rounded="rounded-full" />
            <SkeletonLoader className="h-3.5 flex-1" />
            <SkeletonLoader className="h-5 w-16" rounded="rounded-full" />
          </div>
        ))}
      </div>
      <span className="sr-only">{t('common.loadingContent')}</span>
    </div>
  );
}

/* ─── TestimonialSkeleton — Testimonios ─── */
export function TestimonialSkeleton() {
  const { t } = useTranslation();
  return (
    <div className="animate-fade-in" role="status" aria-label={t('common.loadingContent')}>
      <div className="flex gap-4 overflow-hidden pb-4">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="shrink-0 w-[280px] sm:w-[320px] rounded-2xl border border-gray-100 bg-white p-5 space-y-3"
          >
            <div className="flex items-center gap-3">
              <SkeletonLoader className="w-10 h-10 shrink-0" rounded="rounded-full" />
              <div className="flex-1 space-y-1.5">
                <SkeletonLoader className="h-3.5 w-24" />
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <SkeletonLoader key={s} className="w-3 h-3" rounded="rounded-sm" />
                  ))}
                </div>
              </div>
            </div>
            <SkeletonLoader className="h-3 w-full" />
            <SkeletonLoader className="h-3 w-full" />
            <SkeletonLoader className="h-3 w-3/5" />
          </div>
        ))}
      </div>
      <span className="sr-only">{t('common.loadingContent')}</span>
    </div>
  );
}

/* ─── InviteSearchSkeleton — Búsqueda de profesionales en modal de invitación ─── */
export function InviteSearchSkeleton({ count = 3 }) {
  const { t } = useTranslation();
  return (
    <div className="animate-fade-in space-y-3 py-4" role="status" aria-label={t('common.loadingContent')}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-50">
          <SkeletonLoader className="w-10 h-10 shrink-0" rounded="rounded-full" />
          <div className="flex-1 space-y-1.5">
            <SkeletonLoader className="h-3.5 w-28" />
            <SkeletonLoader className="h-3 w-20" />
          </div>
          <SkeletonLoader className="h-8 w-20" rounded="rounded-lg" />
        </div>
      ))}
      <span className="sr-only">{t('common.loadingContent')}</span>
    </div>
  );
}

export default SkeletonLoader;
