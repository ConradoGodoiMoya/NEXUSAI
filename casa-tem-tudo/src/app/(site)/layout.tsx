import type { Metadata } from "next";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { JsonLd, localBusinessSchema } from "@/components/site/json-ld";
import { WhatsAppFloat } from "@/components/site/whatsapp-float";
import { telHref } from "@/lib/format";
import { getCategories, getSettings } from "@/lib/public-data";
import { whatsappLink, whatsappMessages } from "@/lib/whatsapp";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: { default: s.seo.title, template: `%s | ${s.company.shortName} — Assis/SP` },
    description: s.seo.description,
    keywords: [
      "materiais de construção em Assis SP",
      "loja de materiais para construção em Assis",
      "Casa Tem Tudo Assis",
      "materiais para reforma em Assis",
      "materiais para construção em Assis e região",
    ],
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: s.company.shortName,
      title: s.seo.title,
      description: s.seo.description,
      ...(s.seo.ogImage ? { images: [{ url: s.seo.ogImage, width: 1200, height: 630 }] } : {}),
    },
    twitter: { card: "summary_large_image", title: s.seo.title, description: s.seo.description },
    robots: { index: true, follow: true },
    other: { "geo.region": "BR-SP", "geo.placename": s.company.city },
  };
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);
  const c = settings.company;
  const wa = whatsappLink(c.whatsapp, whatsappMessages.general);
  return (
    <>
      <JsonLd data={localBusinessSchema(settings)} />
      <Header whatsappHref={wa} phone={c.phone} phoneHref={telHref(c.phone)} />
      <main id="conteudo">{children}</main>
      <Footer settings={settings} categories={categories} />
      <WhatsAppFloat href={wa} />
    </>
  );
}
