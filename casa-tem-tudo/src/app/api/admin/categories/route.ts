import type { NextRequest } from "next/server";
import { handler, json, parseBody, requireApiUser } from "@/lib/api";
import { logActivity } from "@/lib/data/activity";
import { createCategory, getCategoryById, listCategories } from "@/lib/data/categories";
import { revalidateCatalog } from "@/lib/revalidate";
import { categoryInputSchema } from "@/lib/validation";

export const GET = handler(async (req: NextRequest) => {
  await requireApiUser(req);
  return json({ items: await listCategories({ includeInactive: true }) });
});

export const POST = handler(async (req: NextRequest) => {
  const user = await requireApiUser(req);
  const input = await parseBody(req, categoryInputSchema);
  const id = await createCategory(input);
  await logActivity(user.id, "create", "category", id, `Criou a categoria “${input.name}”`);
  revalidateCatalog();
  return json({ category: await getCategoryById(id) }, 201);
});
