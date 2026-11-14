import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from "@/components/ui/brand-icons";
import { telHref } from "@/lib/format";
import { fullAddress, type SiteSettings } from "@/lib/settings-schema";
import { whatsappLink, whatsappMessages } from "@/lib/whatsapp";
import { NAV_LINKS } from "./nav-links";

export function Footer({ settings, categories }: { settings: SiteSettings; categories: { name: string; slug: string }[] }) {
  const c = settings.company;
  const year = new Date().getFullYear();
  return (
    <footer className="relative overflow-hidden bg-navy-950 text-white/70">
      <div className="blueprint-grid absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="container relative grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-12 lg:py-20">
        <div className="lg:col-span-4">
          <Logo tone="light" />
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed">{c.slogan}</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/50">
            {c.yearsLabel} de história atendendo {c.serviceArea}.
          </p>
          <div className="mt-6 flex gap-2">
            {c.instagram && (
              <a href={c.instagram} target="_blank" rel="noopener noreferrer" aria-label={`Instagram ${c.instagramHandle}`} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 transition hover:border-brand-400 hover:bg-white/5 hover:text-white">
                <InstagramIcon className="h-5 w-5" />
              </a>
            )}
            {c.facebook && (
              <a href={c.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook Casa Tem Tudo" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 transition hover:border-brand-400 hover:bg-white/5 hover:text-white">
                <FacebookIcon className="h-5 w-5" />
              </a>
            )}
            <a href={whatsappLink(c.whatsapp, whatsappMessages.general)} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 transition hover:border-brand-400 hover:bg-white/5 hover:text-white">
              <WhatsAppIcon className="h-5 w-5" />
            </a>
          </div>
        </div>

        <nav aria-label="Rodapé — navegação" className="lg:col-span-2">
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-white">Navegação</h2>
          <ul className="mt-5 space-y-3 text-[15px]">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Rodapé — categorias" className="lg:col-span-3">
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-white">Categorias</h2>
          <ul className="mt-5 space-y-3 text-[15px]">
            {categories.slice(0, 6).map((cat) => (
              <li key={cat.slug}>
                <Link href={`/produtos?categoria=${cat.slug}`} className="transition hover:text-white">
                  {cat.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/categorias" className="font-semibold text-brand-400 transition hover:text-brand-300">
                Ver todas
              </Link>
            </li>
          </ul>
        </nav>

        <div className="lg:col-span-3">
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-white">Contato</h2>
          <address className="mt-5 space-y-4 text-[15px] not-italic">
            <p className="flex gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" aria-hidden="true" />
              <span>{fullAddress(c)}</span>
            </p>
            <p>
              <a href={telHref(c.phone)} className="flex gap-3 transition hover:text-white">
                <Phone className="h-5 w-5 shrink-0 text-brand-400" aria-hidden="true" />
                {c.phone}
              </a>
            </p>
            <p>
              <a href={`mailto:${c.email}`} className="flex gap-3 break-all transition hover:text-white">
                <Mail className="h-5 w-5 shrink-0 text-brand-400" aria-hidden="true" />
                {c.email}
              </a>
            </p>
          </address>
        </div>
      </div>
      <div className="relative border-t border-white/10">
        <div className="container flex flex-col gap-2 py-6 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {c.name}. Todos os direitos reservados.
          </p>
          <p>{c.city} · {c.state}</p>
        </div>
      </div>
    </footer>
  );
}
