import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";
import sharp from "sharp";
import { env } from "./env";
import { HttpError } from "./api";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp", "avif", "heif", "gif", "tiff"]);
export const MEDIA_NAME = /^[a-f0-9]{24}\.webp$/;

export function uploadRoot() {
  return path.resolve(process.cwd(), env.uploadDir);
}

/**
 * Recebe a imagem, valida o conteúdo real (não confia no tipo informado pelo navegador),
 * redimensiona, remove metadados (EXIF/GPS) e converte para WebP.
 */
export async function saveImage(file: File, kind: "product" | "category" | "banner"): Promise<{ url: string; width: number; height: number }> {
  if (file.size === 0) throw new HttpError(400, "Arquivo vazio.");
  if (file.size > MAX_UPLOAD_BYTES) throw new HttpError(413, "Imagem muito grande (máximo de 8 MB).");

  const input = Buffer.from(await file.arrayBuffer());
  let meta: sharp.Metadata;
  try {
    meta = await sharp(input).metadata();
  } catch {
    throw new HttpError(415, "Arquivo não reconhecido como imagem.");
  }
  if (!meta.format || !ALLOWED_FORMATS.has(meta.format)) {
    throw new HttpError(415, "Formato não suportado. Envie JPG, PNG, WebP ou AVIF.");
  }
  if ((meta.width ?? 0) * (meta.height ?? 0) > 60_000_000) throw new HttpError(413, "Resolução da imagem muito alta.");

  const maxWidth = kind === "banner" ? 2400 : 1600;
  const { data, info } = await sharp(input, { failOn: "error" })
    .rotate()
    .resize({ width: maxWidth, height: maxWidth, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toBuffer({ resolveWithObject: true });

  const name = `${randomBytes(12).toString("hex")}.webp`;
  const dir = uploadRoot();
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), data);
  return { url: `/media/${name}`, width: info.width, height: info.height };
}
