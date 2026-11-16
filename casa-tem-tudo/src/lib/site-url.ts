/** URL pública do site, sem barra final. Usada em SEO, sitemap e Open Graph. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
