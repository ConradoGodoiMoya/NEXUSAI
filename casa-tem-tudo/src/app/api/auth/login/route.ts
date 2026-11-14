import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";
import { assertSameOrigin, clientIp, handler, HttpError, json, parseBody } from "@/lib/api";
import { startSession } from "@/lib/auth";
import { run, selectOne } from "@/lib/db";
import { findUserByEmail, touchLogin } from "@/lib/data/users";
import { logger } from "@/lib/logger";
import { loginSchema } from "@/lib/validation";

const WINDOW_MINUTES = 15;
const MAX_FAILS_PER_IP = 20;
const MAX_FAILS_PER_EMAIL = 6;
// Hash fictício para manter tempo de resposta constante quando o e-mail não existe.
let dummyHash: string | null = null;
const getDummyHash = async () => (dummyHash ??= await bcrypt.hash("casa-tem-tudo-dummy", 12));

export const POST = handler(async (req: NextRequest) => {
  assertSameOrigin(req);
  const ip = clientIp(req);
  const { email, password } = await parseBody(req, loginSchema).catch(() => {
    throw new HttpError(400, "Informe e-mail e senha válidos.");
  });

  const fails = await selectOne<{ by_ip: number; by_email: number }>(
    `SELECT COALESCE(SUM(ip = ?), 0) AS by_ip, COALESCE(SUM(email = ?), 0) AS by_email FROM login_attempts
     WHERE success = 0 AND created_at > UTC_TIMESTAMP() - INTERVAL ? MINUTE AND (ip = ? OR email = ?)`,
    [ip, email, WINDOW_MINUTES, ip, email],
  );
  if (Number(fails?.by_ip) >= MAX_FAILS_PER_IP || Number(fails?.by_email) >= MAX_FAILS_PER_EMAIL) {
    logger.warn("Login bloqueado por excesso de tentativas", { ip, email });
    throw new HttpError(429, `Muitas tentativas. Aguarde ${WINDOW_MINUTES} minutos e tente novamente.`);
  }

  const user = await findUserByEmail(email);
  const ok = await bcrypt.compare(password, user?.password_hash ?? (await getDummyHash()));
  const success = Boolean(user && ok && user.active);
  await run("INSERT INTO login_attempts (ip, email, success, created_at) VALUES (?, ?, ?, UTC_TIMESTAMP())", [ip, email, success]);

  if (!success || !user) {
    logger.warn("Falha de login", { ip, email });
    throw new HttpError(401, "E-mail ou senha incorretos.");
  }

  await touchLogin(user.id);
  await startSession(user);
  // Limpeza oportunista de registros antigos.
  await run("DELETE FROM login_attempts WHERE created_at < UTC_TIMESTAMP() - INTERVAL 30 DAY");
  return json({ ok: true, user: { name: user.name, role: user.role } });
});
