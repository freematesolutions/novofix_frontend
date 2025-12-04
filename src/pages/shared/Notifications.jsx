import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '@/state/apiClient.js';
import Spinner from '@/components/ui/Spinner.jsx';
import Button from '@/components/ui/Button.jsx';
import { 
  HiBell, 
  HiCheckCircle, 
  HiMail, 
  HiDeviceMobile, 
  HiChat,
  HiCurrencyDollar,
  HiCalendar,
  HiStar,
  HiExclamation,
  HiChevronLeft,
  HiChevronRight,
  HiCog,
  HiCheck,
  HiSparkles,
  HiExternalLink,
  HiEye
} from 'react-icons/hi';

// Función para obtener icono y estilo según tipo de notificación
const getNotificationStyle = (type, title, message) => {
  const text = `${title || ''} ${message || ''}`.toLowerCase();
  
  if (type === 'payment' || text.includes('pago') || text.includes('transacción')) {
    return { icon: HiCurrencyDollar, bgColor: 'bg-emerald-100', iconColor: 'text-emerald-600', borderColor: 'border-emerald-200' };
  }
  if (type === 'booking' || text.includes('reserva') || text.includes('cita')) {
    return { icon: HiCalendar, bgColor: 'bg-blue-100', iconColor: 'text-blue-600', borderColor: 'border-blue-200' };
  }
  if (type === 'review' || text.includes('reseña') || text.includes('calificación')) {
    return { icon: HiStar, bgColor: 'bg-amber-100', iconColor: 'text-amber-600', borderColor: 'border-amber-200' };
  }
  if (type === 'message' || text.includes('mensaje')) {
    return { icon: HiChat, bgColor: 'bg-purple-100', iconColor: 'text-purple-600', borderColor: 'border-purple-200' };
  }
  if (type === 'alert' || text.includes('alerta') || text.includes('urgente')) {
    return { icon: HiExclamation, bgColor: 'bg-red-100', iconColor: 'text-red-600', borderColor: 'border-red-200' };
  }
  return { icon: HiBell, bgColor: 'bg-brand-100', iconColor: 'text-brand-600', borderColor: 'border-brand-200' };
};

// Función para formatear tiempo relativo
const getRelativeTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'Ahora mismo';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  
  const pad = (v) => String(v).padStart(2,'0');
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
};

export default function Notifications() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [prefs, setPrefs] = useState({ email: true, push: true, sms: false });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.get(`/notifications?page=${page}&limit=${limit}`);
      const notifications = data?.data?.notifications || [];
      const pg = data?.data?.pagination;
      setItems(notifications);
      setPages(pg?.pages || 1);
      setUnreadCount(data?.data?.unreadCount || 0);
    } catch (e) {
      setError(e?.response?.data?.message || 'No se pudieron cargar las notificaciones');
    } finally { setLoading(false); }
  }, [page, limit]);

  const loadPrefs = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications/preferences');
      const p = data?.data?.preferences || {};
      setPrefs({ email: p.email ?? true, push: p.push ?? true, sms: p.sms ?? false });
    } catch {/* ignore */}
  }, []);

  useEffect(()=>{ load(); }, [load]);
  useEffect(()=>{ loadPrefs(); }, [loadPrefs]);

  useEffect(() => {
    const handler = () => load();
    window.addEventListener('notifications:updated', handler);
    return () => window.removeEventListener('notifications:updated', handler);
  }, [load]);

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      await load();
      window.dispatchEvent(new CustomEvent('notifications:updated'));
    } catch {/* ignore */}
  };

  const markAll = async () => {
    setMarkingAll(true);
    try {
      await api.put('/notifications/read-all');
      await load();
      window.dispatchEvent(new CustomEvent('notifications:updated'));
    } catch {/* ignore */}
    finally { setMarkingAll(false); }
  };

  const savePrefs = async () => {
    setSavingPrefs(true);
    try {
      await api.put('/notifications/preferences', prefs);
    } catch {/* ignore */}
    finally { setSavingPrefs(false); }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-brand-50/30">
      {/* Header con gradiente premium */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-r from-brand-600 via-brand-700 to-indigo-700"></div>
        <div className="absolute inset-0 opacity-50" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}></div>
        
        <div className="relative max-w-4xl mx-auto px-4 py-8 sm:py-12">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                <HiBell className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Mis Notificaciones</h1>
                <p className="text-brand-100 mt-1">
                  {unreadCount > 0 
                    ? `Tienes ${unreadCount} notificación${unreadCount > 1 ? 'es' : ''} sin leer`
                    : 'Estás al día con todas tus notificaciones'
                  }
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                </span>
                <span className="text-white font-medium">{unreadCount} nuevas</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 -mt-4">
        {/* Error state */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 text-red-700 p-4 shadow-sm">
            <HiExclamation className="w-5 h-5 shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center gap-3 py-8 text-gray-600">
            <Spinner size="sm"/>
            <span className="text-sm font-medium">Cargando notificaciones...</span>
          </div>
        )}

        {/* Lista de notificaciones */}
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden">
          {/* Cabecera de la lista */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2">
              <HiSparkles className="w-5 h-5 text-brand-500" />
              <span className="font-medium text-gray-700">Actividad reciente</span>
            </div>
            {items.length > 0 && unreadCount > 0 && (
              <button
                onClick={markAll}
                disabled={markingAll}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <HiCheckCircle className="w-4 h-4" />
                {markingAll ? 'Marcando...' : 'Marcar todas como leídas'}
              </button>
            )}
          </div>

          {/* Notificaciones */}
          <div className="divide-y divide-gray-100">
            {items.map((n, index) => {
              const style = getNotificationStyle(n.type, n.title, n.message || n.body);
              const IconComponent = style.icon;
              
              return (
                <div 
                  key={n.id || n._id || index} 
                  className={`
                    group p-4 sm:p-5 flex items-start gap-4 transition-all duration-300
                    hover:bg-gray-50/80
                    ${!n.read ? 'bg-brand-50/30 border-l-4 border-l-brand-500' : 'border-l-4 border-l-transparent'}
                  `}
                >
                  {/* Icono */}
                  <div className={`shrink-0 p-2.5 rounded-xl ${style.bgColor} ${style.borderColor} border transition-transform duration-300 group-hover:scale-110`}>
                    <IconComponent className={`w-5 h-5 ${style.iconColor}`} />
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm sm:text-base font-medium truncate ${!n.read ? 'text-gray-900' : 'text-gray-700'}`}>
                      {n.title || 'Notificación'}
                    </h4>
                    <p className={`text-sm mt-0.5 ${!n.read ? 'text-gray-700' : 'text-gray-500'} wrap-break-word`}>
                      {n.message || n.body || '—'}
                    </p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <HiCalendar className="w-3.5 h-3.5" />
                        {getRelativeTime(n.createdAt)}
                      </span>
                      {!n.read && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-100 text-brand-700 text-xs font-medium rounded-full">
                          <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse"></span>
                          Nueva
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="shrink-0 flex flex-col sm:flex-row items-end sm:items-center gap-2">
                    {!n.read && (
                      <button
                        onClick={() => markRead(n._id || n.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
                      >
                        <HiEye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Marcar leída</span>
                      </button>
                    )}
                    {(() => {
                      const raw = n?.data?.actionUrl;
                      if (!raw) return null;
                      const to = raw.includes('/provider/onboarding') ? '/perfil?section=provider-setup' : raw;
                      return (
                        <Link 
                          to={to} 
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg transition-all duration-200"
                        >
                          <HiExternalLink className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Abrir</span>
                        </Link>
                      );
                    })()}
                    {n.read && !n?.data?.actionUrl && (
                      <div className="p-1">
                        <HiCheck className="w-4 h-4 text-gray-300" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Estado vacío */}
            {!items.length && !loading && (
              <div className="py-16 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <HiBell className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Sin notificaciones</h3>
                <p className="text-sm text-gray-500">
                  Aquí verás las actualizaciones de tu actividad
                </p>
              </div>
            )}
          </div>

          {/* Paginación */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-3 px-5 py-4 bg-gray-50/50 border-t border-gray-100">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
              >
                <HiChevronLeft className="w-4 h-4" />
                Anterior
              </button>
              <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg">
                <span className="text-sm font-medium text-brand-600">{page}</span>
                <span className="text-sm text-gray-400">/</span>
                <span className="text-sm text-gray-600">{pages}</span>
              </div>
              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page >= pages}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
              >
                Siguiente
                <HiChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Preferencias de notificación */}
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <HiCog className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Preferencias de notificación</h3>
              <p className="text-sm text-gray-500">Elige cómo quieres recibir tus notificaciones</p>
            </div>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              {/* Email */}
              <label className={`
                relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                ${prefs.email 
                  ? 'border-brand-500 bg-brand-50/50 shadow-sm shadow-brand-100' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}>
                <input 
                  type="checkbox" 
                  checked={prefs.email} 
                  onChange={(e) => setPrefs(p => ({...p, email: e.target.checked}))}
                  className="sr-only"
                />
                <div className={`p-2.5 rounded-lg transition-colors duration-200 ${prefs.email ? 'bg-brand-100' : 'bg-gray-100'}`}>
                  <HiMail className={`w-5 h-5 transition-colors duration-200 ${prefs.email ? 'text-brand-600' : 'text-gray-400'}`} />
                </div>
                <div className="flex-1">
                  <span className={`block font-medium transition-colors duration-200 ${prefs.email ? 'text-brand-700' : 'text-gray-700'}`}>
                    Email
                  </span>
                  <span className="text-xs text-gray-500">Correo electrónico</span>
                </div>
                {prefs.email && (
                  <div className="absolute top-2 right-2">
                    <HiCheckCircle className="w-5 h-5 text-brand-500" />
                  </div>
                )}
              </label>

              {/* Push */}
              <label className={`
                relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                ${prefs.push 
                  ? 'border-brand-500 bg-brand-50/50 shadow-sm shadow-brand-100' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}>
                <input 
                  type="checkbox" 
                  checked={prefs.push} 
                  onChange={(e) => setPrefs(p => ({...p, push: e.target.checked}))}
                  className="sr-only"
                />
                <div className={`p-2.5 rounded-lg transition-colors duration-200 ${prefs.push ? 'bg-brand-100' : 'bg-gray-100'}`}>
                  <HiBell className={`w-5 h-5 transition-colors duration-200 ${prefs.push ? 'text-brand-600' : 'text-gray-400'}`} />
                </div>
                <div className="flex-1">
                  <span className={`block font-medium transition-colors duration-200 ${prefs.push ? 'text-brand-700' : 'text-gray-700'}`}>
                    Push
                  </span>
                  <span className="text-xs text-gray-500">Navegador web</span>
                </div>
                {prefs.push && (
                  <div className="absolute top-2 right-2">
                    <HiCheckCircle className="w-5 h-5 text-brand-500" />
                  </div>
                )}
              </label>

              {/* SMS */}
              <label className={`
                relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                ${prefs.sms 
                  ? 'border-brand-500 bg-brand-50/50 shadow-sm shadow-brand-100' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}>
                <input 
                  type="checkbox" 
                  checked={prefs.sms} 
                  onChange={(e) => setPrefs(p => ({...p, sms: e.target.checked}))}
                  className="sr-only"
                />
                <div className={`p-2.5 rounded-lg transition-colors duration-200 ${prefs.sms ? 'bg-brand-100' : 'bg-gray-100'}`}>
                  <HiDeviceMobile className={`w-5 h-5 transition-colors duration-200 ${prefs.sms ? 'text-brand-600' : 'text-gray-400'}`} />
                </div>
                <div className="flex-1">
                  <span className={`block font-medium transition-colors duration-200 ${prefs.sms ? 'text-brand-700' : 'text-gray-700'}`}>
                    SMS
                  </span>
                  <span className="text-xs text-gray-500">Mensajes de texto</span>
                </div>
                {prefs.sms && (
                  <div className="absolute top-2 right-2">
                    <HiCheckCircle className="w-5 h-5 text-brand-500" />
                  </div>
                )}
              </label>
            </div>

            <div className="flex justify-end">
              <button 
                onClick={savePrefs}
                disabled={savingPrefs}
                className="inline-flex items-center gap-2 bg-linear-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-brand-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-brand-500/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {savingPrefs ? (
                  <>
                    <Spinner size="sm" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <HiCheck className="w-4 h-4" />
                    Guardar preferencias
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
