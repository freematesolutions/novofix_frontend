import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';

function TermsOfService() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from');

  // Determine back link destination and label based on origin
  const isRegistration = from === 'registro-proveedor' || from === 'registrarse';
  const backTo = from === 'registro-proveedor' ? '/registro-proveedor'
    : from === 'registrarse' ? '/registrarse'
    : from ? decodeURIComponent(from)
    : '/';
  const backLabel = isRegistration
    ? t('common.backToRegistration')
    : (from && decodeURIComponent(from) !== '/')
      ? t('common.goBack')
      : t('common.backToHome');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    { title: t('termsPage.acceptance.title'), content: t('termsPage.acceptance.content') },
    { title: t('termsPage.services.title'), content: t('termsPage.services.content') },
    { title: t('termsPage.accounts.title'), content: t('termsPage.accounts.content') },
    { title: t('termsPage.providers.title'), content: t('termsPage.providers.content') },
    { title: t('termsPage.clients.title'), content: t('termsPage.clients.content') },
    { title: t('termsPage.payments.title'), content: t('termsPage.payments.content') },
    { title: t('termsPage.intellectual.title'), content: t('termsPage.intellectual.content') },
    { title: t('termsPage.liability.title'), content: t('termsPage.liability.content') },
    { title: t('termsPage.termination.title'), content: t('termsPage.termination.content') },
    { title: t('termsPage.modifications.title'), content: t('termsPage.modifications.content') },
    { title: t('termsPage.contact.title'), content: t('termsPage.contact.content') },
  ];

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500">
        <Link to="/" className="hover:text-brand-500 transition-colors">{t('common.home')}</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700 font-medium">{t('termsPage.title')}</span>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t('termsPage.title')}</h1>
        </div>
        <p className="text-gray-500 text-sm">{t('termsPage.lastUpdated')}: {t('termsPage.updatedDate')}</p>
        <p className="mt-3 text-gray-600 leading-relaxed">{t('termsPage.intro')}</p>
      </div>

      {/* Sections */}
      <div className="space-y-8">
        {sections.map((section, idx) => (
          <section key={idx} className="group">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="text-brand-500 text-sm font-bold">{String(idx + 1).padStart(2, '0')}</span>
              {section.title}
            </h2>
            <div className="text-gray-600 leading-relaxed whitespace-pre-line pl-7">
              {section.content}
            </div>
          </section>
        ))}
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

export default TermsOfService;
