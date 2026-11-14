import "server-only";
import { run, select, selectOne } from "../db";
import { slugify } from "../slug";
import type { Category } from "../types";
import type { CategoryInput } from "../validation";

interface Row {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  image_url: string | null;
  sort_order: number;
  active: number;
  product_count?: number;
}

const map = (r: Row): Category => ({
  id: r.id,
  name: r.name,
  slug: r.slug,
  description: r.description,
  icon: r.icon,
  imageUrl: r.image_url,
  sortOrder: r.sort_order,
  active: Boolean(r.active),
  productCount: r.product_count === undefined ? undefined : Number(r.product_count),
});

const BASE = `
  SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.active = 1) AS product_count
  FROM categories c`;

export async function listCategories(opts: { includeInactive?: boolean } = {}): Promise<Category[]> {
  const where = opts.includeInactive ? "" : "WHERE c.active = 1";
  const rows = await select<Row>(`${BASE} ${where} ORDER BY c.sort_order ASC, c.name ASC`);
  return rows.map(map);
}

export async function getCategoryById(id: number): Promise<Category | null> {
  const row = await selectOne<Row>(`${BASE} WHERE c.id = ?`, [id]);
  return row ? map(row) : null;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const row = await selectOne<Row>(`${BASE} WHERE c.slug = ? AND c.active = 1`, [slug]);
  return row ? map(row) : null;
}

async function uniqueSlug(base: string, ignoreId?: number) {
  const root = slugify(base) || "categoria";
  let candidate = root;
  for (let i = 2; i < 500; i++) {
    const hit = await selectOne<{ id: number }>("SELECT id FROM categories WHERE slug = ? AND id <> ?", [candidate, ignoreId ?? 0]);
    if (!hit) return candidate;
    candidate = `${root}-${i}`;
  }
  throw new Error("Não foi possível gerar um endereço único para a categoria");
}

export async function createCategory(input: CategoryInput): Promise<number> {
  const slug = await uniqueSlug(input.slug || input.name);
  const res = await run(
    `INSERT INTO categories (name, slug, description, icon, image_url, sort_order, active) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [input.name, slug, input.description, input.icon, input.imageUrl, input.sortOrder, input.active],
  );
  return res.insertId;
}

export async function updateCategory(id: number, input: CategoryInput): Promise<boolean> {
  const slug = await uniqueSlug(input.slug || input.name, id);
  const res = await run(
    `UPDATE categories SET name = ?, slug = ?, description = ?, icon = ?, image_url = ?, sort_order = ?, active = ? WHERE id = ?`,
    [input.name, slug, input.description, input.icon, input.imageUrl, input.sortOrder, input.active, id],
  );
  return res.affectedRows > 0;
}

/** Os produtos da categoria excluída permanecem cadastrados, apenas sem categoria (FK ON DELETE SET NULL). */
export async function deleteCategory(id: number): Promise<boolean> {
  const res = await run("DELETE FROM categories WHERE id = ?", [id]);
  return res.affectedRows > 0;
}
