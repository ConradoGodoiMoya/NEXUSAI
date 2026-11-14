import type { NextRequest } from "next/server";
import { handler, HttpError, json, requireApiUser } from "@/lib/api";
import { logActivity } from "@/lib/data/activity";
import { MAX_UPLOAD_BYTES, saveImage } from "@/lib/uploads";

export const POST = handler(async (req: NextRequest) => {
  const user = await requireApiUser(req);
  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > MAX_UPLOAD_BYTES + 64 * 1024) throw new HttpError(413, "Imagem muito grande (máximo de 8 MB).");
  const form = await req.formData().catch(() => {
    throw new HttpError(400, "Envio inválido.");
  });
  const file = form.get("file");
  if (!(file instanceof File)) throw new HttpError(400, "Selecione uma imagem.");
  const kindRaw = String(form.get("kind") ?? "product");
  const kind = kindRaw === "banner" || kindRaw === "category" ? kindRaw : "product";
  const saved = await saveImage(file, kind);
  await logActivity(user.id, "upload", "image", null, `Enviou uma imagem (${{ product: "produto", category: "categoria", banner: "banner" }[kind]})`);
  return json(saved, 201);
});
