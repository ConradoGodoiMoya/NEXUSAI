import { clsx } from "clsx";

/** Estrelas com preenchimento fracionado (ex.: 4,7). */
export function Stars({ value, className, size = "h-4 w-4" }: { value: number; className?: string; size?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-0.5", className)} role="img" aria-label={`${value.toLocaleString("pt-BR")} de 5 estrelas`}>
      {Array.from({ length: 5 }, (_, i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <span key={i} className={clsx("relative inline-block", size)}>
            <Star className="absolute inset-0 h-full w-full text-graphite-200" />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className={clsx("h-full text-amber-400", size)} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

function Star({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
    </svg>
  );
}
