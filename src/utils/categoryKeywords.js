// client/src/utils/categoryKeywords.js
//
// Phase 8 — Keyword targeting & geo-SEO.
// Per-category overrides for SEO copy: title, description, H1, intro paragraph
// and FAQ entries. These values are MORE specific (and longer-tail) than the
// generic interpolation fallback used by CategoryLanding when no override
// exists for a given (category, lang) tuple.
//
// Why a static map instead of CMS-driven content?
//  · Keeps SEO copy versioned in git, reviewed in PRs, and rendered at build
//    time so the prerender pipeline (Phase 4) ships it inside the HTML.
//  · Zero new backend surface. No DB calls, no migrations, no risk.
//  · Easy to extend: add a new locale or a new category = add a new key.
//
// Conventions:
//  · Each entry is keyed by the canonical Spanish category name (matching
//    SERVICE_CATEGORIES). Localized copy lives under `es` and `en`.
//  · `faq` is a list of `{ q, a }` objects. They render as visible
//    accordion-style copy AND as Schema.org `FAQPage` JSON-LD on the same
//    landing — eligible for rich-results in SERP.
//  · `keywords` is a comma-separated string injected into <meta name="keywords">.
//    Search engines weight this lightly, but it's a documented contract for
//    your team about which queries the page is targeting.
//
// Defaults (city / region) are sourced from seoConfig.js so changing the
// metro area only requires editing env vars (VITE_SITE_CITY / VITE_SITE_REGION).

import { SITE_CITY, SITE_REGION_LABEL } from '@/components/seo/seoConfig.js';

/** Helper used inside string templates to keep them resilient to env changes. */
const C = SITE_CITY;          // "Miami"
const R = SITE_REGION_LABEL;  // "Miami, FL"

/**
 * @typedef {Object} CategoryLocaleSeo
 * @property {string} title       — <title> override
 * @property {string} description — meta description override
 * @property {string} heading     — <h1> override
 * @property {string} intro       — intro paragraph (visible body copy)
 * @property {string} keywords    — comma-separated meta keywords
 * @property {{q:string,a:string}[]} faq — FAQ entries (also emit FAQPage JSON-LD)
 */

/** @type {Record<string, { es: CategoryLocaleSeo, en: CategoryLocaleSeo }>} */
export const CATEGORY_KEYWORD_OVERRIDES = {
  // ─── Reparaciones (Handyman) ─────────────────────────────────────────────
  Reparaciones: {
    es: {
      title: `Handyman en ${C} · Reparaciones del hogar 24/7 con presupuesto gratis`,
      description: `Contrata profesionales certificados para reparaciones del hogar en ${C}. Presupuesto gratis online, técnicos verificados y garantía en cada servicio. Conecta con contratistas locales hoy mismo.`,
      heading: `Handyman y reparaciones del hogar en ${C}`,
      intro: `¿Buscas un handyman cerca de ti en ${C}? NovoFix conecta a clientes con profesionales verificados para reparaciones del hogar — desde pequeñas tareas hasta arreglos complejos — con presupuesto gratis online y respuesta en minutos.`,
      keywords: `handyman near me, servicios para el hogar en ${C}, reparaciones del hogar en ${C}, contratar profesionales certificados, presupuesto gratis online, profesionales verificados, conectar con contratistas locales`,
      faq: [
        {
          q: `¿Cuánto cuesta contratar un handyman en ${C}?`,
          a: `El precio depende del tipo de tarea y los materiales. En NovoFix recibes presupuestos gratuitos de varios profesionales locales para que puedas comparar antes de contratar.`,
        },
        {
          q: `¿Los handyman de NovoFix están certificados?`,
          a: `Sí. Todos los profesionales pasan por un proceso de verificación de identidad y, cuando aplica, validamos licencias y seguros vigentes en el estado de Florida.`,
        },
        {
          q: `¿Atienden emergencias el mismo día?`,
          a: `Muchos profesionales ofrecen disponibilidad inmediata o el mismo día. Filtramos por urgencia para que recibas respuestas rápidas.`,
        },
      ],
    },
    en: {
      title: `Handyman in ${C} · 24/7 home repairs with free quotes`,
      description: `Hire certified professionals for home repairs in ${C}. Free online quotes, verified technicians and a guarantee on every job. Connect with local contractors today.`,
      heading: `Handyman & home repair services in ${C}`,
      intro: `Looking for a handyman near you in ${C}? NovoFix connects customers with verified pros for home repairs — from small fixes to bigger projects — with free online quotes and replies in minutes.`,
      keywords: `handyman near me, home services ${C}, home repairs ${C}, hire certified professionals, free online quote, verified professionals, connect with local contractors`,
      faq: [
        {
          q: `How much does a handyman cost in ${C}?`,
          a: `Prices depend on the task and materials. NovoFix gives you free quotes from several local pros so you can compare before you hire.`,
        },
        {
          q: `Are NovoFix handymen certified?`,
          a: `Yes. Every professional goes through an identity verification process and, where applicable, we validate active licenses and insurance in the state of Florida.`,
        },
        {
          q: `Do they handle same-day emergencies?`,
          a: `Many pros offer immediate or same-day availability. We filter by urgency so you receive fast responses.`,
        },
      ],
    },
  },

  // ─── Electricidad ────────────────────────────────────────────────────────
  Electricidad: {
    es: {
      title: `Electricistas residenciales 24 horas en ${C} · Cumplimiento código NEC`,
      description: `Electricistas certificados disponibles 24/7 en ${C}. Instalaciones eléctricas conforme al código NEC, cálculo de panel eléctrico para viviendas y presupuesto gratis online. Profesionales verificados con licencia en Florida.`,
      heading: `Electricistas residenciales 24 horas en ${C}`,
      intro: `Necesitas un electricista en ${C} cuanto antes? En NovoFix encuentras electricistas residenciales 24 horas con licencia activa, especializados en instalaciones eléctricas según el código NEC y cálculo de panel eléctrico para viviendas. Recibe presupuesto gratis y compara antes de contratar.`,
      keywords: `electricistas residenciales 24 horas, instalaciones eléctricas código NEC, cálculo de panel eléctrico para viviendas, electricista en ${C}, presupuesto gratis online, profesionales verificados, contratar profesionales certificados`,
      faq: [
        {
          q: `¿Los electricistas cumplen con el código NEC?`,
          a: `Sí. Verificamos que los electricistas en nuestra plataforma realicen instalaciones eléctricas conforme al National Electrical Code (NEC) y a las regulaciones del estado de Florida.`,
        },
        {
          q: `¿Pueden hacer cálculo de panel eléctrico para mi vivienda?`,
          a: `Sí. Nuestros electricistas certificados realizan cálculos de carga y dimensionamiento de panel eléctrico residencial para garantizar la seguridad y el cumplimiento normativo.`,
        },
        {
          q: `¿Atienden emergencias eléctricas las 24 horas?`,
          a: `Muchos electricistas ofrecen servicio 24/7 en ${C}. Al crear tu solicitud puedes marcarla como urgente y recibirás propuestas en minutos.`,
        },
      ],
    },
    en: {
      title: `24/7 residential electricians in ${C} · NEC code compliant`,
      description: `Certified electricians available 24/7 in ${C}. Electrical installations following NEC code, residential panel load calculations and free online quotes. Verified professionals licensed in Florida.`,
      heading: `24/7 residential electricians in ${C}`,
      intro: `Need an electrician in ${C} right now? On NovoFix you'll find 24/7 residential electricians with active licenses, specialized in NEC-compliant electrical installations and residential panel calculations. Get a free quote and compare before you hire.`,
      keywords: `24/7 residential electricians, NEC code electrical installations, residential electrical panel calculation, electrician in ${C}, free online quote, verified professionals, hire certified contractors`,
      faq: [
        {
          q: `Do the electricians follow the NEC code?`,
          a: `Yes. We verify that electricians on our platform perform installations in compliance with the National Electrical Code (NEC) and Florida state regulations.`,
        },
        {
          q: `Can they calculate the electrical panel for my home?`,
          a: `Yes. Our certified electricians perform load calculations and panel sizing for residential properties to ensure safety and code compliance.`,
        },
        {
          q: `Do they handle 24-hour electrical emergencies?`,
          a: `Many electricians offer 24/7 service in ${C}. When creating your request you can flag it as urgent and you'll receive proposals in minutes.`,
        },
      ],
    },
  },

  // ─── Climatización (HVAC) ────────────────────────────────────────────────
  Climatización: {
    es: {
      title: `Técnicos de aire acondicionado en ${C} · Instalación, reparación y mantenimiento`,
      description: `Técnicos de aire acondicionado certificados en ${C}. Instalación, reparación y mantenimiento preventivo residencial con presupuesto gratis y garantía. Profesionales verificados, disponibles para emergencias en Florida.`,
      heading: `Técnicos de aire acondicionado en ${C}`,
      intro: `Cuando el calor de ${R} no da tregua, necesitas técnicos de aire acondicionado de confianza. NovoFix conecta con profesionales certificados para instalación, reparación y mantenimiento preventivo residencial. Presupuesto gratis online y servicios técnicos garantizados.`,
      keywords: `técnicos de aire acondicionado en ${C}, mantenimiento preventivo residencial, servicios técnicos garantizados, HVAC ${C}, presupuesto gratis online, profesionales verificados`,
      faq: [
        {
          q: `¿Cada cuánto debo hacer mantenimiento al aire acondicionado en ${C}?`,
          a: `En el clima de ${R} se recomienda al menos un mantenimiento preventivo residencial al año, idealmente antes del verano, para evitar fallas y prolongar la vida útil del equipo.`,
        },
        {
          q: `¿Los técnicos están certificados?`,
          a: `Sí. Todos los técnicos de HVAC en NovoFix son profesionales verificados, y muchos cuentan con certificaciones EPA y licencias activas en Florida.`,
        },
        {
          q: `¿Ofrecen garantía en las reparaciones?`,
          a: `Sí. La mayoría de nuestros técnicos ofrecen garantía sobre la mano de obra. Los detalles se acuerdan en cada propuesta antes de aceptar.`,
        },
      ],
    },
    en: {
      title: `AC technicians in ${C} · Installation, repair and maintenance`,
      description: `Certified AC technicians in ${C}. Installation, repair and preventive residential maintenance with free quotes and warranty. Verified pros available for emergencies in Florida.`,
      heading: `Air conditioning technicians in ${C}`,
      intro: `When ${R}'s heat won't let up, you need trusted AC technicians. NovoFix connects you with certified pros for installation, repair and preventive residential maintenance. Free online quotes and guaranteed technical services.`,
      keywords: `AC technicians ${C}, preventive residential maintenance, guaranteed technical services, HVAC ${C}, free online quote, verified professionals`,
      faq: [
        {
          q: `How often should I service my AC in ${C}?`,
          a: `In ${R}'s climate we recommend at least one preventive maintenance per year, ideally before summer, to avoid breakdowns and extend the unit's lifespan.`,
        },
        {
          q: `Are the technicians certified?`,
          a: `Yes. Every HVAC technician on NovoFix is a verified professional, and many hold EPA certifications and active Florida licenses.`,
        },
        {
          q: `Do they offer warranty on repairs?`,
          a: `Yes. Most of our technicians provide warranty on labor. The details are agreed in each proposal before you accept.`,
        },
      ],
    },
  },

  // ─── Mantenimiento ───────────────────────────────────────────────────────
  Mantenimiento: {
    es: {
      title: `Mantenimiento preventivo residencial en ${C} · Servicios técnicos garantizados`,
      description: `Programas de mantenimiento preventivo residencial en ${C}. Profesionales verificados, presupuesto gratis online y servicios técnicos garantizados para tu hogar.`,
      heading: `Mantenimiento preventivo residencial en ${C}`,
      intro: `El mantenimiento preventivo residencial alarga la vida útil de tu hogar y evita reparaciones costosas. En NovoFix encuentras profesionales verificados en ${C} con servicios técnicos garantizados y presupuesto gratis online.`,
      keywords: `mantenimiento preventivo residencial, servicios técnicos garantizados, profesionales verificados, mantenimiento del hogar ${C}, presupuesto gratis online`,
      faq: [
        {
          q: `¿Qué incluye un plan de mantenimiento preventivo residencial?`,
          a: `Habitualmente incluye revisión de instalaciones eléctricas, plomería, climatización y elementos exteriores. El alcance se acuerda con cada profesional según las necesidades de tu vivienda.`,
        },
        {
          q: `¿Con qué frecuencia debo programarlo?`,
          a: `Recomendamos al menos una revisión anual, idealmente antes del verano por las exigencias del clima de ${R}.`,
        },
      ],
    },
    en: {
      title: `Preventive residential maintenance in ${C} · Guaranteed services`,
      description: `Preventive residential maintenance plans in ${C}. Verified pros, free online quotes and guaranteed technical services for your home.`,
      heading: `Preventive residential maintenance in ${C}`,
      intro: `Preventive residential maintenance extends your home's lifespan and prevents costly repairs. On NovoFix you'll find verified pros in ${C} with guaranteed technical services and free online quotes.`,
      keywords: `preventive residential maintenance, guaranteed technical services, verified professionals, home maintenance ${C}, free online quote`,
      faq: [
        {
          q: `What's included in a preventive residential maintenance plan?`,
          a: `It typically covers electrical, plumbing, HVAC and exterior reviews. The scope is agreed with each pro based on your home's needs.`,
        },
        {
          q: `How often should I schedule it?`,
          a: `We recommend at least one annual review, ideally before summer due to ${R}'s climate demands.`,
        },
      ],
    },
  },

  // ─── Remodelación ────────────────────────────────────────────────────────
  Remodelación: {
    es: {
      title: `Remodelación de casas en ${C} · Contratistas certificados con presupuesto gratis`,
      description: `Remodelación de casas en ${C} con contratistas locales certificados. Cocinas, baños, ampliaciones y más. Presupuesto gratis online y profesionales verificados con licencia en Florida.`,
      heading: `Remodelación de casas en ${C}`,
      intro: `¿Quieres remodelar tu casa en ${C}? NovoFix te ayuda a conectar con contratistas locales certificados, comparar presupuestos gratis y contratar con tranquilidad. Cocinas, baños, ampliaciones y proyectos integrales con profesionales verificados.`,
      keywords: `remodelación de casas en ${C}, conectar con contratistas locales, contratar profesionales certificados, presupuesto gratis online, profesionales verificados, directorio de profesionales en Florida`,
      faq: [
        {
          q: `¿Necesito permisos para remodelar mi casa en ${C}?`,
          a: `Muchos proyectos de remodelación requieren permisos del condado. Tus contratistas verificados te orientarán sobre los permisos necesarios y pueden gestionar el trámite.`,
        },
        {
          q: `¿Cuánto tarda una remodelación de cocina?`,
          a: `Depende del alcance. Una remodelación de cocina típica en ${C} suele demorar entre 4 y 8 semanas. Recibirás un cronograma detallado en cada propuesta.`,
        },
      ],
    },
    en: {
      title: `Home remodeling in ${C} · Certified contractors with free quotes`,
      description: `Home remodeling in ${C} with certified local contractors. Kitchens, bathrooms, additions and more. Free online quotes and verified pros licensed in Florida.`,
      heading: `Home remodeling in ${C}`,
      intro: `Planning to remodel your home in ${C}? NovoFix helps you connect with certified local contractors, compare free quotes and hire with peace of mind. Kitchens, bathrooms, additions and full-scope projects with verified pros.`,
      keywords: `home remodeling ${C}, connect with local contractors, hire certified contractors, free online quote, verified professionals, Florida contractor directory`,
      faq: [
        {
          q: `Do I need permits to remodel my home in ${C}?`,
          a: `Many remodeling projects require county permits. Your verified contractors will guide you and can handle the paperwork.`,
        },
        {
          q: `How long does a kitchen remodel take?`,
          a: `It depends on scope. A typical kitchen remodel in ${C} runs 4–8 weeks. You'll receive a detailed timeline in each proposal.`,
        },
      ],
    },
  },

  // ─── Plomería ────────────────────────────────────────────────────────────
  Plomería: {
    es: {
      title: `Plomeros en ${C} · Reparaciones, fugas y emergencias 24h`,
      description: `Plomeros certificados en ${C} con presupuesto gratis online. Reparaciones, fugas, emergencias 24 horas y mantenimiento preventivo residencial. Profesionales verificados con licencia en Florida.`,
      heading: `Plomeros profesionales en ${C}`,
      intro: `Una fuga no puede esperar. NovoFix conecta con plomeros certificados en ${C} disponibles 24 horas, con presupuesto gratis y servicios técnicos garantizados. Resuelve hoy mismo.`,
      keywords: `plomeros en ${C}, reparaciones del hogar en ${C}, presupuesto gratis online, profesionales verificados, servicios técnicos garantizados, mantenimiento preventivo residencial`,
      faq: [
        {
          q: `¿Atienden emergencias de plomería las 24 horas en ${C}?`,
          a: `Sí. Muchos plomeros ofrecen servicio 24/7. Marca tu solicitud como urgente y recibirás propuestas en minutos.`,
        },
        {
          q: `¿Los plomeros tienen licencia en Florida?`,
          a: `Validamos licencias y seguros cuando aplica. Todos los profesionales son verificados antes de poder enviar propuestas.`,
        },
      ],
    },
    en: {
      title: `Plumbers in ${C} · Repairs, leaks and 24-hour emergencies`,
      description: `Certified plumbers in ${C} with free online quotes. Repairs, leaks, 24-hour emergencies and preventive residential maintenance. Verified pros licensed in Florida.`,
      heading: `Professional plumbers in ${C}`,
      intro: `A leak can't wait. NovoFix connects you with certified plumbers in ${C} available 24/7, with free quotes and guaranteed technical services. Get it fixed today.`,
      keywords: `plumbers ${C}, home repairs ${C}, free online quote, verified professionals, guaranteed technical services, preventive residential maintenance`,
      faq: [
        {
          q: `Do they handle 24-hour plumbing emergencies in ${C}?`,
          a: `Yes. Many plumbers offer 24/7 service. Mark your request as urgent and you'll receive proposals in minutes.`,
        },
        {
          q: `Are plumbers licensed in Florida?`,
          a: `We validate licenses and insurance where applicable. Every pro is verified before they can send proposals.`,
        },
      ],
    },
  },
};

/**
 * Returns the SEO override bundle for a given category and language, or
 * `null` if no override exists. Callers must fall back to the generic copy.
 */
export function getCategorySeoOverride(category, lang = 'es') {
  const bundle = CATEGORY_KEYWORD_OVERRIDES[category];
  if (!bundle) return null;
  return bundle[lang] || bundle.es || null;
}
