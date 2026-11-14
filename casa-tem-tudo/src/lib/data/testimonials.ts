import "server-only";
import { run, select, selectOne } from "../db";
import type { Testimonial } from "../types";
import type { TestimonialInput } from "../validation";

interface Row {
  id: number;
  author_name: string;
  rating: number;
  content: string;
  review_date: Date | string | null;
  source: string;
  active: number;
  sort_order: number;
}

function toDateString(v: Date | string | null): string | null {
  if (!v) return null;
  if (typeof v === "string") return v.slice(0, 10);
  return v.toISOString().slice(0, 10);
}

const map = (r: Row): Testimonial => ({
  id: r.id,
  authorName: r.author_name,
  rating: r.rating,
  content: r.content,
  reviewDate: toDateString(r.review_date),
  source: r.source,
  active: Boolean(r.active),
  sortOrder: r.sort_order,
});

export async function listTestimonials(opts: { includeInactive?: boolean } = {}) {
  const rows = await select<Row>(
    `SELECT * FROM testimonials ${opts.includeInactive ? "" : "WHERE active = 1"} ORDER BY sort_order ASC, id DESC`,
  );
  return rows.map(map);
}

export async function getTestimonial(id: number) {
  const row = await selectOne<Row>("SELECT * FROM testimonials WHERE id = ?", [id]);
  return row ? map(row) : null;
}

export async function createTestimonial(i: TestimonialInput) {
  const res = await run(
    "INSERT INTO testimonials (author_name, rating, content, review_date, source, active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [i.authorName, i.rating, i.content, i.reviewDate, i.source, i.active, i.sortOrder],
  );
  return res.insertId;
}

export async function updateTestimonial(id: number, i: TestimonialInput) {
  const res = await run(
    "UPDATE testimonials SET author_name = ?, rating = ?, content = ?, review_date = ?, source = ?, active = ?, sort_order = ? WHERE id = ?",
    [i.authorName, i.rating, i.content, i.reviewDate, i.source, i.active, i.sortOrder, id],
  );
  return res.affectedRows > 0;
}

export async function deleteTestimonial(id: number) {
  const res = await run("DELETE FROM testimonials WHERE id = ?", [id]);
  return res.affectedRows > 0;
}
