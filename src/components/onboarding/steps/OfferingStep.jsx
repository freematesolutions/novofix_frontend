import { useState, useEffect } from 'react';
import { useProviderOnboarding } from '@/state/ProviderOnboardingContext.jsx';
import Button from '@/components/ui/Button.jsx';
import Alert from '@/components/ui/Alert.jsx';
import { SERVICE_CATEGORIES } from '@/utils/categories.js';

export default function OfferingStep() {
  const { 
    formData, 
    updateFormData, 
    saveStep,
    prevStep,
    loading, 
    error 
  } = useProviderOnboarding();

  const [selectedCategories, setSelectedCategories] = useState(formData.categories || []);
  const [mainService, setMainService] = useState(formData.mainService || '');
  const [description, setDescription] = useState(formData.description || '');
  const [customCategory, setCustomCategory] = useState('');

  useEffect(() => {
    updateFormData({ 
      categories: selectedCategories, 
      mainService, 
      description 
    });
  }, [selectedCategories, mainService, description, updateFormData]);

  const toggleCategory = (category) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const addCustomCategory = () => {
    if (customCategory.trim() && !selectedCategories.includes(customCategory.trim())) {
      setSelectedCategories(prev => [...prev, customCategory.trim()]);
      setCustomCategory('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await saveStep(1);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Categorías */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Categorías de servicio <span className="text-red-500">*</span>
        </label>
        <p className="text-sm text-gray-600 mb-3">
          Selecciona las categorías que mejor describan tus servicios (al menos una)
        </p>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
          {SERVICE_CATEGORIES.map(category => (
            <button
              key={category}
              type="button"
              onClick={() => toggleCategory(category)}
              className={`
                px-3 py-2 rounded-md text-sm font-medium transition-colors
                ${selectedCategories.includes(category)
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Categoría personalizada */}
        <div className="flex gap-2">
          <input
            type="text"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomCategory())}
            className="flex-1 border border-gray-300 rounded-md px-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            placeholder="Otra categoría..."
          />
          <Button
            type="button"
            variant="secondary"
            onClick={addCustomCategory}
          >
            Añadir
          </Button>
        </div>

        {selectedCategories.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedCategories.map(cat => (
              <span 
                key={cat}
                className="inline-flex items-center gap-1 px-3 py-1 bg-brand-100 text-brand-800 rounded-full text-sm"
              >
                {cat}
                <button
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className="hover:text-brand-900"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Servicio principal */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Describe tu servicio principal <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={mainService}
          onChange={(e) => setMainService(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          placeholder="Ej: Reparación de cañerías y grifos"
          required
          minLength={3}
        />
        <p className="text-xs text-gray-500 mt-1">
          Este será el título que verán los clientes en las búsquedas
        </p>
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descripción de tu negocio <span className="text-gray-400">(opcional)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          placeholder="Cuéntanos sobre tu experiencia, especialidades, certificaciones o lo que te hace único..."
        />
        <p className="text-xs text-gray-500 mt-1">
          {description.length}/500 caracteres
        </p>
      </div>

      {/* Tip */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <p className="text-sm text-yellow-800">
          💡 <strong>Consejo:</strong> Una buena descripción aumenta tus posibilidades de ser contactado. Incluye tu experiencia y lo que te diferencia.
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
          Paso 2 de 4
        </div>
        <Button type="submit" loading={loading}>
          {loading ? 'Guardando...' : 'Continuar'}
        </Button>
      </div>
    </form>
  );
}
