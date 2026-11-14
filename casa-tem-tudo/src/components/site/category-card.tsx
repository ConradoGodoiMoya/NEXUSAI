import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CategoryIcon } from "@/components/ui/category-icon";
import type { Category } from "@/lib/types";

const TINTS = [
  "from-navy-50 to-white",
  "from-brand-50 to-white",
  "from-graphite-100 to-white",
  "from-navy-100/70 to-white",
];

export function CategoryCard({ category, index = 0 }: { category: Category; index?: number }) {
  return (
    <Link
      href={`/produtos?categoria=${category.slug}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-graphite-100 bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:border-graphite-200 hover:shadow-lift"
    >
      <div className={`relative aspect-[4/3] overflow-hidden bg-gradient-to-br ${TINTS[index % TINTS.length]}`}>
        {category.imageUrl ? (
          <Image
            src={category.imageUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <>
            <div className="blueprint-grid-dark absolute inset-0" aria-hidden="true" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-navy-800 shadow-soft ring-1 ring-graphite-100 transition duration-300 group-hover:scale-110 group-hover:text-brand-600">
                <CategoryIcon name={category.icon} className="h-10 w-10" />
              </span>
            </div>
          </>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-lg font-bold leading-snug">{category.name}</h3>
        {category.description && <p className="mt-2 line-clamp-2 text-[15px] leading-relaxed text-graphite-600">{category.description}</p>}
        <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-brand-600">
          Consultar produtos
          <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
