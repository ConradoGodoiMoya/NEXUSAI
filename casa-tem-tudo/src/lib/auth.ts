import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { findUserById } from "./data/users";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession, verifySession } from "./session";
import type { Role } from "./types";

export interface CurrentUser {
  id: number;
  name: string;
  email: string;
  role: Role;
}

/**
 * Valida o cookie E confere no banco se o usuário continua ativo e se a sessão não foi revogada
 * (troca de senha, mudança de papel ou desativação incrementam `session_version`).
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const store = await cookies();
  const session = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const user = await findUserById(Number(session.sub));
  if (!user || !user.active || user.session_version !== session.sv) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

/** Para páginas do painel: redireciona ao login quando não autenticado. */
export async function requirePageUser(role?: Role): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (role === "admin" && user.role !== "admin") redirect("/admin?erro=permissao");
  return user;
}

export async function startSession(user: { id: number; role: Role; session_version: number; name: string }) {
  const token = await signSession({ sub: String(user.id), role: user.role, sv: user.session_version, name: user.name });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function endSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
