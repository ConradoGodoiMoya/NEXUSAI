import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { WhatsAppIcon } from "@/components/ui/brand-icons";
import { Reveal } from "@/components/ui/reveal";

export function CtaBand({ title, text, whatsappHref }: { title: string; text: string; whatsappHref: string }) {
  return (
    <section aria-labelledby="cta-final" className="section pt-0">
      <div className="container">
        <Reveal className="relative overflow-hidden rounded-[2rem] bg-navy-900 px-6 py-14 text-center sm:px-12 sm:py-20">
          <div className="blueprint-grid absolute inset-0" aria-hidden="true" />
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-navy-400/30 blur-3xl" aria-hidden="true" />
          <div className="relative mx-auto max-w-2xl">
            <h2 id="cta-final" className="text-balance text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">
              {title}
            </h2>
            {text && <p className="mx-auto mt-5 max-w-xl text-lg text-white/75">{text}</p>}
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-lg bg-whatsapp text-navy-950 shadow-[0_14px_40px_-12px_rgba(37,211,102,.8)] hover:-translate-y-0.5 hover:bg-[#3be07a]">
                <WhatsAppIcon className="h-5 w-5" />
                Falar pelo WhatsApp
              </a>
              <Link href="/produtos" className="btn btn-lg btn-ghost-light">
                Ver produtos <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
