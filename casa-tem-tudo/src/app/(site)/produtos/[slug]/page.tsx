import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Info, Phone, Tag } from "lucide-react";
import { JsonLd } from "@/components/site/json-ld";
import { ProductCard } from "@/components/site/product-card";
import { ProductImage } from "@/components/site/product-image";
import { WhatsAppIcon } from "@/components/ui/brand-icons";
import { formatPrice, telHref } from "@/lib/format";
import { getProduct, getRelated, getSettings } from "@/lib/public-data";
import { SITE_URL } from "@/lib/site-url";
import { whatsappLink, whatsappMessages } from "@/lib/whatsapp";

export const revalidate = 300;

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return { title: "Produto não encontrado", robots: { index: false } };
  const description = (p.shortDescription || p.description || `${p.name} na Casa Tem Tudo, em Assis/SP.`).slice(0, 160);
  return {
    title: p.name,
    description,
    alternates: { canonical: `/produtos/${p.slug}` },
    openGraph: { title: p.name, description, type: "website", images: p.imageUrl ? [{ url: p.imageUrl }] : undefined },
  };
}

function paragraphs(text: string | null) {
  return (text ?? "")
    .split(/\n{2,}|\r\n\r\n/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const [product, settings, related] = await Promise.all([getProduct(slug), getSettings(), getRelated(slug)]);
  if (!product) notFound();
  const c = settings.company;
  const price = formatPrice(product.price);
  const details = (product.details ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const idx = l.indexOf(":");
      return idx > 0 ? { k: l.slice(0, idx).trim(), v: l.slice(idx + 1).trim() } : { k: "", v: l };
    });
  const wa = whatsappLink(c.whatsapp, whatsappMessages.product(product.name));

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription || product.description || undefined,
    image: product.imageUrl ? new URL(product.imageUrl, SITE_URL).toString() : undefined,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    category: product.categoryName ?? undefined,
    url: `${SITE_URL}/produtos/${product.slug}`,
    offers:
      product.price !== null
        ? {
            "@type": "Offer",
            price: product.price.toFixed(2),
            priceCurrency: "BRL",
            seller: { "@id": `${SITE_URL}/#empresa` },
            url: `${SITE_URL}/produtos/${product.slug}`,
          }
        : undefined,
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Produtos", item: `${SITE_URL}/produtos` },
      ...(product.categorySlug
        ? [{ "@type": "ListItem", position: 3, name: product.categoryName, item: `${SITE_URL}/produtos?categoria=${product.categorySlug}` }]
        : []),
      { "@type": "ListItem", position: product.categorySlug ? 4 : 3, name: product.name },
    ],
  };

  return (
    <>
      <JsonLd data={schema} />
      <JsonLd data={breadcrumb} />
      <div className="container py-8 sm:py-12">
        <nav aria-label="Trilha de navegação" className="text-sm text-graphite-500">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link href="/" className="hover:text-navy-900">Início</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/produtos" className="hover:text-navy-900">Produtos</Link></li>
            {product.categorySlug && (
              <>
                <li aria-hidden="true">/</li>
                <li><Link href={`/produtos?categoria=${product.categorySlug}`} className="hover:text-navy-900">{product.categoryName}</Link></li>
              </>
            )}
            <li aria-hidden="true">/</li>
            <li className="max-w-[16rem] truncate font-medium text-navy-900" aria-current="page">{product.name}</li>
          </ol>
        </nav>

        <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="relative aspect-square overflow-hidden rounded-[2rem] border border-graphite-100 bg-white shadow-soft">
              <ProductImage src={product.imageUrl} alt={product.name} priority sizes="(min-width: 1024px) 50vw, 100vw" pad="p-8" />
            </div>
          </div>

          <div>
            {product.categoryName && (
              <Link href={`/produtos?categoria=${product.categorySlug}`} className="inline-flex items-center gap-1.5 rounded-full bg-navy-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-navy-800 hover:bg-navy-100">
                <Tag className="h-3.5 w-3.5" aria-hidden="true" /> {product.categoryName}
              </Link>
            )}
            <h1 className="mt-4 text-balance text-3xl font-extrabold leading-tight sm:text-4xl lg:text-[2.75rem]">{product.name}</h1>
            {product.brand && (
              <p className="mt-3 text-graphite-600">
                Marca: <strong className="text-navy-900">{product.brand}</strong>
              </p>
            )}
            {product.shortDescription && <p className="mt-5 text-lg leading-relaxed text-graphite-700">{product.shortDescription}</p>}

            <div className="mt-8 rounded-3xl border border-graphite-100 bg-graphite-50 p-6">
              {price ? (
                <>
                  <p className="text-sm text-graphite-500">Preço</p>
                  <p className="mt-1 font-display text-4xl font-extrabold text-navy-900">
                    {price}
                    {product.unit && <span className="ml-2 text-base font-medium text-graphite-500">/ {product.unit}</span>}
                  </p>
                  <p className="mt-2 text-xs text-graphite-500">Preço e disponibilidade sujeitos a confirmação com a loja.</p>
                </>
              ) : (
                <>
                  <p className="font-display text-2xl font-extrabold text-navy-900">Consulte o preço</p>
                  <p className="mt-1 text-sm text-graphite-600">Fale com a nossa equipe para saber valores e disponibilidade.</p>
                </>
              )}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-lg w-full">
                  <WhatsAppIcon className="h-5 w-5" /> Consultar pelo WhatsApp
                </a>
                <a href={telHref(c.phone)} className="btn btn-outline btn-lg w-full">
                  <Phone className="h-5 w-5" aria-hidden="true" /> {c.phone}
                </a>
              </div>
            </div>

            {paragraphs(product.description).length > 0 && (
              <section className="mt-10" aria-labelledby="descricao">
                <h2 id="descricao" className="text-xl font-bold">Descrição</h2>
                <div className="prose-ctt mt-3 text-[15px] leading-relaxed text-graphite-700">
                  {paragraphs(product.description).map((p, i) => (
                    <p key={i} className="whitespace-pre-line">{p}</p>
                  ))}
                </div>
              </section>
            )}

            {details.length > 0 && (
              <section className="mt-10" aria-labelledby="info">
                <h2 id="info" className="text-xl font-bold">Informações adicionais</h2>
                <dl className="mt-4 divide-y divide-graphite-100 overflow-hidden rounded-2xl border border-graphite-100">
                  {details.map((d, i) => (
                    <div key={i} className="grid gap-1 px-5 py-3.5 text-[15px] sm:grid-cols-[180px_1fr] sm:gap-4">
                      {d.k ? <dt className="font-medium text-graphite-500">{d.k}</dt> : <dt className="sr-only">Informação</dt>}
                      <dd className={d.k ? "text-navy-900" : "text-navy-900 sm:col-span-2"}>{d.v}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            <p className="mt-10 flex gap-3 rounded-2xl bg-navy-50 p-4 text-sm text-navy-800">
              <Info className="h-5 w-5 shrink-0" aria-hidden="true" />
              Imagens ilustrativas. Confirme especificações, disponibilidade e condições diretamente com a loja.
            </p>

            <Link href="/produtos" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-navy-800 hover:text-brand-600">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Voltar ao catálogo
            </Link>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-20 border-t border-graphite-100 pt-14" aria-labelledby="relacionados">
            <h2 id="relacionados" className="text-2xl font-extrabold sm:text-3xl">Da mesma categoria</h2>
            <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {related.map((p) => (
                <li key={p.id}>
                  <ProductCard product={p} whatsapp={c.whatsapp} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
