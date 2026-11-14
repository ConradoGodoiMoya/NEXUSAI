import type { NextRequest } from "next/server";
import { handler, json, parseBody, requireApiUser } from "@/lib/api";
import { logActivity } from "@/lib/data/activity";
import { createProduct, getProductById, listProducts } from "@/lib/data/products";
import { revalidateCatalog } from "@/lib/revalidate";
import type { ProductSort } from "@/lib/types";
import { productInputSchema } from "@/lib/validation";

export const GET = handler(async (req: NextRequest) => {
  await requireApiUser(req);
  const sp = req.nextUrl.searchParams;
  const result = await listProducts({
    includeInactive: true,
    search: sp.get("q") ?? undefined,
    categoryId: sp.get("categoria") ? Number(sp.get("categoria")) : undefined,
    sort: (sp.get("ordem") as ProductSort) ?? "recentes",
    limit: Number(sp.get("limite") ?? 50),
    offset: Number(sp.get("inicio") ?? 0),
  });
  return json(result);
});

export const POST = handler(async (req: NextRequest) => {
  const user = await requireApiUser(req);
  const input = await parseBody(req, productInputSchema);
  const id = await createProduct(input);
  await logActivity(user.id, "create", "product", id, `Cadastrou o produto “${input.name}”`);
  revalidateCatalog();
  return json({ product: await getProductById(id) }, 201);
});
