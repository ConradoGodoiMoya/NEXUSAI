import { SITE_URL } from "@/lib/site-url";
import { digitsOnly } from "@/lib/format";
import type { SiteSettings } from "@/lib/settings-schema";

/** Serializa JSON-LD com segurança (impede fechamento prematuro da tag <script>). */
export function JsonLd({ data }: { data: unknown }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

export function localBusinessSchema(s: SiteSettings) {
  const c = s.company;
  const phoneDigits = digitsOnly(c.phone);
  const sameAs = [c.instagram, c.facebook].filter((u) => u && /^https:\/\//.test(u) && !u.includes("/search"));
  return {
    "@context": "https://schema.org",
    "@type": "HardwareStore",
    "@id": `${SITE_URL}/#empresa`,
    name: c.name,
    alternateName: c.shortName,
    slogan: c.slogan || undefined,
    description: s.seo.description,
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
    image: s.seo.ogImage ? new URL(s.seo.ogImage, SITE_URL).toString() : `${SITE_URL}/opengraph-image`,
    telephone: `+55${phoneDigits.length <= 11 ? phoneDigits : phoneDigits.slice(2)}`,
    email: c.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: `${c.street}, ${c.number}${c.district ? ` - ${c.district}` : ""}`,
      addressLocality: c.city,
      addressRegion: c.state,
      postalCode: c.zip,
      addressCountry: "BR",
    },
    areaServed: { "@type": "City", name: `${c.city} - ${c.state}` },
    hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${c.street}, ${c.number}, ${c.city} - ${c.state}`)}`,
    aggregateRating:
      c.googleReviewCount > 0
        ? { "@type": "AggregateRating", ratingValue: c.googleRating, bestRating: 5, reviewCount: c.googleReviewCount }
        : undefined,
    sameAs: sameAs.length ? sameAs : undefined,
  };
}
