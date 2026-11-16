import "server-only";
import { likeEscape, run, select, selectOne, type Param } from "../db";
import { slugify } from "../slug";
import type { Product, ProductSort } from "../types";
import type { ProductInput } from "../validation";

interface Row {
  id: number;
  category_id: number | null;
  category_name: string | null;
  category_slug: string | null;
  name: string;
  slug: string;
  short_description: string;
  description: string | null;
  details: string | null;
  brand: string | null;
  unit: string | null;
  price: number | string | null;
  image_url: string | null;
  featured: number;
  active: number;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

const map = (r: Row): Product => ({
  id: r.id,
  categoryId: r.category_id,
  categoryName: r.category_name,
  categorySlug: r.category_slug,
  name: r.name,
  slug: r.slug,
  shortDescription: r.short_description,
  description: r.description,
  details: r.details,
  brand: r.brand,
  unit: r.unit,
  price: r.price === null ? null : Number(r.price),
  imageUrl: r.image_url,
  featured: Boolean(r.featured),
  active: Boolean(r.active),
  sortOrder: r.sort_order,
  createdAt: new Date(r.created_at).toISOString(),
  updatedAt: new Date(r.updated_at).toISOString(),
});

const BASE = `
  SELECT p.*, c.name AS category_name, c.slug AS category_slug
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id`;

export interface ProductQuery {
  search?: string;
  categorySlug?: string;
  categoryId?: number;
  sort?: ProductSort;
  featuredOnly?: boolean;
  includeInactive?: boolean;
  limit?: number;
  offset?: number;
}

function buildWhere(q: ProductQuery) {
  const clauses: string[] = [];
  const params: Param[] = [];
  if (!q.includeInactive) clauses.push("p.active = 1 AND (c.id IS NULL OR c.active = 1)");
  if (q.featuredOnly) clauses.push("p.featured = 1");
  if (q.categorySlug) {
    clauses.push("c.slug = ?");
    params.push(q.categorySlug);
  }
  if (q.categoryId) {
    clauses.push("p.category_id = ?");
    params.push(q.categoryId);
  }
  const term = q.search?.trim().slice(0, 80);
  if (term) {
    // Cada palavra precisa aparecer em algum campo (busca "E" entre palavras).
    for (const word of term.split(/\s+/).slice(0, 6)) {
      const like = `%${likeEscape(word)}%`;
      clauses.push(
        "(p.name LIKE ? OR p.short_description LIKE ? OR p.brand LIKE ? OR p.description LIKE ? OR c.name LIKE ?)",
      );
      params.push(like, like, like, like, like);
    }
  }
  return { where: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "", params };
}

function orderBy(sort: ProductSort | undefined, search: string | undefined): { sql: string; params: Param[] } {
  switch (sort) {
    case "nome":
      return { sql: "ORDER BY p.name ASC", params: [] };
    case "recentes":
      return { sql: "ORDER BY p.created_at DESC, p.id DESC", params: [] };
    case "menor-preco":
      return { sql: "ORDER BY p.price IS NULL, p.price ASC, p.name ASC", params: [] };
    case "maior-preco":
      return { sql: "ORDER BY p.price IS NULL, p.price DESC, p.name ASC", params: [] };
    default: {
      const term = search?.trim().slice(0, 80);
      if (term) {
        // Relevância: nome igual > nome começa com termo > nome contém > demais campos.
        const esc = likeEscape(term);
        return {
          sql: `ORDER BY (CASE WHEN p.name = ? THEN 0 WHEN p.name LIKE ? THEN 1 WHEN p.name LIKE ? THEN 2 ELSE 3 END),
                p.featured DESC, p.sort_order ASC, p.name ASC`,
          params: [term, `${esc}%`, `%${esc}%`],
        };
      }
      return { sql: "ORDER BY p.featured DESC, p.sort_order ASC, p.name ASC", params: [] };
    }
  }
}

export async function listProducts(q: ProductQuery = {}): Promise<{ items: Product[]; total: number }> {
  const { where, params } = buildWhere(q);
  const order = orderBy(q.sort, q.search);
  const limit = Math.min(Math.max(q.limit ?? 24, 1), 200);
  const offset = Math.max(q.offset ?? 0, 0);
  const [rows, countRow] = await Promise.all([
    select<Row>(`${BASE} ${where} ${order.sql} LIMIT ? OFFSET ?`, [...params, ...order.params, limit, offset]),
    selectOne<{ total: number }>(
      `SELECT COUNT(*) AS total FROM products p LEFT JOIN categories c ON c.id = p.category_id ${where}`,
      params,
    ),
  ]);
  return { items: rows.map(map), total: Number(countRow?.total ?? 0) };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const row = await selectOne<Row>(`${BASE} WHERE p.slug = ? AND p.active = 1 AND (c.id IS NULL OR c.active = 1)`, [slug]);
  return row ? map(row) : null;
}

export async function getProductById(id: number): Promise<Product | null> {
  const row = await selectOne<Row>(`${BASE} WHERE p.id = ?`, [id]);
  return row ? map(row) : null;
}

export async function listRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  if (!product.categoryId) return [];
  const rows = await select<Row>(
    `${BASE} WHERE p.active = 1 AND p.category_id = ? AND p.id <> ? ORDER BY p.featured DESC, p.sort_order ASC, p.name ASC LIMIT ?`,
    [product.categoryId, product.id, limit],
  );
  return rows.map(map);
}

export async function listAllProductSlugs(): Promise<{ slug: string; updatedAt: string }[]> {
  const rows = await select<{ slug: string; updated_at: Date }>(
    `SELECT p.slug, p.updated_at FROM products p LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.active = 1 AND (c.id IS NULL OR c.active = 1)`,
  );
  return rows.map((r) => ({ slug: r.slug, updatedAt: new Date(r.updated_at).toISOString() }));
}

export async function productStats() {
  const row = await selectOne<{ total: number; active: number; featured: number; with_price: number; with_image: number; uncategorized: number }>(
    `SELECT COUNT(*) AS total,
            COALESCE(SUM(active = 1), 0) AS active,
            COALESCE(SUM(featured = 1), 0) AS featured,
            COALESCE(SUM(price IS NOT NULL), 0) AS with_price,
            COALESCE(SUM(image_url IS NOT NULL), 0) AS with_image,
            COALESCE(SUM(category_id IS NULL), 0) AS uncategorized
     FROM products`,
  );
  return {
    total: Number(row?.total ?? 0),
    active: Number(row?.active ?? 0),
    featured: Number(row?.featured ?? 0),
    withPrice: Number(row?.with_price ?? 0),
    withImage: Number(row?.with_image ?? 0),
    uncategorized: Number(row?.uncategorized ?? 0),
  };
}

async function uniqueSlug(base: string, ignoreId?: number) {
  const root = slugify(base) || "produto";
  let candidate = root;
  for (let i = 2; i < 1000; i++) {
    const hit = await selectOne<{ id: number }>("SELECT id FROM products WHERE slug = ? AND id <> ?", [candidate, ignoreId ?? 0]);
    if (!hit) return candidate;
    candidate = `${root}-${i}`;
  }
  throw new Error("Não foi possível gerar um endereço único para o produto");
}

function values(input: ProductInput): Param[] {
  return [
    input.categoryId ?? null,
    input.name,
    input.shortDescription,
    input.description,
    input.details,
    input.brand,
    input.unit,
    input.price,
    input.imageUrl,
    input.featured,
    input.active,
    input.sortOrder,
  ];
}

export async function createProduct(input: ProductInput): Promise<number> {
  const slug = await uniqueSlug(input.slug || input.name);
  const res = await run(
    `INSERT INTO products (category_id, name, short_description, description, details, brand, unit, price, image_url,
       featured, active, sort_order, slug) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [...values(input), slug],
  );
  return res.insertId;
}

export async function updateProduct(id: number, input: ProductInput): Promise<boolean> {
  const slug = await uniqueSlug(input.slug || input.name, id);
  const res = await run(
    `UPDATE products SET category_id = ?, name = ?, short_description = ?, description = ?, details = ?, brand = ?,
       unit = ?, price = ?, image_url = ?, featured = ?, active = ?, sort_order = ?, slug = ? WHERE id = ?`,
    [...values(input), slug, id],
  );
  return res.affectedRows > 0;
}

export async function setProductFlags(id: number, flags: { featured?: boolean; active?: boolean }) {
  const sets: string[] = [];
  const params: Param[] = [];
  if (flags.featured !== undefined) {
    sets.push("featured = ?");
    params.push(flags.featured);
  }
  if (flags.active !== undefined) {
    sets.push("active = ?");
    params.push(flags.active);
  }
  if (!sets.length) return false;
  const res = await run(`UPDATE products SET ${sets.join(", ")} WHERE id = ?`, [...params, id]);
  return res.affectedRows > 0;
}

export async function deleteProduct(id: number): Promise<boolean> {
  const res = await run("DELETE FROM products WHERE id = ?", [id]);
  return res.affectedRows > 0;
}
