import { readFile } from "node:fs/promises";
import path from "node:path";
import type { NextRequest } from "next/server";
import { MEDIA_NAME, uploadRoot } from "@/lib/uploads";

type Ctx = { params: Promise<{ name: string }> };

/** Serve imagens enviadas pelo painel. O nome é validado por regex (impede path traversal). */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { name } = await params;
  if (!MEDIA_NAME.test(name)) return new Response("Não encontrado", { status: 404 });
  try {
    const data = await readFile(path.join(uploadRoot(), name));
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Não encontrado", { status: 404 });
  }
}
