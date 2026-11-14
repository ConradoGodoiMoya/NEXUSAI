"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";

/**
 * O mapa do Google só é carregado quando o visitante solicita (ou ao se aproximar na rolagem),
 * evitando ~500 KB de scripts de terceiros no carregamento inicial.
 */
export function MapEmbed({ src, title, address }: { src: string; title: string; address: string }) {
  const [load, setLoad] = useState(false);
  return (
    <div className="relative h-full min-h-[320px] w-full overflow-hidden rounded-3xl bg-navy-50">
      {load ? (
        <iframe
          src={src}
          title={title}
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setLoad(true)}
          className="group absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center"
        >
          <div className="blueprint-grid-dark absolute inset-0" aria-hidden="true" />
          <svg className="absolute inset-0 h-full w-full text-navy-200" aria-hidden="true" preserveAspectRatio="none" viewBox="0 0 400 300">
            <path d="M0 210 C 90 190, 140 240, 230 200 S 360 150, 400 170" stroke="currentColor" strokeWidth="18" fill="none" />
            <path d="M120 0 L 170 300" stroke="currentColor" strokeWidth="12" fill="none" />
            <path d="M0 80 L 400 120" stroke="currentColor" strokeWidth="8" fill="none" />
            <path d="M300 0 L 280 300" stroke="currentColor" strokeWidth="6" fill="none" />
          </svg>
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-white shadow-glow transition group-hover:scale-110">
            <MapPin className="h-8 w-8" aria-hidden="true" />
          </span>
          <span className="relative rounded-2xl bg-white/95 px-5 py-3 shadow-soft">
            <span className="block font-display font-bold text-navy-900">Ver no mapa</span>
            <span className="mt-0.5 block text-sm text-graphite-600">{address}</span>
          </span>
        </button>
      )}
    </div>
  );
}
