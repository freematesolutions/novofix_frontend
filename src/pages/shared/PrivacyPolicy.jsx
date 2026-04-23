import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';

function PrivacyPolicy() {
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
    { title: t('privacyPage.collection.title'), content: t('privacyPage.collection.content') },
    { title: t('privacyPage.usage.title'), content: t('privacyPage.usage.content') },
    { title: t('privacyPage.sharing.title'), content: t('privacyPage.sharing.content') },
    { title: t('privacyPage.cookies.title'), content: t('privacyPage.cookies.content') },
    { title: t('privacyPage.security.title'), content: t('privacyPage.security.content') },
    { title: t('privacyPage.rights.title'), content: t('privacyPage.rights.content') },
    { title: t('privacyPage.retention.title'), content: t('privacyPage.retention.content') },
    { title: t('privacyPage.minors.title'), content: t('privacyPage.minors.content') },
    { title: t('privacyPage.changes.title'), content: t('privacyPage.changes.content') },
    { title: t('privacyPage.contact.title'), content: t('privacyPage.contact.content') },
  ];

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-8 px-3 sm:px-4">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500">
        <Link to="/" className="hover:text-brand-500 transition-colors">{t('common.home')}</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700 font-medium">{t('privacyPage.title')}</span>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t('privacyPage.title')}</h1>
        </div>
        <p className="text-gray-500 text-sm">{t('privacyPage.lastUpdated')}: {t('privacyPage.updatedDate')}</p>
        <p className="mt-3 text-gray-600 leading-relaxed">{t('privacyPage.intro')}</p>
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

export default PrivacyPolicy;
