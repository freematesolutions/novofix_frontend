import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import api from '@/state/apiClient.js';
import Button from '@/components/ui/Button.jsx';
import MapPicker from '@/components/ui/MapPicker.jsx';
import Alert from '@/components/ui/Alert.jsx';
import { useToast } from '@/components/ui/Toast.jsx';
import { useAuth } from '@/state/AuthContext.jsx';

const ProviderSetupForm = forwardRef(function ProviderSetupForm({ onCompleted, submitLabel = 'Guardar', upgradeIfClient = false }, ref) {
  const { user, role, registerProvider } = useAuth();
  const toast = useToast();

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
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
          throw new Error('No se pudo activar el modo proveedor');
        }
      } else {
        await api.put('/auth/profile', payload);
      }

      // Disparar evento para refrescar el usuario en AuthContext
      window.dispatchEvent(new Event('auth:refresh'));
      
      toast.success('Perfil de proveedor actualizado');
      if (typeof onCompleted === 'function') onCompleted();
      return true;
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo guardar');
      return false;
    } finally { setSaving(false); }
  };

  useImperativeHandle(ref, () => ({
    submit: () => onSave(),
  }));

  return (
    <form onSubmit={onSave} className="space-y-4">
      <div>
        <label className="block text-sm text-gray-600 mb-1">Nombre comercial</label>
        <input name="businessName" value={form.businessName} onChange={onChange} className="w-full border rounded-md px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">Descripción</label>
        <textarea name="description" value={form.description} onChange={onChange} rows={3} className="w-full border rounded-md px-3 py-2" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Zona (etiqueta)</label>
          <input name="serviceAreaZone" value={form.serviceAreaZone} onChange={onChange} className="w-full border rounded-md px-3 py-2" placeholder="Ej: Centro" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Radio (millas)</label>
          <input name="radius" type="number" min="1" max="60" value={form.radius} onChange={onChange} className="w-full border rounded-md px-3 py-2" />
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-2">Ubicación (haz clic en el mapa o usa tu ubicación)</label>
        <MapPicker
          value={(form.lat !== '' && form.lng !== '') ? { lat: Number(form.lat), lng: Number(form.lng) } : null}
          onChange={(c)=> setForm((f)=>({ ...f, lat: c.lat, lng: c.lng }))}
          height={300}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Latitud</label>
            <input name="lat" value={form.lat} onChange={onChange} className="w-full border rounded-md px-3 py-2" placeholder="Ej: -34.6037" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Longitud</label>
            <input name="lng" value={form.lng} onChange={onChange} className="w-full border rounded-md px-3 py-2" placeholder="Ej: -58.3816" />
          </div>
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">Teléfono</label>
        <input name="phone" value={form.phone} onChange={onChange} className="w-full border rounded-md px-3 py-2" />
      </div>
      {error && <Alert type="error">{error}</Alert>}
      <div className="flex justify-end">
        <Button loading={saving}>{saving ? 'Guardando...' : submitLabel}</Button>
      </div>
    </form>
  );
});

export default ProviderSetupForm;
