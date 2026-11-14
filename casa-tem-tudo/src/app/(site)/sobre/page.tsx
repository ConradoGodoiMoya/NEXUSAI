import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, HandHeart, MapPin, Store, Wrench } from "lucide-react";
import { StorefrontIllustration } from "@/components/site/art";
import { CtaBand } from "@/components/site/cta-band";
import { PageHero } from "@/components/site/page-hero";
import { GoogleIcon } from "@/components/ui/brand-icons";
import { Reveal } from "@/components/ui/reveal";
import { Stars } from "@/components/ui/stars";
import { formatRating } from "@/lib/format";
import { getSettings } from "@/lib/public-data";
import { whatsappLink, whatsappMessages } from "@/lib/whatsapp";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Sobre nós — mais de 20 anos em Assis",
  description: "Conheça a Casa Tem Tudo, loja de materiais para construção que há mais de 20 anos atende Assis e região.",
  alternates: { canonical: "/sobre" },
};

export default async function AboutPage() {
  const s = await getSettings();
  const c = s.company;
  const body = s.about.body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return (
    <>
      <PageHero crumb="Sobre nós" title={s.home.aboutTitle} description={s.about.pageIntro} />

      <section className="section" aria-labelledby="historia">
        <div className="container grid items-start gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <p className="eyebrow">Nossa história</p>
            <h2 id="historia" className="mt-3 text-3xl font-extrabold sm:text-4xl">{c.shortName}</h2>
            <div className="prose-ctt mt-6 text-lg leading-relaxed text-graphite-700">
              {body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <p className="mt-8 border-l-4 border-brand-500 pl-5 font-display text-xl font-bold text-navy-900">“{c.slogan}”</p>
          </Reveal>
          <Reveal delay={0.1} className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-gradient-to-br from-navy-50 to-graphite-100 shadow-lift">
              {s.home.aboutImage ? (
                <Image src={s.home.aboutImage} alt={`Loja ${c.shortName}`} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
              ) : (
                <>
                  <div className="blueprint-grid-dark absolute inset-0" aria-hidden="true" />
                  <StorefrontIllustration className="absolute inset-0 m-auto h-[88%] w-[88%]" name={c.shortName} />
                </>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section bg-graphite-50" aria-labelledby="numeros">
        <div className="container">
          <h2 id="numeros" className="sr-only">Em números</h2>
          <ul className="grid gap-5 md:grid-cols-3">
            <Reveal as="li" className="card p-8">
              <Store className="h-8 w-8 text-brand-600" aria-hidden="true" strokeWidth={1.6} />
              <p className="mt-6 font-display text-5xl font-extrabold text-navy-900">{c.yearsLabel}</p>
              <p className="mt-2 text-graphite-600">de história atendendo quem constrói e reforma.</p>
            </Reveal>
            <Reveal as="li" delay={0.06} className="card p-8">
              <GoogleIcon className="h-8 w-8" />
              <p className="mt-6 flex items-center gap-3 font-display text-5xl font-extrabold text-navy-900">
                {formatRating(c.googleRating)}
                <Stars value={c.googleRating} size="h-5 w-5" />
              </p>
              <p className="mt-2 text-graphite-600">de nota média em {c.googleReviewCount} avaliações no Google.</p>
            </Reveal>
            <Reveal as="li" delay={0.12} className="card p-8">
              <MapPin className="h-8 w-8 text-brand-600" aria-hidden="true" strokeWidth={1.6} />
              <p className="mt-6 font-display text-4xl font-extrabold text-navy-900">{c.serviceArea}</p>
              <p className="mt-2 text-graphite-600">Na {c.street}, {c.number}{c.district ? ` — ${c.district}` : ""}.</p>
            </Reveal>
          </ul>
        </div>
      </section>

      <section className="section" aria-labelledby="valores">
        <div className="container">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">O que nos move</p>
            <h2 id="valores" className="mt-3 text-3xl font-extrabold sm:text-4xl">Uma loja tradicional, com o cliente por perto.</h2>
          </Reveal>
          <ul className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              { icon: Store, title: "Variedade", text: "Soluções para quem deseja construir, reformar ou melhorar a casa — tudo em um só lugar." },
              { icon: HandHeart, title: "Atendimento próximo", text: "Conversa direta com quem conhece a sua obra e a cidade. Pela loja, telefone ou WhatsApp." },
              { icon: Wrench, title: "Da fundação ao acabamento", text: "Apoio em cada etapa, do começo da obra até os detalhes finais." },
            ].map((v, i) => (
              <Reveal as="li" key={v.title} delay={i * 0.06} className="group rounded-3xl border border-graphite-100 p-8 transition hover:-translate-y-1 hover:shadow-lift">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-900 text-white transition group-hover:bg-brand-600">
                  <v.icon className="h-7 w-7" aria-hidden="true" strokeWidth={1.6} />
                </span>
                <h3 className="mt-6 text-xl font-bold">{v.title}</h3>
                <p className="mt-2 leading-relaxed text-graphite-600">{v.text}</p>
              </Reveal>
            ))}
          </ul>
          <Reveal className="mt-12">
            <Link href="/contato" className="btn btn-navy">
              Fale com a gente <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Reveal>
        </div>
      </section>

      <CtaBand title={s.home.ctaTitle} text={s.home.ctaText} whatsappHref={whatsappLink(c.whatsapp, whatsappMessages.general)} />
    </>
  );
}
