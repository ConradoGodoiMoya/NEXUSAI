import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { listCategories, getCategoryBySlug } from "./data/categories";
import { listProducts, getProductBySlug, listRelatedProducts, listAllProductSlugs, type ProductQuery } from "./data/products";
import { readSettings } from "./data/settings";
import { listTestimonials } from "./data/testimonials";
import { logger } from "./logger";
import { defaultSettings } from "./settings-schema";

/** Tags de cache invalidadas pelo painel após cada alteração. */
export const TAGS = { settings: "settings", catalog: "catalog", testimonials: "testimonials" } as const;
const REVALIDATE = 300;

/**
 * Leitura pública resiliente: se o banco estiver indisponível, o site continua no ar
 * com as informações padrão da empresa e o erro é registrado em log.
 */
async function safe<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    logger.error(`Falha ao carregar dados públicos: ${label}`, err);
    return fallback;
  }
}

export const getSettings = cache(() =>
  safe("settings", unstable_cache(readSettings, ["settings"], { tags: [TAGS.settings], revalidate: REVALIDATE }), defaultSettings),
);

export const getCategories = cache(() =>
  safe("categories", unstable_cache(() => listCategories(), ["categories"], { tags: [TAGS.catalog], revalidate: REVALIDATE }), []),
);

export const getCategory = cache((slug: string) =>
  safe(
    "category",
    unstable_cache(() => getCategoryBySlug(slug), ["category", slug], { tags: [TAGS.catalog], revalidate: REVALIDATE }),
    null,
  ),
);

export const getProducts = cache((q: ProductQuery) =>
  safe(
    "products",
    unstable_cache(() => listProducts(q), ["products", JSON.stringify(q)], { tags: [TAGS.catalog], revalidate: REVALIDATE }),
    { items: [], total: 0 },
  ),
);

export const getProduct = cache((slug: string) =>
  safe(
    "product",
    unstable_cache(() => getProductBySlug(slug), ["product", slug], { tags: [TAGS.catalog], revalidate: REVALIDATE }),
    null,
  ),
);

export const getRelated = cache((slug: string) =>
  safe(
    "related",
    unstable_cache(
      async () => {
        const p = await getProductBySlug(slug);
        return p ? listRelatedProducts(p) : [];
      },
      ["related", slug],
      { tags: [TAGS.catalog], revalidate: REVALIDATE },
    ),
    [],
  ),
);

export const getProductSlugs = () =>
  safe("slugs", unstable_cache(listAllProductSlugs, ["product-slugs"], { tags: [TAGS.catalog], revalidate: REVALIDATE }), []);

export const getTestimonials = cache(() =>
  safe(
    "testimonials",
    unstable_cache(() => listTestimonials(), ["testimonials"], { tags: [TAGS.testimonials], revalidate: REVALIDATE }),
    [],
  ),
);
