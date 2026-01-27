import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '@/state/apiClient';
import Button from '@/components/ui/Button.jsx';
import Alert from '@/components/ui/Alert.jsx';
import { useToast } from '@/components/ui/Toast.jsx';
import { useAuth } from '@/state/AuthContext.jsx';
import ProviderSetupForm from '@/components/account/ProviderSetupForm.jsx';
import PortfolioManager from '@/components/account/PortfolioManager.jsx';
import imageCompression from 'browser-image-compression';
import { 
  HiUser, HiCamera, HiPhone, HiBadgeCheck, HiCog, HiBriefcase, 
  HiPhotograph, HiCurrencyDollar, HiCollection, HiSparkles,
  HiShieldCheck, HiUserCircle, HiSave, HiCheckCircle, HiStar
} from 'react-icons/hi';

export default function Profile() {
  const { t } = useTranslation();
  const { user, role, roles, viewRole, changeViewRole, clearError } = useAuth();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [portfolioKey, setPortfolioKey] = useState(0);

  const personalRef = useRef(null);
  const providerRef = useRef(null);
  const personalSectionRef = useRef(null);
  const providerSectionRef = useRef(null);

  const hasProvider = useMemo(() => (role === 'provider' || roles?.includes('provider')), [role, roles]);
  const initialTab = useMemo(() => {
    let s = (searchParams.get('section') || '').toLowerCase();
    if (!s && location?.hash) {
      s = location.hash.replace('#', '').toLowerCase();
    }
    if ((s === 'provider-setup' || s === 'provider') && hasProvider) return 'provider';
    return 'personal';
  }, [searchParams, location, hasProvider]);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [providerSubTab, setProviderSubTab] = useState('profile'); // 'profile' o 'portfolio'

  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '' });
  const [avatar, setAvatar] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarProgress, setAvatarProgress] = useState(0);

  useEffect(()=>{ clearError?.(); }, [clearError]);
  useEffect(()=>{
    if (user?.profile) {
      setForm({
        firstName: user.profile.firstName || '',
        lastName: user.profile.lastName || '',
        phone: user.profile.phone || ''
      });
      setAvatar(user.profile.avatar || '');
    }
  }, [user]);

  useEffect(() => {
    // Sync URL with tab
    const next = activeTab === 'provider' ? 'provider-setup' : 'personal';
    const current = searchParams.get('section');
    if (current !== next) {
      const sp = new URLSearchParams(searchParams);
      sp.set('section', next);
      setSearchParams(sp, { replace: true });
    }
    // Solo hacer focus sin scroll automático
    const target = activeTab === 'provider' ? providerSectionRef.current : personalSectionRef.current;
    if (target) {
      try { 
        const el = target.querySelector('h2,h3,input,button,textarea,select'); 
        el?.focus?.({ preventScroll: true }); 
      } catch { /* ignore */ }
    }
  }, [activeTab, searchParams, setSearchParams]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      // Incluir avatar en el payload aunque no haya cambiado
      await api.put('/auth/profile', { profile: { ...form, avatar } });
      toast.success(t('account.profile.profileUpdated'));
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo guardar');
    } finally { setSaving(false); }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast.error(t('account.profile.onlyImagesAllowed'));
      return;
    }

    setUploadingAvatar(true);
    setAvatarProgress(0);
    
    try {
      // Fase 1: Compresión (0-30%)
      console.log(`🖼️ Comprimiendo avatar: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      setAvatarProgress(5);
      
      const options = {
        maxSizeMB: 1, // Max 1MB para avatars
        maxWidthOrHeight: 800, // Max 800px para avatars
        useWebWorker: true,
        fileType: file.type,
        onProgress: (progress) => {
          // Mapear 0-100 de compresión a 5-30% del progreso total
          const mappedProgress = 5 + (progress * 0.25);
          setAvatarProgress(Math.floor(mappedProgress));
        }
      };
      
      const compressedFile = await imageCompression(file, options);
      console.log(`✅ Avatar comprimido: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
      setAvatarProgress(30);
      
      // Fase 2: Upload (30-90%)
      const fd = new FormData();
      fd.append('avatar', compressedFile, file.name);

      const { data } = await api.post('/uploads/avatar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          // Mapear 0-100 de upload a 30-90% del progreso total
          const mappedProgress = 30 + (percentCompleted * 0.6);
          setAvatarProgress(Math.floor(mappedProgress));
        }
      });

      // Fase 3: Procesamiento (90-95%)
      setAvatarProgress(95);
      const avatarUrl = data?.data?.avatar?.url;
      const cloudinaryId = data?.data?.avatar?.cloudinaryId;
      
      if (avatarUrl) {
        // Actualizar en el perfil
        await api.put('/auth/profile', { 
          profile: { 
            ...form, 
            avatar: avatarUrl,
            avatarCloudinaryId: cloudinaryId 
          } 
        });
        setAvatar(avatarUrl);
        // Actualizar el usuario en el contexto de autenticación para reflejar el cambio en todas las vistas
        if (typeof window !== 'undefined' && window.dispatchEvent) {
          window.dispatchEvent(new Event('auth:refresh'));
        }
        toast.success(t('account.profile.avatarUpdated'));
        setAvatarProgress(100);
        setTimeout(() => setAvatarProgress(0), 1000);
      }
    } catch (err) {
      console.error('Avatar upload error:', err);
      toast.error(err?.response?.data?.message || t('account.profile.avatarUploadError'));
      setAvatarProgress(0);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const saveAll = async () => {
    // Dispara el guardado de personal y proveedor
    try {
      personalRef.current?.requestSubmit?.();
      await providerRef.current?.submit?.();
      toast.success(t('account.profile.changesSaved'));
    } catch { /* ignore, los formularios ya muestran errores */ }
  };

  const { setAuthState } = useAuth();
  const handlePortfolioUpdate = useCallback(async () => {
    // Forzar re-render del PortfolioManager incrementando la key
    setPortfolioKey(prev => prev + 1);
    // Refrescar datos del usuario y actualizar el contexto global sin recargar la página
    try {
      const { data } = await api.get('/auth/me');
      if (data?.success && data?.data?.user && setAuthState) {
        setAuthState(data.data.user);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  }, [setAuthState]);

  const showProviderTab = hasProvider && (viewRole === 'provider' || activeTab === 'provider');

  // Role-based accent colors
  const getRoleAccent = () => {
    if (viewRole === 'admin') return {
      gradient: 'from-indigo-600 via-indigo-700 to-purple-700',
      lightGradient: 'from-indigo-50 to-purple-50',
      text: 'text-indigo-600',
      border: 'border-indigo-200',
      bg: 'bg-indigo-600',
      hoverBg: 'hover:bg-indigo-700',
      ring: 'ring-indigo-500/20',
      tabActive: 'bg-linear-to-r from-indigo-500 to-purple-500 text-white shadow-lg',
      tabInactive: 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
    };
    if (viewRole === 'provider') return {
      gradient: 'from-brand-500 via-brand-600 to-cyan-600',
      lightGradient: 'from-brand-50 to-cyan-50',
      text: 'text-brand-600',
      border: 'border-brand-200',
      bg: 'bg-brand-600',
      hoverBg: 'hover:bg-brand-700',
      ring: 'ring-brand-500/20',
      tabActive: 'bg-linear-to-r from-brand-500 to-cyan-500 text-white shadow-lg',
      tabInactive: 'text-gray-600 hover:text-brand-600 hover:bg-brand-50'
    };
    return {
      gradient: 'from-emerald-500 via-emerald-600 to-teal-600',
      lightGradient: 'from-emerald-50 to-teal-50',
      text: 'text-emerald-600',
      border: 'border-emerald-200',
      bg: 'bg-emerald-600',
      hoverBg: 'hover:bg-emerald-700',
      ring: 'ring-emerald-500/20',
      tabActive: 'bg-linear-to-r from-emerald-500 to-teal-500 text-white shadow-lg',
      tabInactive: 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'
    };
  };

  const accent = getRoleAccent();

  // Scroll al inicio cuando se carga la página para mostrar el header completo
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50/30 -mx-4 -mt-6 -mb-6">
      {/* Hero Header con gradiente premium - se extiende de borde a borde */}
      <div className={`relative bg-linear-to-br ${accent.gradient}`}>
        {/* Elementos decorativos animados */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-linear-to-r from-white/5 to-transparent rounded-full blur-3xl"></div>
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 sm:pt-10 sm:pb-20">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            {/* Avatar con efectos premium */}
            <div className="relative group flex flex-col items-center justify-center sm:block">
              {/* Glow effect */}
              <div className="absolute -inset-2 bg-white/30 rounded-full blur-xl group-hover:bg-white/40 transition-all duration-500"></div>
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-white/20 backdrop-blur-sm ring-4 ring-white/50 overflow-hidden shadow-2xl transition-all duration-300">
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <HiUserCircle className="w-20 h-20 text-white/70" />
                  </div>
                )}
                {/* Upload overlay */}
                <label className="absolute inset-0 bg-black/0 hover:bg-black/40 flex items-center justify-center cursor-pointer transition-all duration-300 opacity-0 hover:opacity-100">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    disabled={uploadingAvatar}
                    className="hidden"
                  />
                  <HiCamera className="w-8 h-8 text-white" />
                </label>
                {/* Upload progress */}
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                    <div className="w-16 h-16 relative">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="rgba(255,255,255,0.3)"
                          strokeWidth="3"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="white"
                          strokeWidth="3"
                          strokeDasharray={`${avatarProgress}, 100`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">{avatarProgress}%</span>
                    </div>
                  </div>
                )}
              </div>
              {/* Verified badge */}
              <div className="absolute -bottom-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                <HiBadgeCheck className={`w-6 h-6 ${accent.text}`} />
              </div>
            </div>
            
            {/* User info */}
            <div className="flex-1 text-center sm:text-left text-white mt-4 sm:mt-0">
              <h1 className="text-2xl sm:text-3xl font-bold drop-shadow-lg">
                {form.firstName || form.lastName ? `${form.firstName} ${form.lastName}` : 'Mi Perfil'}
              </h1>
              <p className="text-white/80 text-sm sm:text-base mt-1">
                {user?.email || 'Configura tu perfil'}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm`}>
                  <HiSparkles className="w-4 h-4" />
                  {viewRole === 'admin' ? t('account.profile.roles.admin') : viewRole === 'provider' ? t('account.profile.roles.provider') : t('account.profile.roles.client')}
                </span>
                {hasProvider && viewRole === 'provider' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm">
                    <HiShieldCheck className="w-4 h-4" />
                    {t('account.profile.verified')}
                  </span>
                )}
              </div>
            </div>
            
            {/* Quick actions */}
            {showProviderTab && activeTab === 'provider' && (
              <div className="w-full sm:w-auto sm:ml-auto mt-4 sm:mt-0 flex justify-center sm:block">
                <button
                  onClick={saveAll}
                  className="group flex items-center gap-2 px-5 py-2.5 bg-white text-gray-800 font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                >
                  <HiSave className="w-5 h-5 text-gray-600 group-hover:text-gray-800" />
                  {t('account.profile.saveAll')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="max-w-4xl mx-auto px-2 sm:px-6 lg:px-8 -mt-10 relative z-10 pb-8">
        {/* Tabs con diseño premium */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 overflow-hidden mb-6">
          <div className="flex items-center border-b border-gray-100 p-1.5 bg-gray-50/50">
            <button
              type="button"
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
                activeTab === 'personal' ? accent.tabActive : accent.tabInactive
              }`}
              onClick={() => setActiveTab('personal')}
            >
              <HiUser className="w-5 h-5" />
              {t('account.profile.tabs.personal')}
            </button>
            {showProviderTab && (
              <button
                type="button"
                className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
                  activeTab === 'provider' ? accent.tabActive : accent.tabInactive
                }`}
                onClick={() => setActiveTab('provider')}
              >
                <HiBriefcase className="w-5 h-5" />
                {t('account.profile.tabs.provider')}
              </button>
            )}
            <div className="ml-auto flex items-center gap-3 pr-2">
              {hasProvider && viewRole === 'provider' && (
                <>
                  <a href="/servicios" className={`flex items-center gap-1.5 text-sm font-medium ${accent.text} hover:underline`}>
                    <HiCollection className="w-4 h-4" />
                    {t('account.profile.links.services')}
                  </a>
                  <a href="/plan" className={`flex items-center gap-1.5 text-sm font-medium ${accent.text} hover:underline`}>
                    <HiCurrencyDollar className="w-4 h-4" />
                    {t('account.profile.links.plan')}
                  </a>
                </>
              )}
              <a href="/notificaciones" className={`flex items-center gap-1.5 text-sm font-medium ${accent.text} hover:underline`}>
                <HiCog className="w-4 h-4" />
                {t('account.profile.links.preferences')}
              </a>
            </div>
          </div>

          {/* Panel: Datos personales */}
          <section ref={personalSectionRef} hidden={activeTab !== 'personal'} className="p-6 sm:p-8">
            <div className="space-y-6">
              
              {/* Form fields con diseño premium */}
              <form ref={personalRef} onSubmit={onSave} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <HiUser className="w-4 h-4 text-gray-400" />
                      {t('account.profile.form.firstName')}
                    </label>
                    <input 
                      name="firstName" 
                      value={form.firstName} 
                      onChange={onChange} 
                      placeholder={t('account.profile.form.firstNamePlaceholder')}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white placeholder:text-gray-400"
                      style={{ '--tw-ring-color': viewRole === 'admin' ? '#6366f1' : viewRole === 'provider' ? '#0ea5e9' : '#10b981' }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <HiUser className="w-4 h-4 text-gray-400" />
                      {t('account.profile.form.lastName')}
                    </label>
                    <input 
                      name="lastName" 
                      value={form.lastName} 
                      onChange={onChange}
                      placeholder={t('account.profile.form.lastNamePlaceholder')} 
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white placeholder:text-gray-400"
                      style={{ '--tw-ring-color': viewRole === 'admin' ? '#6366f1' : viewRole === 'provider' ? '#0ea5e9' : '#10b981' }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <HiPhone className="w-4 h-4 text-gray-400" />
                    {t('account.profile.form.phone')}
                  </label>
                  <input 
                    name="phone" 
                    value={form.phone} 
                    onChange={onChange}
                    placeholder={t('account.profile.form.phonePlaceholder')} 
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white placeholder:text-gray-400"
                    style={{ '--tw-ring-color': viewRole === 'admin' ? '#6366f1' : viewRole === 'provider' ? '#0ea5e9' : '#10b981' }}
                  />
                </div>
                
                {error && <Alert type="error">{error}</Alert>}
                
                <div className="pt-4">
                  <button 
                    type="submit"
                    disabled={saving}
                    className={`group relative flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 bg-linear-to-r ${accent.gradient} text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden`}
                  >
                    <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
                    <span className="relative flex items-center gap-2">
                      {saving ? (
                        <>
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          {t('account.profile.saving')}
                        </>
                      ) : (
                        <>
                          <HiCheckCircle className="w-5 h-5" />
                          {t('account.profile.saveChanges')}
                        </>
                      )}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* Panel: Proveedor */}
          {showProviderTab && (
            <section ref={providerSectionRef} hidden={activeTab !== 'provider'} className="p-6 sm:p-8">
              {viewRole !== 'provider' && (
                <div className="mb-6 p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Contenido principal: icono + texto */}
                    <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                        <HiSparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                      </div>
                      <p className="text-sm text-amber-800 leading-relaxed">
                        {t('account.profile.clientModeWarning')}
                      </p>
                    </div>
                    {/* Botón de acción */}
                    <button 
                      type="button" 
                      className="px-3 sm:px-4 py-2 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors text-xs sm:text-sm whitespace-nowrap shrink-0 self-end sm:self-center"
                      onClick={() => changeViewRole('provider')}
                    >
                      {t('account.profile.switchMode')}
                    </button>
                  </div>
                </div>
              )}

              {/* Sub-tabs para Perfil y Portfolio con diseño premium */}
              <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl mb-6">
                <button
                  onClick={() => setProviderSubTab('profile')}
                  className={`flex items-center gap-2 flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    providerSubTab === 'profile'
                      ? 'bg-white text-gray-900 shadow-md'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <HiCog className="w-5 h-5" />
                  {t('account.profile.subTabs.businessProfile')}
                </button>
                <button
                  onClick={() => setProviderSubTab('portfolio')}
                  className={`flex items-center gap-2 flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    providerSubTab === 'portfolio'
                      ? 'bg-white text-gray-900 shadow-md'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <HiPhotograph className="w-5 h-5" />
                  {t('account.profile.subTabs.portfolio')}
                </button>
              </div>

              {/* Contenido: Perfil */}
              {providerSubTab === 'profile' && (
                <div className="space-y-6">
                  <div className={`bg-linear-to-br ${accent.lightGradient} rounded-2xl p-6 border ${accent.border}`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${accent.gradient} flex items-center justify-center shadow-lg shrink-0`}>
                        <HiBriefcase className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{t('account.profile.providerConfig.title')}</h3>
                        <p className="text-sm text-gray-600 mt-1">{t('account.profile.providerConfig.description')}</p>
                      </div>
                    </div>
                  </div>
                  
                  <ProviderSetupForm ref={providerRef} submitLabel="Guardar" />
                  
                  <div className={`flex items-center gap-2 p-4 bg-linear-to-r ${accent.lightGradient} rounded-xl border ${accent.border}`}>
                    <HiStar className={`w-5 h-5 ${accent.text}`} />
                    <p className="text-sm text-gray-700">
                      {viewRole === 'provider' ? (
                        <>También puedes gestionar tu <a className={`${accent.text} font-medium hover:underline`} href="/plan">plan</a> y tus <a className={`${accent.text} font-medium hover:underline`} href="/servicios">servicios</a>.</>
                      ) : (
                        <>Cambia a modo Proveedor para gestionar tu <span className="font-medium">plan</span> y tus <span className="font-medium">servicios</span>.</>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Contenido: Portfolio */}
              {providerSubTab === 'portfolio' && (
                <div>
                  <div className={`bg-linear-to-br ${accent.lightGradient} rounded-2xl p-6 border ${accent.border} mb-6`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${accent.gradient} flex items-center justify-center shadow-lg shrink-0`}>
                        <HiPhotograph className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{t('account.profile.portfolioSection.title')}</h3>
                        <p className="text-sm text-gray-600 mt-1">{t('account.profile.portfolioSection.description')}</p>
                      </div>
                    </div>
                  </div>
                  <PortfolioManager 
                    key={portfolioKey}
                    initialPortfolio={user?.providerProfile?.portfolio || []} 
                    onUpdate={handlePortfolioUpdate}
                  />
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

