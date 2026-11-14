import type { NextRequest } from "next/server";
import { z } from "zod";
import { handler, HttpError, json, parseBody, parseId, requireApiUser } from "@/lib/api";
import { logActivity } from "@/lib/data/activity";
import { deleteProduct, getProductById, setProductFlags, updateProduct } from "@/lib/data/products";
import { revalidateCatalog } from "@/lib/revalidate";
import { productInputSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

async function load(raw: string) {
  const id = parseId(raw);
  const product = await getProductById(id);
  if (!product) throw new HttpError(404, "Produto não encontrado.");
  return product;
}

export const GET = handler(async (req: NextRequest, { params }: Ctx) => {
  await requireApiUser(req);
  return json({ product: await load((await params).id) });
});

export const PUT = handler(async (req: NextRequest, { params }: Ctx) => {
  const user = await requireApiUser(req);
  const current = await load((await params).id);
  const input = await parseBody(req, productInputSchema);
  await updateProduct(current.id, input);
  await logActivity(user.id, "update", "product", current.id, `Editou o produto “${input.name}”`);
  revalidateCatalog();
  return json({ product: await getProductById(current.id) });
});

const flagsSchema = z.object({ featured: z.boolean().optional(), active: z.boolean().optional() }).strict();

export const PATCH = handler(async (req: NextRequest, { params }: Ctx) => {
  const user = await requireApiUser(req);
  const current = await load((await params).id);
  const flags = await parseBody(req, flagsSchema);
  await setProductFlags(current.id, flags);
  const what = flags.featured !== undefined ? (flags.featured ? "Destacou" : "Removeu destaque de") : flags.active ? "Publicou" : "Ocultou";
  await logActivity(user.id, "update", "product", current.id, `${what} “${current.name}”`);
  revalidateCatalog();
  return json({ product: await getProductById(current.id) });
});

export const DELETE = handler(async (req: NextRequest, { params }: Ctx) => {
  const user = await requireApiUser(req);
  const current = await load((await params).id);
  await deleteProduct(current.id);
  await logActivity(user.id, "delete", "product", current.id, `Excluiu o produto “${current.name}”`);
  revalidateCatalog();
  return json({ ok: true });
});
