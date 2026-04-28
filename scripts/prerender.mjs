/**
 * NovoFix · Static prerendering script
 *
 * Renders a curated list of public, indexable routes of the SPA into static
 * HTML files inside `dist/`. This dramatically improves SEO for crawlers that
 * do NOT execute JavaScript (Bing, DuckDuckGo, social media scrapers like the
 * WhatsApp/Facebook/LinkedIn link previewers, Slack unfurler, etc.) and also
 * shaves off the first paint for real users.
 *
 * Pipeline:
 *   1. Spin up a tiny static server (sirv) on a random localhost port serving
 *      the freshly-built `dist/` directory.
 *   2. Launch headless Chromium via puppeteer.
 *   3. For each route in PRERENDER_ROUTES:
 *        a. Navigate to the URL.
 *        b. Wait for `domcontentloaded` and the Helmet-injected
 *           `<link rel="canonical">` to confirm React and react-helmet-async
 *           have finished their first render.
 *        c. Capture full `document.documentElement.outerHTML`.
 *        d. Inject a marker comment so the resulting file is debuggable.
 *        e. Write `dist/<route>/index.html`.
 *   4. Tear down the browser and the static server.
 *
 * Hydration?  No. main.jsx uses `createRoot(...).render(...)` (NOT
 * `hydrateRoot`), so React simply replaces the prerendered DOM when the SPA
 * boots. This avoids hydration mismatch warnings entirely while still giving
 * crawlers and slow networks a fully-rendered HTML payload.
 *
 * Usage:
 *   npm run build           # plain Vite build (unchanged)
 *   npm run build:seo       # build + prerender (use this for production)
 *   npm run prerender       # only prerender (assumes dist/ already built)
 *
 * Env flags (optional):
 *   PRERENDER_ROUTES   Comma-separated list of paths to override the default.
 *   PRERENDER_PORT     Port for the local static server (default: random).
 *   PRERENDER_TIMEOUT  Per-route timeout in ms (default: 30000).
 *   PUPPETEER_EXECUTABLE_PATH   Use a system Chrome instead of the bundled one.
 */

import { createServer } from 'node:http';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import sirv from 'sirv';

// Pick the correct Puppeteer flavor for the host:
//  · Local dev / generic CI  → use the full `puppeteer` package (bundles its own Chromium).
//  · Serverless (Vercel/AWS) → use `puppeteer-core` + `@sparticuz/chromium`, which
//    ships a Brotli-packed Chromium with all required .so libraries already bundled
//    (libnss3, libnspr4, fonts, etc.). The system Chromium that `puppeteer` downloads
//    cannot run on Vercel because the build sandbox lacks those shared libraries.
const IS_SERVERLESS = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

let puppeteer;
let serverlessChromium = null;
if (IS_SERVERLESS) {
  puppeteer = (await import('puppeteer-core')).default;
  serverlessChromium = (await import('@sparticuz/chromium')).default;
} else {
  puppeteer = (await import('puppeteer')).default;
}

// ─── Configuration ─────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, '..', 'dist');

/** Default list of public, indexable routes to prerender. */
const DEFAULT_ROUTES = [
  '/',
  '/sobre-nosotros',
  '/terminos',
  '/privacidad',
  '/unete',
];

const ROUTES = (process.env.PRERENDER_ROUTES || DEFAULT_ROUTES.join(','))
  .split(',')
  .map((r) => r.trim())
  .filter(Boolean);

const PORT = Number(process.env.PRERENDER_PORT) || 4173 + Math.floor(Math.random() * 500);
const TIMEOUT_MS = Number(process.env.PRERENDER_TIMEOUT) || 30000;

// ─── Helpers ───────────────────────────────────────────────────────────────

function logStep(step, message) {
  console.log(`\x1b[36m[prerender]\x1b[0m ${step.padEnd(8)} ${message}`);
}
function logOk(message) {
  console.log(`\x1b[32m[prerender]\x1b[0m \x1b[32m✓\x1b[0m       ${message}`);
}
function logErr(message) {
  console.error(`\x1b[31m[prerender]\x1b[0m \x1b[31m✗\x1b[0m       ${message}`);
}

/**
 * Boot a static server pointing at dist/. Asset requests (anything with a
 * file extension) are delegated to sirv for proper MIME types and caching;
 * HTML navigation requests ALWAYS receive the pristine `originalIndexHtml`
 * we captured before any subfolder was written. This guarantees that a
 * second `npm run prerender` against an already-prerendered dist/ does not
 * feed back the previously-emitted snapshot (which would break the request
 * lifecycle and produce a navigation timeout).
 */
function startStaticServer(dir, port, originalIndexHtml) {
  const assetHandler = sirv(dir, { single: false, dev: false, etag: false, gzip: false });
  const server = createServer((req, res) => {
    const url = req.url || '/';
    // Treat any request whose pathname has a file extension as an asset.
    const pathname = url.split('?')[0];
    const hasExt = /\.[a-z0-9]+$/i.test(pathname);
    if (hasExt) {
      return assetHandler(req, res, () => {
        res.statusCode = 404;
        res.end('Not found');
      });
    }
    // HTML navigation → always the pristine fallback.
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(originalIndexHtml);
  });
  return new Promise((resolveListen, rejectListen) => {
    server.once('error', rejectListen);
    server.listen(port, '127.0.0.1', () => resolveListen(server));
  });
}

/**
 * Compute the output path for a given route.
 *  /                  → dist/index.html
 *  /sobre-nosotros    → dist/sobre-nosotros/index.html
 *  /a/b               → dist/a/b/index.html
 */
function outputPathFor(route) {
  if (!route || route === '/') return join(distDir, 'index.html');
  const clean = route.replace(/^\/+/, '').replace(/\/+$/, '');
  return join(distDir, clean, 'index.html');
}

/**
 * Inject a tiny HTML comment at the very top of <html> as a marker so the
 * generated file is recognizable in production (and in DevTools).
 */
function annotate(html, route) {
  const banner = `<!-- prerendered ${route} at ${new Date().toISOString()} by NovoFix prerender -->\n`;
  return banner + html;
}

/**
 * react-helmet-async appends new <title>, <meta name="description"> and other
 * head tags but it does NOT remove the boilerplate copies that ship in
 * index.html. After prerender we therefore see duplicates: the static fallback
 * tag from the template + the route-specific one injected at runtime. Most
 * crawlers honor the last occurrence, but we strip the first ones to keep the
 * payload clean and avoid any "duplicate title tag" SEO audit warnings.
 */
function dedupeHeadTags(html) {
  let out = html;

  // Keep ONLY the last <title>...</title>
  const titles = [...out.matchAll(/<title>[\s\S]*?<\/title>/gi)];
  if (titles.length > 1) {
    const last = titles[titles.length - 1][0];
    out = out.replace(/<title>[\s\S]*?<\/title>/gi, '');
    out = out.replace('</head>', `${last}</head>`);
  }

  // Keep ONLY the last <meta name="description" ...>
  const descs = [...out.matchAll(/<meta\s+name=["']description["'][^>]*>/gi)];
  if (descs.length > 1) {
    const last = descs[descs.length - 1][0];
    out = out.replace(/<meta\s+name=["']description["'][^>]*>/gi, '');
    out = out.replace('</head>', `${last}</head>`);
  }

  // Keep ONLY the last canonical link
  const canons = [...out.matchAll(/<link\s+rel=["']canonical["'][^>]*>/gi)];
  if (canons.length > 1) {
    const last = canons[canons.length - 1][0];
    out = out.replace(/<link\s+rel=["']canonical["'][^>]*>/gi, '');
    out = out.replace('</head>', `${last}</head>`);
  }

  return out;
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  if (!existsSync(distDir)) {
    logErr(`dist/ not found at ${distDir}. Run "vite build" first.`);
    process.exit(1);
  }

  // Sanity check: we expect dist/index.html to exist as the fallback document.
  const indexHtmlPath = join(distDir, 'index.html');
  if (!existsSync(indexHtmlPath)) {
    logErr('dist/index.html is missing. Did `vite build` succeed?');
    process.exit(1);
  }

  // We need a PRISTINE Vite template to feed Puppeteer with — never a
  // previously prerendered snapshot, otherwise the React app boots on top of
  // an already-rendered DOM and Helmet enters a feedback loop that times out.
  //
  // Strategy: persist a copy of the source template to `.prerender-source.html`
  // on the very first run (when dist/index.html is guaranteed pristine, right
  // after `vite build`). On subsequent runs we reuse it instead of reading the
  // already-prerendered index.html. The marker comment we inject via annotate()
  // is the unmistakable fingerprint of "this file is a snapshot, do not reuse".
  const sourceCachePath = join(distDir, '.prerender-source.html');
  const PRERENDER_MARKER = 'by NovoFix prerender -->';

  let originalIndexHtml;
  if (existsSync(sourceCachePath)) {
    originalIndexHtml = readFileSync(sourceCachePath, 'utf8');
    logStep('source', 'reusing dist/.prerender-source.html (pristine template)');
  } else {
    const current = readFileSync(indexHtmlPath, 'utf8');
    if (current.includes(PRERENDER_MARKER)) {
      logErr(
        'dist/index.html is already prerendered and no .prerender-source.html '
        + 'cache exists. Run `npm run build` (or `npm run build:seo`) to '
        + 'regenerate a clean dist/ before running `npm run prerender` standalone.'
      );
      process.exit(1);
    }
    originalIndexHtml = current;
    writeFileSync(sourceCachePath, originalIndexHtml, 'utf8');
    logStep('source', 'cached pristine template → dist/.prerender-source.html');
  }

  logStep('start', `Prerendering ${ROUTES.length} routes from ${distDir}`);
  logStep('routes', ROUTES.join(', '));

  // 1) Boot static server (always serves the pristine index.html for HTML
  //    navigations so we never feed back a previously prerendered snapshot).
  const server = await startStaticServer(distDir, PORT, originalIndexHtml);
  const baseUrl = `http://127.0.0.1:${PORT}`;
  logOk(`static server listening at ${baseUrl}`);

  // 2) Launch headless Chromium (uses @sparticuz/chromium on Vercel, system on local)
  const launchOptions = serverlessChromium
    ? {
        args: serverlessChromium.args,
        defaultViewport: serverlessChromium.defaultViewport,
        executablePath: await serverlessChromium.executablePath(),
        headless: true,
      }
    : {
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      };
  const browser = await puppeteer.launch(launchOptions);
  logOk(`headless Chromium launched (${serverlessChromium ? 'serverless' : 'local'})`);

  // Order routes so that "/" is rendered LAST. This is critical because the
  // SPA fallback served by sirv is dist/index.html — overwriting it before
  // sibling routes finish would cause subsequent navigations to load a page
  // whose Helmet head is already locked to "/" and React-Router has to undo
  // it, which empirically slows / corrupts the snapshot for those routes.
  const orderedRoutes = [
    ...ROUTES.filter((r) => r !== '/'),
    ...ROUTES.filter((r) => r === '/'),
  ];

  // Buffer of `{route, html}` entries written to disk only after every route
  // has been captured successfully, so a partial failure never leaves dist/
  // in a broken state.
  const captured = [];
  let failures = 0;

  try {
    for (const route of orderedRoutes) {
      const page = await browser.newPage();
      try {
        // Block analytics/tracking calls that could pollute the snapshot.
        await page.setRequestInterception(true);
        page.on('request', (req) => {
          const url = req.url();
          const block = /google-analytics\.com|googletagmanager\.com|doubleclick\.net|facebook\.net/.test(url);
          if (block) return req.abort();
          return req.continue();
        });

        await page.setUserAgent(
          'NovoFix-Prerender/1.0 (compatible; +https://novofix.com)'
        );
        // Force ES locale to keep prerendered HTML consistent (the SPA still
        // re-renders client-side using the user's preferred language).
        await page.setExtraHTTPHeaders({ 'Accept-Language': 'es-ES,es;q=0.9' });

        // Surface in-page console errors during debugging — they often reveal
        // why the canonical never appears (e.g. missing env, runtime error).
        page.on('pageerror', (err) => logErr(`[${route}] pageerror: ${err.message}`));

        const url = `${baseUrl}${route === '/' ? '' : route}`;
        logStep('render', url);

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_MS });

        // Wait for react-helmet-async to inject canonical AND for it to point
        // at the EXPECTED route (otherwise we'd capture too early when the
        // SPA fallback's stale canonical from the served HTML is still in
        // place before React has had a chance to remount it).
        const expectedSuffix = route === '/' ? '' : route.replace(/\/$/, '');
        await page.waitForFunction(
          (suffix) => {
            const el = document.querySelector('link[rel="canonical"]');
            if (!el) return false;
            const href = el.getAttribute('href') || '';
            // Either the suffix matches OR (for "/") href ends without a path.
            if (suffix === '') {
              return /^https?:\/\/[^/]+\/?$/.test(href);
            }
            return href.endsWith(suffix);
          },
          { timeout: TIMEOUT_MS },
          expectedSuffix
        );

        // Small grace period for any in-flight Helmet patches to settle.
        await new Promise((r) => setTimeout(r, 400));

        const html = await page.content();
        captured.push({ route, html });
        logStep('capture', `${route} → ${(html.length / 1024).toFixed(1)} KB (buffered)`);
      } catch (err) {
        failures += 1;
        logErr(`failed ${route}: ${err.message}`);
      } finally {
        await page.close().catch(() => {});
      }
    }
  } finally {
    await browser.close().catch(() => {});
    await new Promise((r) => server.close(r));
  }

  // Flush captures to disk only if everything succeeded; otherwise abort
  // without touching dist/ further.
  if (failures === 0) {
    for (const { route, html } of captured) {
      const outPath = outputPathFor(route);
      mkdirSync(dirname(outPath), { recursive: true });
      writeFileSync(outPath, annotate(dedupeHeadTags(html), route), 'utf8');
      logOk(`wrote ${outPath.replace(distDir, 'dist')}`);
    }
  }

  // Defensive: ensure dist/index.html still serves as SPA fallback. If for any
  // reason the prerender of "/" failed mid-flight, restore the original.
  if (!existsSync(indexHtmlPath)) {
    writeFileSync(indexHtmlPath, originalIndexHtml, 'utf8');
    logStep('fallback', 'restored original dist/index.html');
  }

  if (failures > 0) {
    logErr(`${failures} route(s) failed to prerender — see logs above.`);
    process.exit(1);
  }
  logOk(`Prerender finished successfully (${ROUTES.length} routes).`);
}

main().catch((err) => {
  logErr(`fatal: ${err.stack || err.message}`);
  process.exit(1);
});
