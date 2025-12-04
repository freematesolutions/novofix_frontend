import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/state/apiClient.js';
import { useAuth } from '@/state/AuthContext.jsx';
import Alert from '@/components/ui/Alert.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import Button from '@/components/ui/Button.jsx';
import { HiBell, HiCheckCircle, HiMail, HiDeviceMobile, HiChat, HiCog, HiCheck, HiChevronLeft, HiChevronRight } from 'react-icons/hi';

export default function AdminAlerts() {
  const navigate = useNavigate();
  const { role, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [prefs, setPrefs] = useState({ email: true, push: true, sms: false });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const limit = 20;

  const load = async () => {
    if (!isAuthenticated || role !== 'admin') return;
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
  };

  const loadPrefs = async () => {
    try {
      const { data } = await api.get('/notifications/preferences');
      const p = data?.data?.preferences || {};
      setPrefs({ email: p.email ?? true, push: p.push ?? true, sms: p.sms ?? false });
    } catch {/* ignore */}
  };

  useEffect(()=>{ load(); /* eslint-disable-line */ }, [isAuthenticated, role, page]);
  useEffect(()=>{ if (isAuthenticated && role==='admin') loadPrefs(); }, [isAuthenticated, role]);

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      await load();
      window.dispatchEvent(new CustomEvent('notifications:updated'));
    } catch {/* ignore */}
  };

  const markAll = async () => {
    try {
      await api.put('/notifications/read-all');
      await load();
      window.dispatchEvent(new CustomEvent('notifications:updated'));
    } catch {/* ignore */}
  };

  const savePrefs = async () => {
    setSavingPrefs(true);
    try {
      await api.put('/notifications/preferences', prefs);
    } catch {/* ignore */}
    finally { setSavingPrefs(false); }
  };

  // Redirigir al inicio si no está autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  if (role !== 'admin') return <Alert type="warning">Solo administradores.</Alert>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="overflow-hidden bg-linear-to-br from-purple-600 via-fuchsia-600 to-indigo-600 rounded-2xl p-8 text-white relative">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-purple-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
              <HiBell className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-1">Alertas Administrativas</h1>
              <p className="text-indigo-200 text-sm">Centro de notificaciones del sistema</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl">
              <p className="text-2xl font-bold">{unreadCount}</p>
              <p className="text-xs text-indigo-200">Sin leer</p>
            </div>
            <button
              onClick={markAll}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl text-sm font-medium transition-all"
            >
              <HiCheckCircle className="w-4 h-4" />
              Marcar todas
            </button>
          </div>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Notificaciones</span>
            {loading && <Spinner size="sm" />}
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {items.map(n => (
            <div 
              key={n.id || n._id || Math.random()} 
              className={`p-4 transition-all duration-200 hover:bg-gray-50 ${!n.read ? 'bg-indigo-50/40 border-l-4 border-l-indigo-500' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${n.read ? 'bg-gray-100' : 'bg-linear-to-br from-indigo-500 to-purple-500'}`}>
                    <HiBell className={`w-5 h-5 ${n.read ? 'text-gray-500' : 'text-white'}`} />
                  </div>
                  <div className="min-w-0">
                    <p className={`font-medium ${n.read ? 'text-gray-700' : 'text-gray-900'}`}>
                      {n.title || 'Notificación'}
                    </p>
                    <p className="text-sm text-gray-600 mt-0.5">{n.message || n.body || '—'}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {n.createdAt ? new Date(n.createdAt).toLocaleString('es-AR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : ''}
                    </p>
                  </div>
                </div>
                {!n.read && (
                  <button 
                    onClick={() => markRead(n._id || n.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-100 hover:bg-indigo-200 rounded-lg transition-colors shrink-0"
                  >
                    <HiCheck className="w-3.5 h-3.5" />
                    Leída
                  </button>
                )}
              </div>
            </div>
          ))}
          {!items.length && !loading && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                <HiBell className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">Sin notificaciones</p>
              <p className="text-sm text-gray-400 mt-1">Las alertas del sistema aparecerán aquí</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="p-4 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <HiChevronLeft className="w-4 h-4" />
                Anterior
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-9 h-9 text-sm font-medium rounded-lg transition-colors ${
                        page === pageNum
                          ? 'bg-linear-to-r from-indigo-500 to-purple-500 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                disabled={page >= pages}
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
                <HiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Preferences Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <HiCog className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Preferencias de Notificación</h2>
              <p className="text-sm text-gray-500">Configura cómo recibir alertas</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PreferenceToggle
              icon={<HiMail className="w-5 h-5" />}
              label="Email"
              description="Recibir por correo"
              checked={prefs.email}
              onChange={(checked) => setPrefs(p => ({ ...p, email: checked }))}
            />
            <PreferenceToggle
              icon={<HiDeviceMobile className="w-5 h-5" />}
              label="Push"
              description="Notificaciones push"
              checked={prefs.push}
              onChange={(checked) => setPrefs(p => ({ ...p, push: checked }))}
            />
            <PreferenceToggle
              icon={<HiChat className="w-5 h-5" />}
              label="SMS"
              description="Mensajes de texto"
              checked={prefs.sms}
              onChange={(checked) => setPrefs(p => ({ ...p, sms: checked }))}
            />
          </div>
          <div className="mt-6 pt-6 border-t border-gray-100">
            <Button 
              onClick={savePrefs} 
              loading={savingPrefs}
              className="bg-linear-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
            >
              Guardar preferencias
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreferenceToggle({ icon, label, description, checked, onChange }) {
  return (
    <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
      checked ? 'border-indigo-500 bg-indigo-50/50' : 'border-gray-200 hover:border-gray-300'
    }`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
        checked ? 'bg-linear-to-br from-indigo-500 to-purple-500 text-white' : 'bg-gray-100 text-gray-500'
      }`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <div className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-indigo-500' : 'bg-gray-300'}`}>
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </div>
    </label>
  );
}
