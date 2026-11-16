import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";
import { handler, HttpError, json, parseBody, requireApiUser } from "@/lib/api";
import { startSession } from "@/lib/auth";
import { logActivity } from "@/lib/data/activity";
import { changePassword, findUserById } from "@/lib/data/users";
import { changePasswordSchema } from "@/lib/validation";

export const PUT = handler(async (req: NextRequest) => {
  const me = await requireApiUser(req);
  const { currentPassword, newPassword } = await parseBody(req, changePasswordSchema);
  const record = await findUserById(me.id);
  if (!record || !(await bcrypt.compare(currentPassword, record.password_hash))) {
    throw new HttpError(422, "Senha atual incorreta.", { currentPassword: "Senha atual incorreta" });
  }
  await changePassword(me.id, newPassword);
  const updated = await findUserById(me.id);
  if (updated) await startSession(updated); // mantém esta sessão; as demais são revogadas
  await logActivity(me.id, "update", "user", me.id, "Alterou a própria senha");
  return json({ ok: true });
});
