import type { NextRequest } from "next/server";
import { handler, HttpError, json, parseBody, parseId, requireApiUser } from "@/lib/api";
import { logActivity } from "@/lib/data/activity";
import { deleteCategory, getCategoryById, updateCategory } from "@/lib/data/categories";
import { revalidateCatalog } from "@/lib/revalidate";
import { categoryInputSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

async function load(raw: string) {
  const category = await getCategoryById(parseId(raw));
  if (!category) throw new HttpError(404, "Categoria não encontrada.");
  return category;
}

export const PUT = handler(async (req: NextRequest, { params }: Ctx) => {
  const user = await requireApiUser(req);
  const current = await load((await params).id);
  const input = await parseBody(req, categoryInputSchema);
  await updateCategory(current.id, input);
  await logActivity(user.id, "update", "category", current.id, `Editou a categoria “${input.name}”`);
  revalidateCatalog();
  return json({ category: await getCategoryById(current.id) });
});

export const DELETE = handler(async (req: NextRequest, { params }: Ctx) => {
  const user = await requireApiUser(req);
  const current = await load((await params).id);
  await deleteCategory(current.id);
  await logActivity(user.id, "delete", "category", current.id, `Excluiu a categoria “${current.name}”`);
  revalidateCatalog();
  return json({ ok: true });
});
