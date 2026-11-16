import { clsx } from "clsx";
import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/reveal";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  action,
  tone = "dark",
  id,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  action?: ReactNode;
  tone?: "dark" | "light";
  id?: string;
}) {
  return (
    <Reveal
      className={clsx(
        "flex flex-col gap-6",
        align === "center" ? "items-center text-center" : "md:flex-row md:items-end md:justify-between",
      )}
    >
      <div className={clsx("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow && <p className={clsx("eyebrow", tone === "light" && "text-brand-400")}>{eyebrow}</p>}
        <h2
          id={id}
          className={clsx(
            "mt-3 text-balance text-3xl font-extrabold leading-[1.1] sm:text-4xl lg:text-[44px]",
            tone === "light" && "text-white",
          )}
        >
          {title}
        </h2>
        {description && (
          <p className={clsx("mt-4 text-pretty text-lg leading-relaxed", tone === "light" ? "text-white/70" : "text-graphite-600")}>
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </Reveal>
  );
}
