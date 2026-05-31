// components/cms/CmsRichContent.jsx
//
// Renderiza HTML provisto por el backend del CMS. La sanitización se hace en
// el servidor con sanitize-html (allowlist estricta); aquí sólo inyectamos
// con `dangerouslySetInnerHTML` envolviendo en clases tipográficas Tailwind
// para que herede el look & feel de NovoFix.
//
// Si en el futuro se quisiera defensa en profundidad, podríamos sumar
// DOMPurify del lado cliente — por ahora confiamos en el backend.

export default function CmsRichContent({ html, className = '' }) {
  if (!html) return null;
  return (
    <div
      className={
        'cms-rich text-gray-700 leading-relaxed ' +
        // Tipografía mínima reutilizable (sin depender de @tailwindcss/typography
        // para no añadir un plugin nuevo; estos selectores cubren el allowlist).
        '[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-gray-900 ' +
        '[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:text-gray-900 ' +
        '[&_h4]:text-base [&_h4]:font-semibold [&_h4]:mt-4 [&_h4]:mb-2 [&_h4]:text-gray-900 ' +
        '[&_p]:my-3 ' +
        '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-3 ' +
        '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-3 ' +
        '[&_li]:my-1 ' +
        '[&_a]:text-brand-600 [&_a]:underline [&_a:hover]:text-brand-700 ' +
        '[&_strong]:font-semibold [&_strong]:text-gray-900 ' +
        '[&_em]:italic ' +
        '[&_blockquote]:border-l-4 [&_blockquote]:border-brand-200 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600 ' +
        '[&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono ' +
        '[&_hr]:my-6 [&_hr]:border-gray-200 ' +
        className
      }
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
