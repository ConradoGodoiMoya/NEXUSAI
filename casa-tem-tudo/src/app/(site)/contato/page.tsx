import type { Metadata } from "next";
import { Clock, Mail, MapPin, Navigation, Phone } from "lucide-react";
import { ContactForm } from "@/components/site/contact-form";
import { MapEmbed } from "@/components/site/map-embed";
import { PageHero } from "@/components/site/page-hero";
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from "@/components/ui/brand-icons";
import { Reveal } from "@/components/ui/reveal";
import { telHref } from "@/lib/format";
import { getSettings } from "@/lib/public-data";
import { directionsUrl, fullAddress, mapEmbedUrl } from "@/lib/settings-schema";
import { whatsappLink, whatsappMessages } from "@/lib/whatsapp";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Contato, endereço e WhatsApp",
  description: "Fale com a Casa Tem Tudo pelo WhatsApp (18) 3321-1449 ou visite a loja na Av. Rui Barbosa, 2644 — Jardim Paulista, Assis/SP.",
  alternates: { canonical: "/contato" },
};

export default async function ContactPage() {
  const s = await getSettings();
  const c = s.company;
  const wa = whatsappLink(c.whatsapp, whatsappMessages.general);
  return (
    <>
      <PageHero crumb="Contato" title="Fale com a nossa equipe." description="Tire dúvidas, consulte produtos e peça seu orçamento. A forma mais rápida é pelo WhatsApp.">
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-lg bg-whatsapp text-navy-950 hover:-translate-y-0.5 hover:bg-[#3be07a]">
            <WhatsAppIcon className="h-5 w-5" /> Falar pelo WhatsApp
          </a>
          <a href={telHref(c.phone)} className="btn btn-lg btn-ghost-light">
            <Phone className="h-5 w-5" aria-hidden="true" /> Ligar {c.phone}
          </a>
        </div>
      </PageHero>

      <section className="section" aria-label="Canais de contato">
        <div className="container grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
          <Reveal className="card p-6 sm:p-10">
            <h2 className="text-2xl font-extrabold sm:text-3xl">Envie sua mensagem</h2>
            <p className="mt-2 text-graphite-600">Preencha e escolha como prefere enviar.</p>
            <div className="mt-8">
              <ContactForm whatsapp={c.whatsapp} email={c.email} />
            </div>
          </Reveal>

          <Reveal delay={0.08} className="space-y-5">
            {[
              { icon: Phone, label: "Telefone", value: c.phone, href: telHref(c.phone) },
              { icon: WhatsAppIcon, label: "WhatsApp", value: c.phone, href: wa, external: true },
              { icon: Mail, label: "E-mail", value: c.email, href: `mailto:${c.email}` },
              { icon: MapPin, label: "Endereço", value: fullAddress(c), href: directionsUrl(c), external: true },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                className="group flex items-center gap-4 rounded-2xl border border-graphite-100 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-graphite-200 hover:shadow-lift"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-800 transition group-hover:bg-brand-600 group-hover:text-white">
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm text-graphite-500">{item.label}</span>
                  <span className="block break-words font-semibold text-navy-900">{item.value}</span>
                </span>
              </a>
            ))}
            <div className="rounded-2xl border border-graphite-100 bg-white p-5 shadow-soft">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-800"><Clock className="h-5 w-5" aria-hidden="true" /></span>
                <span className="text-sm text-graphite-500">Horário de funcionamento</span>
              </div>
              {s.hours.length > 0 && (
                <dl className="mt-4 space-y-1.5">
                  {s.hours.map((h) => (
                    <div key={h.days} className="flex justify-between gap-4">
                      <dt className="text-graphite-600">{h.days}</dt>
                      <dd className="font-semibold text-navy-900">{h.time}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {s.hoursNote && <p className="mt-3 text-sm text-graphite-600">{s.hoursNote}</p>}
            </div>
            <div className="flex gap-3">
              {c.instagram && (
                <a href={c.instagram} target="_blank" rel="noopener noreferrer" className="btn btn-outline flex-1">
                  <InstagramIcon className="h-5 w-5" /> {c.instagramHandle || "Instagram"}
                </a>
              )}
              {c.facebook && (
                <a href={c.facebook} target="_blank" rel="noopener noreferrer" className="btn btn-outline flex-1">
                  <FacebookIcon className="h-5 w-5" /> Facebook
                </a>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="pb-20 sm:pb-28" aria-labelledby="mapa">
        <div className="container">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <h2 id="mapa" className="text-2xl font-extrabold sm:text-3xl">Como chegar</h2>
            <a href={directionsUrl(c)} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              <Navigation className="h-4 w-4" aria-hidden="true" /> Abrir rota no Google Maps
            </a>
          </div>
          <div className="mt-6 h-[420px]">
            <MapEmbed src={mapEmbedUrl(c)} title={`Mapa: ${c.name}`} address={fullAddress(c)} />
          </div>
        </div>
      </section>
    </>
  );
}
