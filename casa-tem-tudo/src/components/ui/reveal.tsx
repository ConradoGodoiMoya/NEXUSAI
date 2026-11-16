"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Entrada suave ao rolar a página.
 * O HTML do servidor é sempre visível (bom para SEO e para quem navega sem JavaScript);
 * a animação só é aplicada no navegador, a elementos ainda fora da tela, via IntersectionObserver.
 * Respeita “reduzir movimento” do sistema (ver globals.css).
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "section" | "article";
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92) return; // já visível: não anima
    el.dataset.reveal = "hidden";
    el.style.transitionDelay = `${delay}s`;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.dataset.reveal = "shown";
            io.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  return (
    <Tag ref={ref as never} className={className}>
      {children}
    </Tag>
  );
}
