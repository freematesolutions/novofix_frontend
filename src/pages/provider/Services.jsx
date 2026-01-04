import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/state/apiClient';
import Button from '@/components/ui/Button.jsx';
import Alert from '@/components/ui/Alert.jsx';
import { useToast } from '@/components/ui/Toast.jsx';
import { useAuth } from '@/state/AuthContext.jsx';
import { SERVICE_CATEGORIES } from '@/utils/categories.js';

export default function Services() {
  const navigate = useNavigate();
  const { viewRole, clearError, isAuthenticated, isRoleSwitching } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState({ category: '', experience: 0, subcategories: '' });

  useEffect(()=>{ clearError?.(); }, [clearError]);

  // Convertir las 26 categorías a formato { value, label }
  const categoryOptions = useMemo(() => 
    SERVICE_CATEGORIES.map(cat => ({ value: cat, label: cat })),
    []
  );

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true); setError('');
    try {
      const { data } = await api.get('/auth/profile');
      const list = data?.data?.user?.providerProfile?.services || [];
      setServices(list);
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo cargar servicios');
    } finally { setLoading(false); }
  }, [isAuthenticated]);

  useEffect(()=>{ if (isAuthenticated) load(); }, [isAuthenticated, load]);

  const addService = async (e) => {
    e.preventDefault(); setError('');
    if (!newService.category) {
      setError('Selecciona una categoría');
      return;
    }
    const payloadServices = [
      ...services,
      {
        category: newService.category,
        experience: Number(newService.experience) || 0,
        subcategories: newService.subcategories
          ? newService.subcategories.split(',').map(s=>s.trim()).filter(Boolean)
          : []
      }
    ];
    try {
      setLoading(true);
      await api.put('/auth/profile', { services: payloadServices });
      toast.success('Servicio añadido');
      setNewService({ category: '', experience: 0, subcategories: '' });
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo añadir');
    } finally { setLoading(false); }
  };

  const removeService = async (idx) => {
    setError('');
    const payloadServices = services.filter((_, i)=> i !== idx);
    try {
      setLoading(true);
      await api.put('/auth/profile', { services: payloadServices });
      toast.info('Servicio eliminado');
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo eliminar');
    } finally { setLoading(false); }
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

  // Durante transición de rol, no mostrar mensaje de advertencia
  if (isRoleSwitching) {
    return null;
  }

  if (viewRole !== 'provider') {
    return (
      <div className="max-w-xl mx-auto">
        <Alert type="warning">Esta sección es para proveedores.</Alert>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 sm:p-6">
      {/* Premium Header */}
      <div className="overflow-hidden rounded-2xl bg-linear-to-br from-brand-500 via-brand-600 to-cyan-600 p-6 sm:p-8 text-white relative">
        {/* Decorative elements (non-interactive) */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative flex items-start gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-linear-to-br from-brand-500 to-cyan-500 text-white shadow-xl shadow-brand-500/25">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Mis servicios</h1>
            <p className="text-sm sm:text-base text-brand-100">Gestiona las categorías de servicios que ofreces y tu experiencia</p>
          </div>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {/* Add Service Form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-brand-100 to-cyan-100 text-brand-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Añadir nuevo servicio</h3>
        </div>
        
        <form className="space-y-5" onSubmit={addService}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Category */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Categoría
              </label>
              <select
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300 transition-all"
                value={newService.category}
                onChange={(e)=>setNewService((s)=>({ ...s, category: e.target.value }))}
              >
                <option value="">Selecciona una categoría</option>
                {categoryOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            
            {/* Experience */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                Experiencia (años)
              </label>
              <input
                type="number"
                min="0"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300 transition-all"
                value={newService.experience}
                onChange={(e)=>setNewService((s)=>({ ...s, experience: e.target.value }))}
                placeholder="0"
              />
            </div>
          </div>
          
          {/* Subcategories */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              Subcategorías (opcional)
            </label>
            <input
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300 transition-all"
              placeholder="Ej: Instalación, Reparación, Mantenimiento (separadas por comas)"
              value={newService.subcategories}
              onChange={(e)=>setNewService((s)=>({ ...s, subcategories: e.target.value }))}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-linear-to-r from-brand-500 to-cyan-500 hover:from-brand-600 hover:to-cyan-600 text-white text-sm font-medium shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                Guardando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Añadir servicio
              </>
            )}
          </button>
        </form>
      </div>

      {/* Services List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-cyan-100 to-blue-100 text-cyan-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">Servicios actuales</h3>
            <p className="text-sm text-gray-500">{services.length} servicio{services.length !== 1 ? 's' : ''} registrado{services.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        
        {services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-gray-100 to-gray-200 mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-1">No hay servicios</h4>
            <p className="text-sm text-gray-500 text-center max-w-sm">
              Añade tus primeros servicios para que los clientes sepan qué ofreces
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {services.map((s, idx) => (
              <div key={idx} className="group relative bg-linear-to-br from-gray-50/80 to-white rounded-xl border border-gray-100 hover:border-brand-200 hover:shadow-md transition-all duration-300 p-4">
                {/* Accent bar */}
                <div className="absolute top-0 left-0 w-1 h-full bg-linear-to-b from-brand-500 to-cyan-500 rounded-l-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex items-center justify-between gap-4 pl-2">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-linear-to-br from-brand-100 to-cyan-100 text-brand-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <h4 className="font-semibold text-gray-900 capitalize">{s.category}</h4>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 ml-12">
                      {s.subcategories?.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {s.subcategories.map((sub, subIdx) => (
                            <span key={subIdx} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-linear-to-r from-cyan-50 to-blue-50 border border-cyan-100 text-xs font-medium text-cyan-700">
                              {sub}
                            </span>
                          ))}
                        </div>
                      )}
                      {typeof s.experience === 'number' && s.experience > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-100 text-xs font-medium text-amber-700">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {s.experience} año{s.experience !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => removeService(idx)}
                    disabled={loading}
                    className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-100 hover:border-red-200 text-sm font-medium text-red-600 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
