import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { clsx } from "clsx";
import { ChevronLeft, ChevronRight, PackageSearch } from "lucide-react";
import { CatalogToolbar } from "@/components/site/catalog-toolbar";
import { CtaBand } from "@/components/site/cta-band";
import { ProductCard } from "@/components/site/product-card";
import { WhatsAppIcon } from "@/components/ui/brand-icons";
import { CategoryIcon } from "@/components/ui/category-icon";
import { getCategories, getProducts, getSettings } from "@/lib/public-data";
import type { ProductSort } from "@/lib/types";
import { whatsappLink, whatsappMessages } from "@/lib/whatsapp";

const PAGE_SIZE = 24;
const SORTS: ProductSort[] = ["relevancia", "nome", "recentes", "menor-preco", "maior-preco"];

type SP = Promise<{ busca?: string; categoria?: string; ordem?: string; pagina?: string }>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = await searchParams;
  const categories = await getCategories();
  const cat = categories.find((c) => c.slug === sp.categoria);
  const title = cat ? `${cat.name} em Assis/SP` : "Produtos e materiais para construção";
  const description = cat
    ? `${cat.name} na Casa Tentudo, em Assis/SP. ${cat.description} Consulte disponibilidade e preços pelo WhatsApp.`
    : "Catálogo de materiais para construção e reforma da Casa Tentudo, em Assis/SP. Consulte disponibilidade e preços pelo WhatsApp.";
  return {
    title,
    description,
    alternates: { canonical: cat ? `/produtos?categoria=${cat.slug}` : "/produtos" },
    robots: sp.busca || sp.ordem || sp.pagina ? { index: false, follow: true } : undefined,
    openGraph: { title, description },
  };
}

function href(sp: Record<string, string | undefined>, patch: Record<string, string | null>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...sp, ...patch })) if (v) p.set(k, v);
  const qs = p.toString();
  return qs ? `/produtos?${qs}` : "/produtos";
}

export default async function ProductsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.pagina ?? "1", 10) || 1);
  const sort = SORTS.includes(sp.ordem as ProductSort) ? (sp.ordem as ProductSort) : "relevancia";
  const search = (sp.busca ?? "").slice(0, 80);
  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);
  const active = categories.find((c) => c.slug === sp.categoria);
  const { items, total } = await getProducts({
    search: search || undefined,
    categorySlug: active?.slug,
    sort,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const c = settings.company;
  const keep = { busca: sp.busca, categoria: sp.categoria, ordem: sp.ordem };
  const askMessage = active ? whatsappMessages.category(active.name) : search ? `Olá! Vocês têm ${search}?` : whatsappMessages.quote;

  return (
    <>
      <section className="relative overflow-hidden border-b border-graphite-100 bg-graphite-50">
        <div className="blueprint-grid-dark absolute inset-0" aria-hidden="true" />
        <div className="container relative py-12 sm:py-16">
          <nav aria-label="Trilha de navegação" className="text-sm text-graphite-500">
            <ol className="flex items-center gap-2">
              <li><Link href="/" className="hover:text-navy-900">Início</Link></li>
              <li aria-hidden="true">/</li>
              <li className={active ? "" : "font-medium text-navy-900"} aria-current={active ? undefined : "page"}>
                {active ? <Link href="/produtos" className="hover:text-navy-900">Produtos</Link> : "Produtos"}
              </li>
              {active && (
                <>
                  <li aria-hidden="true">/</li>
                  <li className="font-medium text-navy-900" aria-current="page">{active.name}</li>
                </>
              )}
            </ol>
          </nav>
          <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">{active ? active.name : "Nossos produtos"}</h1>
          <p className="mt-3 max-w-2xl text-lg text-graphite-600">
            {active?.description || "Conheça o catálogo e consulte disponibilidade e preços diretamente com a nossa equipe pelo WhatsApp."}
          </p>
        </div>
      </section>

      <section className="container py-10 sm:py-12" aria-label="Catálogo">
        <Suspense fallback={<div className="h-12" />}>
          <CatalogToolbar total={total} />
        </Suspense>

        <nav aria-label="Filtrar por categoria" className="-mx-4 mt-6 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:px-0">
          <ul className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
            <li>
              <Link
                href={href({ ...keep, categoria: undefined }, {})}
                aria-current={!active ? "true" : undefined}
                className={clsx("inline-flex h-10 items-center rounded-full border px-4 text-sm font-medium transition", !active ? "border-navy-900 bg-navy-900 text-white" : "border-graphite-200 bg-white text-graphite-700 hover:border-navy-300")}
              >
                Todos
              </Link>
            </li>
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={href(keep, { categoria: cat.slug })}
                  aria-current={active?.id === cat.id ? "true" : undefined}
                  className={clsx(
                    "inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-sm font-medium transition",
                    active?.id === cat.id ? "border-navy-900 bg-navy-900 text-white" : "border-graphite-200 bg-white text-graphite-700 hover:border-navy-300",
                  )}
                >
                  <CategoryIcon name={cat.icon} className="h-4 w-4" />
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className="mt-6 hidden text-sm text-graphite-500 sm:block" aria-live="polite">
          {total === 0 ? "Nenhum produto encontrado" : `${total} ${total === 1 ? "produto encontrado" : "produtos encontrados"}`}
          {search && <> para “<strong className="text-navy-900">{search}</strong>”</>}
        </p>

        <h2 className="sr-only">Lista de produtos</h2>
        {items.length > 0 ? (
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
            {items.map((p, i) => (
              <li key={p.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
                <ProductCard product={p} whatsapp={c.whatsapp} priority={i < 4} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-8 flex flex-col items-center rounded-3xl border border-dashed border-graphite-200 bg-white px-6 py-16 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-50 text-navy-700">
              <PackageSearch className="h-8 w-8" aria-hidden="true" />
            </span>
            <h2 className="mt-5 text-2xl font-bold">
              {search || active ? "Não encontrou o que procura?" : "Nosso catálogo on-line está sendo preparado."}
            </h2>
            <p className="mt-2 max-w-md text-graphite-600">
              {search || active
                ? "Nem todos os itens da loja estão no site. Pergunte para a nossa equipe — respondemos pelo WhatsApp."
                : "Enquanto isso, fale com a nossa equipe pelo WhatsApp e consulte disponibilidade e preços do que você precisa."}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a href={whatsappLink(c.whatsapp, askMessage)} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                <WhatsAppIcon className="h-4 w-4" /> Perguntar pelo WhatsApp
              </a>
              {(search || active) && (
                <Link href="/produtos" className="btn btn-outline">Limpar filtros</Link>
              )}
            </div>
          </div>
        )}

        {pages > 1 && (
          <nav aria-label="Paginação" className="mt-12 flex items-center justify-center gap-2">
            {page > 1 ? (
              <Link href={href(keep, { pagina: String(page - 1) })} className="btn btn-outline btn-sm" rel="prev">
                <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Anterior
              </Link>
            ) : null}
            <span className="px-4 text-sm text-graphite-600">
              Página <strong className="text-navy-900">{page}</strong> de {pages}
            </span>
            {page < pages ? (
              <Link href={href(keep, { pagina: String(page + 1) })} className="btn btn-outline btn-sm" rel="next">
                Próxima <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : null}
          </nav>
        )}
      </section>

      <CtaBand
        title="Não encontrou o que precisa?"
        text="Nem todos os itens da loja estão no site. Fale com a equipe e consulte disponibilidade e preços."
        whatsappHref={whatsappLink(c.whatsapp, askMessage)}
      />
    </>
  );
}
