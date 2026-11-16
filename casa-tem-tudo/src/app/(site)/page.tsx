import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, HandHeart, Mail, MapPin, Navigation, Phone, Quote, Store, Wrench } from "lucide-react";
import { CategoryCard } from "@/components/site/category-card";
import { CtaBand } from "@/components/site/cta-band";
import { HouseIllustration, SceneArt, StorefrontIllustration } from "@/components/site/art";
import { MapEmbed } from "@/components/site/map-embed";
import { ProductCard } from "@/components/site/product-card";
import { SectionHeading } from "@/components/site/section-heading";
import { GoogleIcon, WhatsAppIcon } from "@/components/ui/brand-icons";
import { Reveal } from "@/components/ui/reveal";
import { Stars } from "@/components/ui/stars";
import { formatDate, formatRating, telHref } from "@/lib/format";
import { getCategories, getProducts, getSettings, getTestimonials } from "@/lib/public-data";
import { directionsUrl, fullAddress, mapEmbedUrl } from "@/lib/settings-schema";
import { whatsappLink, whatsappMessages } from "@/lib/whatsapp";

export const revalidate = 300;

export default async function HomePage() {
  const [s, categories, featured, testimonials] = await Promise.all([
    getSettings(),
    getCategories(),
    getProducts({ featuredOnly: true, limit: 8 }),
    getTestimonials(),
  ]);
  const c = s.company;
  const h = s.home;
  const waGeneral = whatsappLink(c.whatsapp, whatsappMessages.general);
  const [titleA, ...titleRest] = h.heroTitle.split(/(?<=\.)\s+/);
  const rating = formatRating(c.googleRating);

  return (
    <>
      {/* ───────────── HERO ───────────── */}
      <section aria-labelledby="hero-title" className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_85%_-10%,#EEF3FA_0%,transparent_60%),radial-gradient(800px_500px_at_-10%_110%,#FFF4EC_0%,transparent_55%)]" aria-hidden="true" />
        <div className="container grid items-center gap-12 pb-28 pt-10 sm:pt-14 lg:grid-cols-[1.02fr_1fr] lg:gap-16 lg:pb-36 lg:pt-20">
          <div>
            <p className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-graphite-200 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-navy-800 shadow-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden="true" />
              {h.heroEyebrow}
            </p>
            <h1 id="hero-title" className="mt-6 animate-fade-up text-balance text-[2.6rem] font-extrabold leading-[1.02] tracking-[-0.035em] [animation-delay:80ms] sm:text-6xl lg:text-[4.3rem]">
              {titleA}{" "}
              {titleRest.length > 0 && (
                <span className="bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400 bg-clip-text text-transparent">{titleRest.join(" ")}</span>
              )}
            </h1>
            <p className="mt-6 max-w-xl animate-fade-up text-pretty text-lg leading-relaxed text-graphite-600 [animation-delay:160ms] sm:text-xl">
              {h.heroSubtitle}
            </p>
            <div className="mt-9 flex animate-fade-up flex-col gap-3 [animation-delay:240ms] sm:flex-row">
              <Link href="/produtos" className="btn btn-primary btn-lg">
                Conheça nossos produtos
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a href={waGeneral} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-lg">
                <WhatsAppIcon className="h-5 w-5 text-whatsapp-deep" />
                Fale com nossa equipe
              </a>
            </div>
            <a
              href={c.googleReviewsUrl || "#avaliacoes"}
              target={c.googleReviewsUrl ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="mt-9 inline-flex animate-fade-up items-center gap-3 rounded-2xl pr-3 [animation-delay:320ms]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-soft ring-1 ring-graphite-100">
                <GoogleIcon className="h-5 w-5" />
              </span>
              <span>
                <span className="flex items-center gap-2">
                  <strong className="font-display text-lg text-navy-900">{rating}</strong>
                  <Stars value={c.googleRating} />
                </span>
                <span className="block text-sm text-graphite-500">{c.googleReviewCount} avaliações no Google</span>
              </span>
            </a>
          </div>

          <div className="relative animate-fade-up [animation-delay:200ms]">
            <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-gradient-to-br from-brand-200/50 via-transparent to-navy-200/60 blur-2xl" aria-hidden="true" />
            <div className="relative aspect-[6/5] overflow-hidden rounded-[2rem] bg-gradient-to-br from-navy-700 via-navy-800 to-navy-950 shadow-lift ring-1 ring-navy-900/10">
              {h.heroImage ? (
                <Image src={h.heroImage} alt="Construção residencial moderna" fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
              ) : (
                <>
                  <div className="blueprint-grid absolute inset-0" aria-hidden="true" />
                  <HouseIllustration className="absolute inset-x-0 bottom-0 h-full w-full" />
                </>
              )}
            </div>
            <div className="absolute -bottom-6 -left-3 hidden items-center gap-3 sm:flex rounded-2xl bg-white p-3 pr-5 shadow-lift ring-1 ring-graphite-100 sm:-left-8">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Store className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>
                <strong className="block font-display text-lg leading-none text-navy-900">{c.yearsLabel}</strong>
                <span className="text-xs font-medium text-graphite-500">de história em {c.city}</span>
              </span>
            </div>
            <div className="absolute -right-2 -top-5 hidden items-center gap-2 rounded-full bg-white px-4 py-2.5 shadow-lift ring-1 ring-graphite-100 sm:flex">
              <span className="h-2 w-2 rounded-full bg-whatsapp" aria-hidden="true" />
              <span className="text-sm font-semibold text-navy-900">Atendimento pelo WhatsApp</span>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── CREDIBILIDADE ───────────── */}
      <section aria-label="Indicadores da empresa" className="relative z-10 -mt-14 lg:-mt-20">
        <div className="container">
          <Reveal>
            <dl className="grid grid-cols-2 divide-graphite-100 overflow-hidden rounded-3xl border border-graphite-100 bg-white shadow-lift lg:grid-cols-4 lg:divide-x">
              {[
                { value: c.yearsLabel, label: "de história", icon: Store },
                { value: `${rating}/5`, label: "de avaliação no Google", icon: null },
                { value: String(c.googleReviewCount), label: "avaliações", icon: Quote },
                { value: c.serviceArea, label: "é onde atendemos", icon: MapPin },
              ].map((item, i) => (
                <div key={item.label} className={`flex flex-col gap-1 p-6 sm:p-8 ${i < 2 ? "border-b border-graphite-100 lg:border-b-0" : ""} ${i % 2 === 0 ? "border-r border-graphite-100 lg:border-r-0" : ""}`}>
                  <dt className="order-2 text-sm text-graphite-500">{item.label}</dt>
                  <dd className="order-1 flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">
                    {item.icon ? <item.icon className="hidden h-6 w-6 text-brand-500 sm:block" aria-hidden="true" /> : <GoogleIcon className="hidden h-6 w-6 sm:block" />}
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      {/* ───────────── CATEGORIAS ───────────── */}
      {categories.length > 0 && (
        <section aria-labelledby="categorias-title" className="section">
          <div className="container">
            <SectionHeading
              id="categorias-title"
              eyebrow="Categorias"
              title="Tudo organizado para você encontrar mais rápido."
              description="Navegue pelas categorias e consulte disponibilidade e preços diretamente com a nossa equipe."
              action={
                <Link href="/categorias" className="btn btn-outline">
                  Todas as categorias <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              }
            />
            <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {categories.slice(0, 8).map((cat, i) => (
                <Reveal as="li" key={cat.id} delay={(i % 4) * 0.06}>
                  <CategoryCard category={cat} index={i} />
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ───────────── PRODUTOS EM DESTAQUE ───────────── */}
      {featured.items.length > 0 && (
        <section aria-labelledby="destaques-title" className="section bg-graphite-50">
          <div className="container">
            <SectionHeading
              id="destaques-title"
              eyebrow="Destaques"
              title="Produtos em destaque"
              description="Uma seleção do nosso catálogo. Fale com a equipe para confirmar disponibilidade."
              action={
                <Link href="/produtos" className="btn btn-outline">
                  Ver catálogo <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              }
            />
            <ul className="mt-12 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {featured.items.map((p, i) => (
                <Reveal as="li" key={p.id} delay={(i % 4) * 0.06}>
                  <ProductCard product={p} whatsapp={c.whatsapp} />
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ───────────── DESTAQUE: ENCONTRE ───────────── */}
      <section aria-labelledby="encontre-title" className={`section ${featured.items.length > 0 ? "" : "bg-graphite-50"}`}>
        <div className="container">
          <SectionHeading id="encontre-title" eyebrow="Para cada etapa" title={h.highlightTitle} description={h.highlightSubtitle} />
          <div className="mt-12 grid gap-5 lg:grid-cols-[1.15fr_1fr]">
            {h.highlights.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.08} className={i === 0 && h.highlights.length > 2 ? "lg:row-span-2" : ""}>
                <Link
                  href="/produtos"
                  className={`group relative flex h-full flex-col justify-end overflow-hidden rounded-[2rem] p-7 text-white shadow-soft sm:p-9 ${i === 0 ? "min-h-[420px] lg:min-h-[560px]" : "min-h-[270px]"}`}
                >
                  {item.image ? (
                    <Image src={item.image} alt="" fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />
                  ) : (
                    <SceneArt variant={i} className="absolute inset-0 h-full w-full transition duration-700 group-hover:scale-105" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/95 via-navy-950/45 to-navy-950/0" aria-hidden="true" />
                  <div className="relative">
                    <span className="font-display text-sm font-semibold text-brand-300">0{i + 1}</span>
                    <h3 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">{item.title}</h3>
                    {item.text && <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-white/80">{item.text}</p>}
                    <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold">
                      Ver produtos
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 backdrop-blur transition group-hover:translate-x-1 group-hover:bg-brand-500">
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </span>
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── SOBRE ───────────── */}
      <section aria-labelledby="sobre-title" className="section overflow-hidden">
        <div className="container grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal className="relative order-2 lg:order-1">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-gradient-to-br from-navy-50 to-graphite-100 shadow-lift">
              {h.aboutImage ? (
                <Image src={h.aboutImage} alt={`Loja ${c.shortName} em ${c.city}`} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
              ) : (
                <>
                  <div className="blueprint-grid-dark absolute inset-0" aria-hidden="true" />
                  <StorefrontIllustration className="absolute inset-0 m-auto h-[88%] w-[88%]" name={c.shortName} />
                </>
              )}
            </div>
            <div className="absolute -bottom-8 right-4 max-w-[240px] rounded-2xl bg-navy-900 p-5 text-white shadow-lift sm:-right-6">
              <p className="font-display text-4xl font-extrabold text-brand-400">{c.yearsLabel}</p>
              <p className="mt-1 text-sm text-white/75">atendendo {c.serviceArea}</p>
            </div>
          </Reveal>
          <div className="order-1 lg:order-2">
            <SectionHeading id="sobre-title" eyebrow="Sobre a Casa Tentudo" title={h.aboutTitle} description={h.aboutText} />
            <Reveal delay={0.1}>
              <ul className="mt-8 grid gap-4 sm:grid-cols-3">
                {[
                  { icon: Store, title: "Variedade", text: "Soluções para construir, reformar e melhorar." },
                  { icon: HandHeart, title: "Proximidade", text: "Atendimento próximo, de quem conhece a cidade." },
                  { icon: Wrench, title: "Da base ao detalhe", text: "Da fundação ao acabamento." },
                ].map((v) => (
                  <li key={v.title} className="rounded-2xl border border-graphite-100 p-4">
                    <v.icon className="h-6 w-6 text-brand-600" aria-hidden="true" strokeWidth={1.7} />
                    <p className="mt-3 font-display font-bold text-navy-900">{v.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-graphite-600">{v.text}</p>
                  </li>
                ))}
              </ul>
              <Link href="/sobre" className="btn btn-navy mt-8">
                Conheça nossa história <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ───────────── AVALIAÇÕES ───────────── */}
      <section id="avaliacoes" aria-labelledby="avaliacoes-title" className="section bg-graphite-50">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-[380px_1fr] lg:gap-14">
            <Reveal className="card h-fit p-8 lg:sticky lg:top-28">
              <p className="eyebrow">Avaliações</p>
              <h2 id="avaliacoes-title" className="mt-3 text-3xl font-extrabold">Quem conhece, recomenda.</h2>
              <div className="mt-8 flex items-end gap-3">
                <span className="font-display text-7xl font-extrabold leading-none tracking-tight text-navy-900">{rating}</span>
                <span className="pb-2 text-lg font-semibold text-graphite-500">/ 5</span>
              </div>
              <Stars value={c.googleRating} size="h-6 w-6" className="mt-3" />
              <p className="mt-3 flex items-center gap-2 text-graphite-600">
                <GoogleIcon className="h-4 w-4" />
                {c.googleReviewCount} avaliações no Google
              </p>
              {c.googleReviewsUrl && (
                <a href={c.googleReviewsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline mt-8 w-full">
                  Ver avaliações no Google <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              )}
            </Reveal>

            {testimonials.length > 0 ? (
              <ul className="grid gap-5 sm:grid-cols-2">
                {testimonials.slice(0, 6).map((t, i) => (
                  <Reveal as="li" key={t.id} delay={(i % 2) * 0.08} className="card flex flex-col p-7">
                    <Quote className="h-8 w-8 text-brand-200" aria-hidden="true" />
                    <Stars value={t.rating} className="mt-4" />
                    <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-graphite-700">“{t.content}”</blockquote>
                    <footer className="mt-6 flex items-center gap-3 border-t border-graphite-100 pt-5">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-100 font-display font-bold text-navy-800" aria-hidden="true">
                        {t.authorName.charAt(0).toUpperCase()}
                      </span>
                      <span>
                        <span className="block font-semibold text-navy-900">{t.authorName}</span>
                        <span className="block text-xs text-graphite-500">
                          via {t.source}
                          {t.reviewDate && ` · ${formatDate(t.reviewDate)}`}
                        </span>
                      </span>
                    </footer>
                  </Reveal>
                ))}
              </ul>
            ) : (
              <Reveal className="relative flex flex-col justify-center overflow-hidden rounded-3xl bg-navy-900 p-8 text-white sm:p-12">
                <div className="blueprint-grid absolute inset-0" aria-hidden="true" />
                <div className="relative max-w-xl">
                  <Quote className="h-10 w-10 text-brand-400" aria-hidden="true" />
                  <p className="mt-6 font-display text-2xl font-bold leading-snug sm:text-3xl">
                    {c.googleReviewCount} clientes já avaliaram a {c.shortName} no Google, com nota média de {rating}.
                  </p>
                  <p className="mt-4 text-white/70">Leia as opiniões completas de quem já comprou com a gente — e, se você também é cliente, deixe a sua.</p>
                  {c.googleReviewsUrl && (
                    <a href={c.googleReviewsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-8">
                      <GoogleIcon className="h-4 w-4 rounded-full bg-white p-0.5" />
                      Ler avaliações no Google
                    </a>
                  )}
                </div>
              </Reveal>
            )}
          </div>
        </div>
      </section>

      {/* ───────────── LOCALIZAÇÃO ───────────── */}
      <section id="localizacao" aria-labelledby="localizacao-title" className="section">
        <div className="container">
          <SectionHeading id="localizacao-title" eyebrow="Localização" title="Venha nos visitar." description={`Estamos no ${c.district ? `${c.district}, em ` : ""}${c.city}/${c.state}.`} />
          <div className="mt-12 grid gap-5 lg:grid-cols-[1fr_400px]">
            <Reveal className="min-h-[360px] lg:min-h-[460px]">
              <MapEmbed src={mapEmbedUrl(c)} title={`Mapa: ${c.name}`} address={fullAddress(c)} />
            </Reveal>
            <Reveal delay={0.08} className="card flex flex-col p-7 sm:p-8">
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-800"><MapPin className="h-5 w-5" aria-hidden="true" /></span>
                  <div>
                    <p className="text-sm font-medium text-graphite-500">Endereço</p>
                    <address className="mt-0.5 not-italic font-semibold leading-snug text-navy-900">{fullAddress(c)}</address>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-800"><Phone className="h-5 w-5" aria-hidden="true" /></span>
                  <div>
                    <p className="text-sm font-medium text-graphite-500">Telefone e WhatsApp</p>
                    <a href={telHref(c.phone)} className="mt-0.5 block font-semibold text-navy-900 hover:text-brand-600">{c.phone}</a>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-800"><Mail className="h-5 w-5" aria-hidden="true" /></span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-graphite-500">E-mail</p>
                    <a href={`mailto:${c.email}`} className="mt-0.5 block break-all font-semibold text-navy-900 hover:text-brand-600">{c.email}</a>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-800"><Clock className="h-5 w-5" aria-hidden="true" /></span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-graphite-500">Horário de funcionamento</p>
                    {s.hours.length > 0 ? (
                      <dl className="mt-1 space-y-1">
                        {s.hours.map((hr) => (
                          <div key={hr.days} className="flex justify-between gap-4 text-[15px]">
                            <dt className="text-graphite-600">{hr.days}</dt>
                            <dd className="font-semibold text-navy-900">{hr.time}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : null}
                    {s.hoursNote && <p className="mt-1 text-sm text-graphite-600">{s.hoursNote}</p>}
                  </div>
                </li>
              </ul>
              <div className="mt-auto grid gap-3 pt-8 sm:grid-cols-2 lg:grid-cols-1">
                <a href={directionsUrl(c)} target="_blank" rel="noopener noreferrer" className="btn btn-primary w-full">
                  <Navigation className="h-4 w-4" aria-hidden="true" /> Como chegar
                </a>
                <a href={waGeneral} target="_blank" rel="noopener noreferrer" className="btn btn-outline w-full">
                  <WhatsAppIcon className="h-4 w-4 text-whatsapp-deep" /> Chamar no WhatsApp
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <CtaBand title={h.ctaTitle} text={h.ctaText} whatsappHref={waGeneral} />
    </>
  );
}
