import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import Breadcrumbs from '@/components/seo/Breadcrumbs.jsx';

function AboutUs() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from');

  const backTo = from ? decodeURIComponent(from) : '/';
  const backLabel = (from && decodeURIComponent(from) !== '/')
    ? t('common.goBack')
    : t('common.backToHome');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const values = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: t('aboutPage.values.trust.title'),
      desc: t('aboutPage.values.trust.desc'),
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: t('aboutPage.values.innovation.title'),
      desc: t('aboutPage.values.innovation.desc'),
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      title: t('aboutPage.values.community.title'),
      desc: t('aboutPage.values.community.desc'),
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      title: t('aboutPage.values.quality.title'),
      desc: t('aboutPage.values.quality.desc'),
    },
  ];

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-8 px-3 sm:px-4">
      {/* Breadcrumb (SEO + a11y). Visual styling matches project palette;
          BreadcrumbList JSON-LD is auto-emitted by <RouteSeo /> in App.jsx. */}
      <Breadcrumbs
        className="mb-6"
        items={[
          { labelKey: 'seo.breadcrumbs.home', path: '/' },
          { labelKey: 'seo.breadcrumbs.about', path: '/sobre-nosotros' },
        ]}
      />

      {/* Header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-50 mb-4">
          <svg className="w-7 h-7 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-3">{t('aboutPage.title')}</h1>
        <p className="text-gray-600 leading-relaxed max-w-2xl mx-auto">{t('aboutPage.intro')}</p>
      </div>

      {/* Mission */}
      <div className="bg-linear-to-br from-brand-50 to-white rounded-2xl p-6 sm:p-8 border border-brand-100 mb-8">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {t('aboutPage.mission.title')}
        </h2>
        <p className="text-gray-600 leading-relaxed">{t('aboutPage.mission.content')}</p>
      </div>

      {/* Vision */}
      <div className="bg-linear-to-br from-accent-50 to-white rounded-2xl p-6 sm:p-8 border border-accent-100 mb-10">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {t('aboutPage.vision.title')}
        </h2>
        <p className="text-gray-600 leading-relaxed">{t('aboutPage.vision.content')}</p>
      </div>

      {/* Values */}
      <h2 className="text-xl font-bold mb-6 text-center">{t('aboutPage.valuesTitle')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {values.map((value, idx) => (
          <div key={idx} className="bg-white rounded-xl p-5 border border-gray-100 hover:border-brand-200 hover:shadow-sm transition-all">
            <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
              {value.icon}
            </div>
            <h3 className="font-semibold mb-1">{value.title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{value.desc}</p>
          </div>
        ))}
      </div>

      {/* Story */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold mb-3">{t('aboutPage.story.title')}</h2>
        <p className="text-gray-600 leading-relaxed whitespace-pre-line">{t('aboutPage.story.content')}</p>
      </div>

      {/* Back link */}
      <div className="mt-12 pt-6 border-t border-gray-200">
        <Link to={backTo} className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700 font-medium transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {backLabel}
        </Link>
      </div>
    </div>
  );
}

export default AboutUs;
