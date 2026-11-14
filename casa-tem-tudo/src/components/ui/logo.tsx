import { clsx } from "clsx";

/** Símbolo da marca: casa com telhado laranja e “tijolos” — desenhado em SVG (nítido em qualquer tela). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={clsx("shrink-0", className)}>
      <rect width="48" height="48" rx="13" fill="#0B1B36" />
      <path d="M9 23.5 24 11l15 12.5" fill="none" stroke="#F26B1D" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 24v13.2c0 .9.7 1.6 1.6 1.6h16.8c.9 0 1.6-.7 1.6-1.6V24" fill="none" stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
      <rect x="18.6" y="27.4" width="4.6" height="3.6" rx=".8" fill="#fff" />
      <rect x="24.8" y="27.4" width="4.6" height="3.6" rx=".8" fill="#fff" opacity=".55" />
      <rect x="21.7" y="32.6" width="4.6" height="3.6" rx=".8" fill="#F26B1D" />
    </svg>
  );
}

export function Logo({ className, tone = "dark", compact = false }: { className?: string; tone?: "dark" | "light"; compact?: boolean }) {
  return (
    <span className={clsx("inline-flex items-center gap-2.5", className)}>
      <LogoMark className="h-10 w-10" />
      <span className="flex flex-col leading-none">
        <span
          className={clsx(
            "font-display text-[19px] font-extrabold tracking-[-0.03em]",
            tone === "dark" ? "text-navy-900" : "text-white",
          )}
        >
          Casa Tem <span className="text-brand-500">Tudo</span>
        </span>
        {!compact && (
          <span
            className={clsx(
              "mt-1 text-[10px] font-semibold uppercase tracking-[0.2em]",
              tone === "dark" ? "text-graphite-500" : "text-white/60",
            )}
          >
            Materiais para construção
          </span>
        )}
      </span>
    </span>
  );
}
