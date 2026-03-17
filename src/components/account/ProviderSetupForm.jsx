import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/state/apiClient.js';
import Button from '@/components/ui/Button.jsx';
import MapPicker from '@/components/ui/MapPicker.jsx';
import Alert from '@/components/ui/Alert.jsx';
import { useToast } from '@/components/ui/Toast.jsx';
import { useAuth } from '@/state/AuthContext.jsx';

const ProviderSetupForm = forwardRef(function ProviderSetupForm({ onCompleted, submitLabel, upgradeIfClient = false }, ref) {
  const { t } = useTranslation();
  const { user, role, registerProvider } = useAuth();
  const toast = useToast();
  const resolvedSubmitLabel = submitLabel || t('account.profile.saveChanges');

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [geocodingLocation, setGeocodingLocation] = useState('');
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [form, setForm] = useState({
    businessName: '',
    description: '',
    serviceAreaZone: '',
    radius: 15,
    phone: '',
    lat: '',
    lng: ''
  });

  useEffect(() => {
    if (user?.providerProfile || user?.profile) {
      setForm((f) => ({
        ...f,
        businessName: user?.providerProfile?.businessName || user?.profile?.firstName || '',
        description: user?.providerProfile?.description || '',
        serviceAreaZone: user?.providerProfile?.serviceArea?.zones?.[0] || '',
        radius: user?.providerProfile?.serviceArea?.radius || 15,
        lat: user?.providerProfile?.serviceArea?.coordinates?.lat || '',
        lng: user?.providerProfile?.serviceArea?.coordinates?.lng || '',
        phone: user?.profile?.phone || ''
      }));
    }
  }, [user]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Geocoding reverso: convertir coordenadas en nombre de lugar
  const reverseGeocode = async (latitude, longitude) => {
    setGeocodingLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
        { headers: { 'Accept-Language': 'es' } }
      );
      if (response.ok) {
        const data = await response.json();
        const address = data.address || {};
        const locationName = 
          address.neighbourhood || 
          address.suburb || 
          address.district || 
          address.city || 
          address.town || 
          address.village || 
          address.state || 
          data.display_name?.split(',')[0] || 
          t('onboarding.coverage.locationSelected');
        setGeocodingLocation(locationName);
        // Auto-actualizar zona de servicio con la ubicación detectada
        setForm((f) => ({ ...f, serviceAreaZone: locationName }));
      }
    } catch {
      setGeocodingLocation('');
    } finally {
      setGeocodingLoading(false);
    }
  };

  // Ejecutar geocoding reverso al cargar si hay coordenadas del usuario
  useEffect(() => {
    const lat = user?.providerProfile?.serviceArea?.coordinates?.lat;
    const lng = user?.providerProfile?.serviceArea?.coordinates?.lng;
    if (lat && lng) {
      reverseGeocode(Number(lat), Number(lng));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleMapChange = (coords) => {
    setForm((f) => ({ ...f, lat: coords.lat, lng: coords.lng }));
    reverseGeocode(coords.lat, coords.lng);
  };

  const onSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSaving(true); setError('');
    try {
      const payload = {
        profile: { firstName: form.businessName, phone: form.phone },
        businessName: form.businessName,
        description: form.description,
        services: user?.providerProfile?.services || [],
        additionalServices: user?.providerProfile?.additionalServices || [],
        serviceArea: {
          zones: form.serviceAreaZone ? [form.serviceAreaZone] : [],
          radius: Number(form.radius) || 15,
          coordinates: (form.lat !== '' && form.lng !== '' && !isNaN(Number(form.lat)) && !isNaN(Number(form.lng)))
            ? { lat: Number(form.lat), lng: Number(form.lng) }
            : undefined
        }
      };

      // If upgrading from client to provider, try the upgrade path to ensure role is granted
      if (upgradeIfClient && role !== 'provider') {
        const ok = await registerProvider({
          businessName: payload.businessName,
          description: payload.description,
          services: payload.services,
          additionalServices: payload.additionalServices,
          serviceArea: payload.serviceArea,
          phone: form.phone
        });
        if (!ok) {
          throw new Error(t('account.providerSetup.activateError'));
        }
      } else {
        await api.put('/auth/profile', payload);
      }

      // Disparar evento para refrescar el usuario en AuthContext
      window.dispatchEvent(new Event('auth:refresh'));
      
      toast.success(t('account.providerSetup.profileUpdated'));
      if (typeof onCompleted === 'function') onCompleted();
      return true;
    } catch (err) {
      setError(err?.response?.data?.message || t('account.providerSetup.saveError'));
      return false;
    } finally { setSaving(false); }
  };

  useImperativeHandle(ref, () => ({
    submit: () => onSave(),
  }));

  return (
    <form onSubmit={onSave} className="space-y-4">
      <div>
        <label className="block text-sm text-gray-600 mb-1">{t('account.providerSetup.businessName')}</label>
        <input name="businessName" value={form.businessName} onChange={onChange} className="w-full border rounded-md px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">{t('account.providerSetup.description')}</label>
        <textarea name="description" value={form.description} onChange={onChange} rows={3} className="w-full border rounded-md px-3 py-2" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">{t('account.providerSetup.zone')}</label>
          <input name="serviceAreaZone" value={form.serviceAreaZone} onChange={onChange} className="w-full border rounded-md px-3 py-2" placeholder={t('account.providerSetup.zonePlaceholder')} />
          <p className="text-xs text-gray-400 mt-1">{t('account.providerSetup.zoneAutoHint')}</p>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">{t('account.providerSetup.radius')}</label>
          <input name="radius" type="number" min="1" max="60" value={form.radius} onChange={onChange} className="w-full border rounded-md px-3 py-2" />
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-2">{t('account.providerSetup.locationLabel')}</label>
        <MapPicker
          value={(form.lat !== '' && form.lng !== '') ? { lat: Number(form.lat), lng: Number(form.lng) } : null}
          onChange={handleMapChange}
          height={300}
        />
        {/* Indicador de ubicación detectada */}
        {(form.lat !== '' && form.lng !== '') && (
          <div className="mt-2 flex items-center gap-2 text-sm text-green-700">
            <span>📍</span>
            {geocodingLoading ? (
              <span className="text-gray-500">{t('onboarding.coverage.detecting')}</span>
            ) : geocodingLocation ? (
              <span>{geocodingLocation}</span>
            ) : (
              <span>{t('onboarding.coverage.locationMarked')}</span>
            )}
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">{t('account.providerSetup.phone')}</label>
        <input name="phone" value={form.phone} onChange={onChange} className="w-full border rounded-md px-3 py-2" />
      </div>
      {error && <Alert type="error">{error}</Alert>}
      <div className="flex justify-end">
        <Button loading={saving}>{saving ? t('account.providerSetup.saving') : resolvedSubmitLabel}</Button>
      </div>
    </form>
  );
});

export default ProviderSetupForm;
