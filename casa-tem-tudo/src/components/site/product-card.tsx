import Link from "next/link";
import { Sparkles } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/brand-icons";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import { whatsappLink, whatsappMessages } from "@/lib/whatsapp";
import { ProductImage } from "./product-image";

export function ProductCard({ product, whatsapp, priority }: { product: Product; whatsapp: string; priority?: boolean }) {
  const price = formatPrice(product.price);
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-graphite-100 bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift">
      <div className="relative aspect-square overflow-hidden bg-white">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          priority={priority}
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
          className="transition duration-500 group-hover:scale-[1.04]"
        />
        {product.featured && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-navy-900 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
            <Sparkles className="h-3 w-3 text-brand-400" aria-hidden="true" /> Destaque
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col border-t border-graphite-100 p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-graphite-500">
          {product.categoryName ?? "Produto"}
          {product.brand && <span> · {product.brand}</span>}
        </p>
        <h3 className="mt-1.5 line-clamp-2 font-display text-base font-bold leading-snug text-navy-900 sm:text-[17px]">
          <Link href={`/produtos/${product.slug}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {product.name}
          </Link>
        </h3>
        {product.shortDescription && <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-graphite-600">{product.shortDescription}</p>}
        <div className="mt-auto pt-4">
          <p className={price ? "font-display text-xl font-extrabold text-navy-900" : "text-sm font-semibold text-brand-700"}>
            {price ?? "Consulte o preço"}
            {price && product.unit && <span className="ml-1 text-sm font-medium text-graphite-500">/ {product.unit}</span>}
          </p>
          <a
            href={whatsappLink(whatsapp, whatsappMessages.product(product.name))}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-whatsapp btn-sm relative z-10 mt-3 w-full"
          >
            <WhatsAppIcon className="h-4 w-4" />
            <span>
              Consultar<span className="hidden sm:inline"> pelo WhatsApp</span>
              <span className="sr-only"> {product.name}</span>
            </span>
          </a>
        </div>
      </div>
    </article>
  );
}
