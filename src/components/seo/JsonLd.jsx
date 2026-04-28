import { Helmet } from 'react-helmet-async';

/**
 * Inject a JSON-LD (Schema.org) script into <head>.
 *
 * @param {{ data: object | object[] }} props
 */
export default function JsonLd({ data }) {
  if (!data) return null;
  const json = JSON.stringify(data);
  return (
    <Helmet>
      <script type="application/ld+json">{json}</script>
    </Helmet>
  );
}
