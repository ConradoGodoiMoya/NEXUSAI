/**
 * Token de sessão (JWT HS256 assinado) — compatível com o runtime Edge (middleware).
 * O cookie é httpOnly + SameSite=Strict + Secure em produção; o conteúdo não é acessível via JavaScript.
 */
import { SignJWT, jwtVerify } from "jose";
import type { Role } from "./types";

export const SESSION_COOKIE = "ctt_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 horas

export interface SessionPayload {
  sub: string;
  role: Role;
  sv: number;
  name: string;
}

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET ausente ou muito curto (mínimo de 32 caracteres). Veja .env.example.");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ role: payload.role, sv: payload.sv, name: payload.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setIssuer("casatemtudo")
    .setAudience("casatemtudo-admin")
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      algorithms: ["HS256"],
      issuer: "casatemtudo",
      audience: "casatemtudo-admin",
    });
    if (!payload.sub || (payload.role !== "admin" && payload.role !== "editor")) return null;
    return { sub: payload.sub, role: payload.role, sv: Number(payload.sv), name: String(payload.name ?? "") };
  } catch {
    return null;
  }
}
