# Open Graph image (`og-default.jpg`)

This folder must contain a real **raster** image at the path `/og-default.jpg`
(referenced by `<meta property="og:image">` and Twitter Card meta tags).

**Required specs**

- Format: JPG or PNG (NOT SVG — Facebook/WhatsApp/LinkedIn do not render SVG previews).
- Dimensions: **1200 × 630 px** (1.91:1 aspect ratio).
- Weight: < 300 KB recommended.
- Should include the NovoFix logo, brand colors and the tagline.

A branded SVG draft is provided at `og-default.svg` for reference. Export it to
`og-default.jpg` (e.g. via Figma, Photoshop or `sharp`) and place the file here.

Until then, social previews will fall back to the site icon.
