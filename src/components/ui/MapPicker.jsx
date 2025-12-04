import { useEffect, useMemo, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Button from './Button.jsx';
import Modal from './Modal.jsx';

// Fix default marker icon paths for Leaflet under bundlers
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function MapPicker({ value, onChange, height = 280, className = '' }) {
  const [coords, setCoords] = useState(value || null);
  const [ready, setReady] = useState(false);
  const [tileError, setTileError] = useState(false);
  const [geoDenied, setGeoDenied] = useState(false);
  const [showGeoHelp, setShowGeoHelp] = useState(false);
  const [providerSelect, setProviderSelect] = useState('auto'); // 'auto' | 'osm' | 'osmfr' | 'carto' | 'basic'
  // Load saved provider preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mapProvider');
      const allowed = new Set(['auto','osm','osmfr','carto','basic']);
      if (saved && allowed.has(saved)) {
        setProviderSelect(saved);
      }
    } catch { /* ignore */ }
  }, []);

  // Persist provider preference
  useEffect(() => {
    try { localStorage.setItem('mapProvider', providerSelect); } catch { /* ignore */ }
  }, [providerSelect]);
  const [useGridBg, setUseGridBg] = useState(false);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapElRef = useRef(null);
  const tileLayerRef = useRef(null);
  const providerIndexRef = useRef(0);
  const switchedRef = useRef(false);
  const installProviderRef = useRef(null);

  // Si recibimos (0,0) lo tratamos como "no establecido" para no bloquear la geolocalización
  useEffect(() => {
    if (value && Number.isFinite(value.lat) && Number.isFinite(value.lng)) {
      if (value.lat === 0 && value.lng === 0) {
        setCoords(null);
      } else {
        setCoords(value);
      }
    } else {
      setCoords(null);
    }
  }, [value]);

  // Try geolocation for initial center
  useEffect(() => {
    let mounted = true;
    if (!coords && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!mounted) return;
          const { latitude, longitude } = pos.coords;
          setCoords({ lat: latitude, lng: longitude });
          setReady(true);
        },
        (err) => {
          if (err && err.code === 1) { // PERMISSION_DENIED
            setGeoDenied(true);
          }
          setReady(true);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setReady(true);
    }
    return () => { mounted = false; };
  }, [coords]);

  const center = useMemo(() => {
    if (coords && Number.isFinite(coords.lat) && Number.isFinite(coords.lng)) return [coords.lat, coords.lng];
    return [0, 0];
  }, [coords]);

  const zoom = coords ? 13 : 2;

  const handlePick = (c) => {
    setCoords(c);
    onChange?.(c);
    if (mapRef.current) {
      mapRef.current.setView([c.lat, c.lng], 15);
    }
    if (markerRef.current) {
      markerRef.current.setLatLng([c.lat, c.lng]);
    } else if (mapRef.current) {
      markerRef.current = L.marker([c.lat, c.lng]).addTo(mapRef.current);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      handlePick(c);
      setGeoDenied(false);
    }, (err) => {
      if (err && err.code === 1) setGeoDenied(true);
    }, { enableHighAccuracy: true, timeout: 5000 });
  };

  useEffect(() => {
    if (!ready) return;
    if (mapRef.current || !mapElRef.current) return;
    const map = L.map(mapElRef.current).setView(center, zoom);
    mapRef.current = map;
    // Tile providers list
    const providers = [
      { key: 'osm', name: 'OSM', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', options: { attribution: '&copy; OpenStreetMap contributors', subdomains: ['a','b','c'], maxZoom: 19, crossOrigin: true } },
      { key: 'osmfr', name: 'OSM France', url: 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', options: { attribution: '&copy; OpenStreetMap France & contributors', subdomains: ['a','b','c'], maxZoom: 19, crossOrigin: true } },
      { key: 'carto', name: 'Carto Positron', url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', options: { attribution: '&copy; OpenStreetMap contributors &copy; CARTO', subdomains: ['a','b','c','d'], maxZoom: 20, crossOrigin: true } }
    ];

    const setProvider = (idx) => {
      if (!mapRef.current) return;
      // Cleanup current layer
      if (tileLayerRef.current) {
        tileLayerRef.current.off();
        tileLayerRef.current.remove();
        tileLayerRef.current = null;
      }
      if (idx >= providers.length) {
        console.error('[MapPicker] All tile providers failed');
        setTileError(true);
        setUseGridBg(true);
        return;
      }
      providerIndexRef.current = idx;
      const p = providers[idx];
      console.info(`[MapPicker] Using tile provider: ${p.name}`);
      const tl = L.tileLayer(p.url, p.options).addTo(mapRef.current);
      tileLayerRef.current = tl;
      switchedRef.current = false;
      setTileError(false);
      setUseGridBg(false);
      tl.on('tileerror', (ev) => {
        if (!switchedRef.current) {
          switchedRef.current = true;
          console.warn(`[MapPicker] Tile error on ${p.name}, switching to next provider`, ev?.error);
          setProvider(idx + 1);
        }
      });
      tl.on('load', () => {
        // Reset error UI on successful load
        setTileError(false);
        setUseGridBg(false);
      });
    };
    installProviderRef.current = setProvider;
    // initial provider according to providerSelect
    if (providerSelect === 'basic') {
      setUseGridBg(true);
    } else if (providerSelect === 'osm') {
      setProvider(0);
    } else if (providerSelect === 'osmfr') {
      setProvider(1);
    } else if (providerSelect === 'carto') {
      setProvider(2);
    } else {
      // auto with fallback chain
      setProvider(0);
    }

    if (coords) {
      markerRef.current = L.marker([coords.lat, coords.lng]).addTo(map);
    }
    map.on('click', (e) => {
      handlePick({ lat: e.latlng.lat, lng: e.latlng.lng });
    });
    // Ensure correct sizing after mount and on resize
  setTimeout(() => { try { map.invalidateSize(true); } catch { /* noop */ } }, 0);
  const onResize = () => { try { map.invalidateSize(false); } catch { /* noop */ } };
    window.addEventListener('resize', onResize);
    return () => {
      map.off();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      if (tileLayerRef.current) {
        tileLayerRef.current.off();
        tileLayerRef.current = null;
      }
      window.removeEventListener('resize', onResize);
    };
  // Intentionally only run on initial ready mount to set up map
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // React to provider selection changes after map is ready
  useEffect(() => {
    if (!mapRef.current) return;
    // Cleanup current tile layer if any
    if (tileLayerRef.current) {
      tileLayerRef.current.off();
      tileLayerRef.current.remove();
      tileLayerRef.current = null;
    }
    if (providerSelect === 'basic') {
      setTileError(false);
      setUseGridBg(true);
      return;
    }
    // Map providers order: osm(0), osmfr(1), carto(2)
    if (providerSelect === 'osm') {
      installProviderRef.current && installProviderRef.current(0);
    } else if (providerSelect === 'osmfr') {
      installProviderRef.current && installProviderRef.current(1);
    } else if (providerSelect === 'carto') {
      installProviderRef.current && installProviderRef.current(2);
    } else {
      // auto fallback starts from 0
      installProviderRef.current && installProviderRef.current(0);
    }
  }, [providerSelect]);

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setView(center, zoom);
    if (coords) {
      if (markerRef.current) {
        markerRef.current.setLatLng([coords.lat, coords.lng]);
      } else {
        markerRef.current = L.marker([coords.lat, coords.lng]).addTo(mapRef.current);
      }
    }
  }, [center, zoom, coords]);

  return (
    <div className={`relative ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
        <div className="text-xs text-gray-600">{coords ? `📍 Ubicación marcada` : 'Haz clic en el mapa para seleccionar ubicación'}</div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="text-xs border rounded-md px-2 py-1"
            value={providerSelect}
            onChange={(e)=>setProviderSelect(e.target.value)}
            title="Proveedor de mapas"
          >
            <option value="auto">Auto (fallback)</option>
            <option value="osm">OSM</option>
            <option value="osmfr">OSM France</option>
            <option value="carto">Carto Positron</option>
            <option value="basic">Básico (sin tiles)</option>
          </select>
          <Button type="button" variant="secondary" onClick={useMyLocation}>Usar mi ubicación</Button>
          <Button type="button" variant="secondary" onClick={()=>{ try { mapRef.current && mapRef.current.invalidateSize(); } catch { /* noop */ } }}>Refrescar mapa</Button>
        </div>
      </div>
      {geoDenied && (
        <div className="mb-2 text-xs p-2 rounded-md border border-amber-200 bg-amber-50 text-amber-800 flex flex-col gap-2">
          <span>Permiso de ubicación bloqueado. Selecciona un punto manualmente o habilita la ubicación.</span>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={useMyLocation}>Reintentar ubicación</Button>
            <Button type="button" variant="secondary" onClick={()=>setShowGeoHelp(true)}>¿Cómo habilitar?</Button>
          </div>
        </div>
      )}
      {tileError && (
        <div className="mb-2 text-xs p-2 rounded-md border border-red-200 bg-red-50 text-red-700 flex items-center justify-between">
          <span>No pudimos cargar los mapas. Revisa tu conexión o bloqueadores (DNS/AdBlock).</span>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setTileError(false);
              // retry from first provider
              if (mapRef.current) {
                providerIndexRef.current = 0;
                if (tileLayerRef.current) {
                  tileLayerRef.current.off();
                  tileLayerRef.current.remove();
                  tileLayerRef.current = null;
                }
                // Reinstall provider chain starting from 0
                installProviderRef.current && installProviderRef.current(0);
              }
            }}
          >Reintentar</Button>
        </div>
      )}
      {ready && (
        <div className="relative rounded-lg overflow-hidden border border-gray-300 shadow-sm">
          <div
            ref={mapElRef}
            className="relative z-0"
            style={{ height, width: '100%', minHeight: height, backgroundImage: useGridBg ? 'repeating-linear-gradient(0deg, #f3f4f6, #f3f4f6 10px, #e5e7eb 10px, #e5e7eb 11px), repeating-linear-gradient(90deg, #f3f4f6, #f3f4f6 10px, #e5e7eb 10px, #e5e7eb 11px)' : undefined, backgroundColor: useGridBg ? '#f8fafc' : undefined }}
          />
        </div>
      )}
      <Modal
        open={showGeoHelp}
        title="Habilitar ubicación"
        onClose={()=>setShowGeoHelp(false)}
        actions={<Button variant="secondary" onClick={()=>setShowGeoHelp(false)}>Cerrar</Button>}
      >
        <div className="space-y-3 text-xs leading-relaxed">
          <p>Tu navegador ha bloqueado la geolocalización tras varios rechazos. Sigue los pasos según tu plataforma y luego recarga:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li><strong>Chrome (Escritorio):</strong> Click en el icono de ajustes (candado/tune) a la izquierda de la URL → Permisos del sitio → Ubicación → Permitir. Recarga.</li>
            <li><strong>Chrome (Android):</strong> Icono de candado/tune → Permisos → Ubicación → Cambiar a Permitir. Si sigue bloqueado, en Ajustes → Apps → Chrome → Permisos → Ubicación. Recarga.</li>
            <li><strong>Edge:</strong> Icono de candado → Permisos del sitio → Ubicación → Permitir. Recarga.</li>
            <li><strong>Safari (iOS):</strong> Ajustes del sistema → Safari → Ubicación → Preguntar o Permitir. Luego abre la página y acepta el prompt.</li>
            <li><strong>Firefox:</strong> Icono de candado → Permisos → Ubicación → Permitir.</li>
            <li><strong>Reset general Chrome:</strong> chrome://settings/content/location → Limpiar bloqueos y añadir tu dominio en “Permitidos”.</li>
          </ul>
          <p>Después de habilitar el permiso puedes usar “Usar mi ubicación” o recargar para centrar el mapa automáticamente.</p>
        </div>
      </Modal>
    </div>
  );
}
