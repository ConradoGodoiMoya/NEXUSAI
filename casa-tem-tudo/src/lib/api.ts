import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError, type ZodTypeAny, type z } from "zod";
import { getCurrentUser, type CurrentUser } from "./auth";
import { logger } from "./logger";
import type { Role } from "./types";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

export function json<T>(data: T, init?: number | ResponseInit) {
  const options = typeof init === "number" ? { status: init } : init;
  return NextResponse.json(data, { ...options, headers: { "Cache-Control": "no-store", ...options?.headers } });
}

/** Proteção CSRF complementar ao cookie SameSite=Strict: exige Origin igual ao host em requisições que alteram dados. */
export function assertSameOrigin(req: NextRequest) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return;
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!origin || !host) throw new HttpError(403, "Origem da requisição não permitida.");
  try {
    if (new URL(origin).host !== host) throw new Error();
  } catch {
    throw new HttpError(403, "Origem da requisição não permitida.");
  }
}

export async function requireApiUser(req: NextRequest, role?: Role): Promise<CurrentUser> {
  assertSameOrigin(req);
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "Sessão expirada. Faça login novamente.");
  if (role === "admin" && user.role !== "admin") throw new HttpError(403, "Você não tem permissão para esta ação.");
  return user;
}

export async function parseBody<S extends ZodTypeAny>(req: NextRequest, schema: S): Promise<z.output<S>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new HttpError(400, "Corpo da requisição inválido.");
  }
  return schema.parse(body);
}

export function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, "Identificador inválido.");
  return id;
}

function zodFields(err: ZodError) {
  const fields: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".");
    if (!fields[key]) fields[key] = issue.message;
  }
  return fields;
}

/** Envolve um handler com tratamento padronizado de erros (sem vazar detalhes internos). */
export function handler<C>(fn: (req: NextRequest, ctx: C) => Promise<Response>) {
  return async (req: NextRequest, ctx: C) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof HttpError) return json({ error: err.message, fields: err.fields }, err.status);
      if (err instanceof ZodError) {
        return json({ error: "Verifique os campos destacados.", fields: zodFields(err) }, 422);
      }
      const code = (err as { code?: string })?.code;
      if (code === "ER_DUP_ENTRY") return json({ error: "Já existe um registro com esses dados." }, 409);
      logger.error("Erro inesperado na API", err, { method: req.method, path: req.nextUrl.pathname });
      return json({ error: "Erro interno. Tente novamente em instantes." }, 500);
    }
  };
}

export function clientIp(req: NextRequest) {
  return (req.headers.get("x-forwarded-for")?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "local").trim().slice(0, 64);
}
