import { useState, useEffect } from 'react';
import { useProviderOnboarding } from '@/state/ProviderOnboardingContext.jsx';
import Button from '@/components/ui/Button.jsx';
import Alert from '@/components/ui/Alert.jsx';
import MapPicker from '@/components/ui/MapPicker.jsx';

export default function CoverageStep() {
  const { 
    formData, 
    updateFormData, 
    saveStep,
    prevStep,
    loading, 
    error 
  } = useProviderOnboarding();

  const [serviceAreaZone, setServiceAreaZone] = useState(formData.serviceAreaZone || '');
  const [radius, setRadius] = useState(formData.radius || 15);
  const [lat, setLat] = useState(formData.lat || '');
  const [lng, setLng] = useState(formData.lng || '');
  const [serviceMode, setServiceMode] = useState(formData.serviceMode || 'both');
  const [geocodingLocation, setGeocodingLocation] = useState('');
  const [geocodingLoading, setGeocodingLoading] = useState(false);

  useEffect(() => {
    updateFormData({ 
      serviceAreaZone, 
      radius, 
      lat, 
      lng,
      serviceMode 
    });
  }, [serviceAreaZone, radius, lat, lng, serviceMode, updateFormData]);

  // Geocoding reverso: convertir coordenadas en nombre de lugar
  const reverseGeocode = async (latitude, longitude) => {
    setGeocodingLoading(true);
    try {
      // Usar Nominatim de OpenStreetMap (gratuito)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'es'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        
        // Extraer el nombre más relevante del lugar
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
          'Ubicación seleccionada';
        
        setGeocodingLocation(locationName);
        // Auto-rellenar el campo de zona de servicio si está vacío
        if (!serviceAreaZone || serviceAreaZone.trim() === '') {
          setServiceAreaZone(locationName);
        }
      }
    } catch (err) {
      console.warn('Geocoding reverso falló:', err);
      setGeocodingLocation('');
    } finally {
      setGeocodingLoading(false);
    }
  };

  const handleMapChange = (coords) => {
    setLat(coords.lat);
    setLng(coords.lng);
    // Ejecutar geocoding reverso
    reverseGeocode(coords.lat, coords.lng);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await saveStep(2);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Modalidad de servicio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Modalidad de servicio <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setServiceMode('presencial')}
            className={`
              p-4 rounded-lg border-2 transition-all
              ${serviceMode === 'presencial'
                ? 'border-brand-600 bg-brand-50'
                : 'border-gray-300 hover:border-gray-400'
              }
            `}
          >
            <div className="text-2xl mb-2">🏠</div>
            <div className="font-medium">Presencial</div>
            <div className="text-xs text-gray-600 mt-1">
              Visito al cliente
            </div>
          </button>

          <button
            type="button"
            onClick={() => setServiceMode('online')}
            className={`
              p-4 rounded-lg border-2 transition-all
              ${serviceMode === 'online'
                ? 'border-brand-600 bg-brand-50'
                : 'border-gray-300 hover:border-gray-400'
              }
            `}
          >
            <div className="text-2xl mb-2">💻</div>
            <div className="font-medium">Online</div>
            <div className="text-xs text-gray-600 mt-1">
              Servicio remoto
            </div>
          </button>

          <button
            type="button"
            onClick={() => setServiceMode('both')}
            className={`
              p-4 rounded-lg border-2 transition-all
              ${serviceMode === 'both'
                ? 'border-brand-600 bg-brand-50'
                : 'border-gray-300 hover:border-gray-400'
              }
            `}
          >
            <div className="text-2xl mb-2">🌐</div>
            <div className="font-medium">Ambas</div>
            <div className="text-xs text-gray-600 mt-1">
              Presencial y online
            </div>
          </button>
        </div>
      </div>

      {/* Ubicación en el mapa */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ubicación base <span className="text-gray-400">(opcional)</span>
        </label>
        <p className="text-sm text-gray-600 mb-3">
          Marca tu ubicación o zona central de trabajo en el mapa. Ayuda a los clientes a encontrarte.
        </p>
        
        <MapPicker
          value={(lat !== '' && lng !== '') ? { lat: Number(lat), lng: Number(lng) } : null}
          onChange={handleMapChange}
          height={350}
        />

        {/* Mostrar ubicación detectada */}
        {(lat !== '' && lng !== '') && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center gap-2">
              <span className="text-green-600">📍</span>
              <div className="flex-1">
                {geocodingLoading ? (
                  <p className="text-sm text-gray-600">Detectando ubicación...</p>
                ) : geocodingLocation ? (
                  <>
                    <p className="text-sm font-medium text-green-900">Ubicación seleccionada:</p>
                    <p className="text-sm text-green-700">{geocodingLocation}</p>
                    {!serviceAreaZone && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Se completará automáticamente el campo "Zona de servicio"
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-green-700">Ubicación marcada en el mapa</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Zona de servicio y Radio de cobertura - Debajo del mapa */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Zona de servicio <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={serviceAreaZone}
            onChange={(e) => setServiceAreaZone(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            placeholder="Ej: Centro, Palermo, CABA"
            required
            minLength={2}
          />
          <p className="text-xs text-gray-500 mt-1">
            Nombre de la zona o barrio donde ofreces tus servicios
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Radio de cobertura (millas) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            max="60"
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Distancia máxima que cubres desde tu ubicación base
          </p>
        </div>
      </div>

      {/* Tip */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <p className="text-sm text-blue-800">
          ℹ️ Los clientes podrán filtrar proveedores por zona. Asegúrate de especificar correctamente tu área de cobertura.
        </p>
      </div>

      {error && (
        <Alert type="error">{error}</Alert>
      )}

      <div className="flex justify-between items-center pt-4 border-t">
        <Button 
          type="button" 
          variant="secondary" 
          onClick={prevStep}
        >
          Atrás
        </Button>
        <div className="text-sm text-gray-500">
          Paso 3 de 4
        </div>
        <Button type="submit" loading={loading}>
          {loading ? 'Guardando...' : 'Continuar'}
        </Button>
      </div>
    </form>
  );
}
