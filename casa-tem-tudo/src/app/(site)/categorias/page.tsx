import type { Metadata } from "next";
import { CategoryCard } from "@/components/site/category-card";
import { CtaBand } from "@/components/site/cta-band";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/ui/reveal";
import { getCategories, getSettings } from "@/lib/public-data";
import { whatsappLink, whatsappMessages } from "@/lib/whatsapp";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Categorias de materiais para construção",
  description: "Explore as categorias de materiais para construção e reforma da Casa Tem Tudo, em Assis/SP, e consulte produtos pelo WhatsApp.",
  alternates: { canonical: "/categorias" },
};

export default async function CategoriesPage() {
  const [categories, s] = await Promise.all([getCategories(), getSettings()]);
  const wa = whatsappLink(s.company.whatsapp, whatsappMessages.quote);
  return (
    <>
      <PageHero
        crumb="Categorias"
        title="Explore por categoria."
        description="Da estrutura ao acabamento: escolha uma categoria para ver os produtos cadastrados ou fale com a equipe para consultar o que precisa."
      />
      <section className="section" aria-label="Lista de categorias">
        <div className="container">
          {categories.length > 0 ? (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((cat, i) => (
                <Reveal as="li" key={cat.id} delay={(i % 4) * 0.06}>
                  <CategoryCard category={cat} index={i} />
                </Reveal>
              ))}
            </ul>
          ) : (
            <p className="rounded-3xl border border-dashed border-graphite-200 p-12 text-center text-graphite-600">
              As categorias estão sendo organizadas. Fale com a nossa equipe pelo WhatsApp.
            </p>
          )}
        </div>
      </section>
      <CtaBand title={s.home.ctaTitle} text={s.home.ctaText} whatsappHref={wa} />
    </>
  );
}
