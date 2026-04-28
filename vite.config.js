import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import process from 'node:process';
import react from '@vitejs/plugin-react';

// Vite will automatically load .env, .env.development, .env.production
// We use loadEnv here to reference env values inside the Node-side config.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ''); // read envs relative to current working dir (client/)

  // In development, prefer a proxy so the client can call "/api" relative to the Vite server
  // without CORS issues. At build/production time, the app should use absolute URLs from env.
  // Normalize VITE_API_URL to an origin (protocol + host + optional port) without any path.
  // If someone accidentally includes a path like "/api", strip it to avoid duplicated paths
  // when proxying "/api" (which would otherwise become "/api/api").
  const normalizeOrigin = (input) => {
    if (!input) return '';
    const trimmed = String(input).trim();
    const parseWith = (value) => {
      try {
        const u = new URL(value);
        if (u.pathname && u.pathname !== '/') {
          console.warn(
            `[vite] VITE_API_URL contains a path ("${u.pathname}"). Using origin "${u.origin}" for dev proxy to avoid duplicated paths.`,
          );
        }
        return u.origin;
      } catch {
        return '';
      }
    };

    // Try as-is first; if it lacks a protocol, try http:// as a sensible dev default
    let origin = parseWith(trimmed);
    if (!origin) {
      const maybeWithProto = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
      origin = parseWith(maybeWithProto);
    }
    if (!origin) {
      console.warn(
        `[vite] Could not parse VITE_API_URL="${trimmed}" as a URL. Using value as-is (trailing slash removed).`,
      );
      return trimmed.replace(/\/$/, '');
    }
    return origin.replace(/\/$/, '');
  };

  // Require VITE_API_URL to avoid silent misrouting in both dev and prod
  if (mode === 'development' && !env.VITE_API_URL) {
    throw new Error('[vite] Missing VITE_API_URL in .env.development. Example: VITE_API_URL=http://localhost:5000');
  }
  if (mode === 'production' && !env.VITE_API_URL) {
    throw new Error('[vite] Missing VITE_API_URL in .env.production (or deployment env). Set it to your API origin, e.g. https://api.example.com');
  }

  const rawApiUrl = env.VITE_API_URL;
  const devProxyTarget = normalizeOrigin(rawApiUrl);

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    build: {
      // Slightly raise the warning so the residual main app chunk doesn't spam
      // the build log; we already split the heaviest deps via manualChunks.
      chunkSizeWarningLimit: 700,
      // Ensure content hash is included in filenames for cache busting
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
          // Extract heavy third-party libraries into their own cacheable
          // chunks. Browsers cache them independently of our app bundle so a
          // code change in NovoFix does not invalidate vendor bytes that
          // change very rarely.
          //
          // IMPORTANT: we deliberately do NOT split `react` / `react-dom` /
          // `react-router` themselves. Doing so creates a chunk-graph where
          // helper chunks (i18n, seo, icons, ...) reference React before the
          // React chunk has executed, producing "Cannot read properties of
          // undefined (reading 'createContext')" at runtime. Letting Rollup
          // keep React with the main entry guarantees correct evaluation
          // order.
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('pdfjs-dist') || id.includes('jspdf') || id.includes('html2canvas')) return 'pdf';
            if (id.includes('node_modules/leaflet')) return 'leaflet';
            if (id.includes('@stripe/stripe-js') || id.includes('@stripe/react-stripe-js')) return 'stripe';
            if (id.includes('socket.io-client') || id.includes('engine.io-client')) return 'socket';
            return undefined;
          }
        }
      }
    },
    server: {
      proxy: {
        // Proxy REST API
        '/api': {
          target: devProxyTarget,
          changeOrigin: true,
          secure: false,
        },
        // Proxy SEO endpoints (sitemap.xml, robots.txt) to the backend during dev
        '/seo': {
          target: devProxyTarget,
          changeOrigin: true,
          secure: false,
        },
        // Optional: proxy Socket.IO if your backend exposes it (safe no-op if unused)
        '/socket.io': {
          target: devProxyTarget,
          ws: true,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    // Ensure consistent base handling. If you need a non-root base in prod, set VITE_BASE in .env.*
    base: env.VITE_BASE || '/',
    // Make mode available to the client via import.meta.env.MODE (already provided by Vite)
    // and any VITE_* variables defined in your .env files.
  };
});
