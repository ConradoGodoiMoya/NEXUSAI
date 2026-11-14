import Link from "next/link";
import type { ReactNode } from "react";

export function PageHero({ title, description, crumb, children }: { title: string; description?: string; crumb: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-navy-950 text-white">
      <div className="blueprint-grid absolute inset-0" aria-hidden="true" />
      <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-500/25 blur-3xl" aria-hidden="true" />
      <div className="container relative py-14 sm:py-20">
        <nav aria-label="Trilha de navegação" className="text-sm text-white/60">
          <ol className="flex items-center gap-2">
            <li><Link href="/" className="hover:text-white">Início</Link></li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-white" aria-current="page">{crumb}</li>
          </ol>
        </nav>
        <h1 className="mt-5 max-w-3xl animate-fade-up text-balance text-4xl font-extrabold leading-[1.05] text-white sm:text-5xl lg:text-6xl">{title}</h1>
        {description && <p className="mt-5 max-w-2xl animate-fade-up text-lg leading-relaxed text-white/70 [animation-delay:100ms]">{description}</p>}
        {children}
      </div>
    </section>
  );
}
