"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { clsx } from "clsx";
import { Menu, Phone, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { WhatsAppIcon } from "@/components/ui/brand-icons";
import { NAV_LINKS } from "./nav-links";

interface Props {
  whatsappHref: string;
  phone: string;
  phoneHref: string;
}

export function Header({ whatsappHref, phone, phoneHref }: Props) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header
      className={clsx(
        "sticky top-0 z-50 transition-[background-color,box-shadow,border-color] duration-300",
        scrolled || open
          ? "border-b border-graphite-100 bg-white/90 shadow-[0_8px_30px_-20px_rgba(11,27,54,.35)] backdrop-blur-xl"
          : "border-b border-transparent bg-white/70 backdrop-blur",
      )}
    >
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-navy-900 focus:px-4 focus:py-2 focus:text-white">
        Pular para o conteúdo
      </a>
      <div className="container flex h-[72px] items-center justify-between gap-6">
        <Link href="/" className="rounded-lg">
          <Logo />
        </Link>

        <nav aria-label="Navegação principal" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={isActive(l.href) ? "page" : undefined}
                  className={clsx(
                    "relative rounded-full px-4 py-2 text-[15px] font-medium transition-colors",
                    isActive(l.href) ? "text-navy-900" : "text-graphite-600 hover:text-navy-900",
                  )}
                >
                  {isActive(l.href) && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 -z-10 rounded-full bg-navy-50"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <a href={phoneHref} className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-navy-900 transition hover:bg-navy-50 xl:inline-flex">
            <Phone className="h-4 w-4 text-brand-600" aria-hidden="true" />
            {phone}
          </a>
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm hidden sm:inline-flex">
            <WhatsAppIcon className="h-4 w-4" />
            Fale conosco
          </a>
          <button
            ref={menuButton}
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-navy-900 transition hover:bg-navy-50 lg:hidden"
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="menu-mobile"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "calc(100dvh - 72px)" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-graphite-100 bg-white lg:hidden"
          >
            <nav aria-label="Menu móvel" className="container flex h-full flex-col py-6">
              <ul className="space-y-1">
                {NAV_LINKS.map((l, i) => (
                  <motion.li
                    key={l.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.04 }}
                  >
                    <Link
                      href={l.href}
                      aria-current={isActive(l.href) ? "page" : undefined}
                      className={clsx(
                        "flex items-center justify-between rounded-2xl px-4 py-4 font-display text-2xl font-bold tracking-tight",
                        isActive(l.href) ? "bg-navy-50 text-navy-900" : "text-navy-900 hover:bg-graphite-50",
                      )}
                    >
                      {l.label}
                      {isActive(l.href) && <span className="h-2 w-2 rounded-full bg-brand-500" aria-hidden="true" />}
                    </Link>
                  </motion.li>
                ))}
              </ul>
              <div className="mt-auto space-y-3 pb-[env(safe-area-inset-bottom)]">
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-lg w-full">
                  <WhatsAppIcon className="h-5 w-5" />
                  Falar pelo WhatsApp
                </a>
                <a href={phoneHref} className="btn btn-outline btn-lg w-full">
                  <Phone className="h-5 w-5" aria-hidden="true" />
                  Ligar {phone}
                </a>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
