import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * Visual breadcrumbs component. SEO-friendly (semantic <nav> + <ol>) and
 * mobile-optimized. Pair this with the BreadcrumbList JSON-LD that <RouteSeo />
 * already emits — together they cover both UX and rich-results.
 *
 * Props:
 *  - items: array of `{ labelKey?: string, label?: string, path: string }`.
 *           The last item is rendered as plain text (current page).
 *  - className: optional extra classes.
 *
 * Usage:
 *   <Breadcrumbs items={[
 *     { labelKey: 'seo.breadcrumbs.home', path: '/' },
 *     { labelKey: 'seo.breadcrumbs.about', path: '/sobre-nosotros' },
 *   ]} />
 */
export default function Breadcrumbs({ items = [], className = '' }) {
  const { t } = useTranslation();
  if (!items.length) return null;

  const resolveLabel = (it) => it.label || (it.labelKey ? t(it.labelKey) : '');

  return (
    <nav
      aria-label={t('seo.breadcrumbs.ariaLabel')}
      className={`w-full text-sm sm:text-[0.95rem] ${className}`}
    >
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-gray-500">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          const label = resolveLabel(item);
          return (
            <li
              key={`${item.path}-${idx}`}
              className="flex items-center gap-1.5 min-w-0"
            >
              {idx > 0 && (
                <span aria-hidden="true" className="text-gray-300 select-none">
                  /
                </span>
              )}
              {isLast ? (
                <span
                  aria-current="page"
                  className="font-medium text-gray-800 truncate max-w-[60vw] sm:max-w-none"
                  title={label}
                >
                  {label}
                </span>
              ) : (
                <Link
                  to={item.path}
                  className="hover:text-brand-500 hover:underline focus:outline-none focus:ring-2 focus:ring-brand-500/40 rounded transition-colors truncate max-w-[40vw] sm:max-w-none"
                  title={label}
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
