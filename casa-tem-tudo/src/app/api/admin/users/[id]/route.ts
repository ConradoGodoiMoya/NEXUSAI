import type { NextRequest } from "next/server";
import { handler, HttpError, json, parseBody, parseId, requireApiUser } from "@/lib/api";
import { logActivity } from "@/lib/data/activity";
import { countActiveAdmins, deleteUser, findUserById, updateUser } from "@/lib/data/users";
import { userInputSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = handler(async (req: NextRequest, { params }: Ctx) => {
  const me = await requireApiUser(req, "admin");
  const id = parseId((await params).id);
  const target = await findUserById(id);
  if (!target) throw new HttpError(404, "Usuário não encontrado.");
  const input = await parseBody(req, userInputSchema);
  const losesAdmin = target.role === "admin" && (input.role !== "admin" || !input.active);
  if (losesAdmin && (await countActiveAdmins(id)) === 0) {
    throw new HttpError(422, "É necessário manter pelo menos um administrador ativo.");
  }
  await updateUser(id, input);
  await logActivity(me.id, "update", "user", id, `Editou o usuário ${input.email}`);
  return json({ ok: true });
});

export const DELETE = handler(async (req: NextRequest, { params }: Ctx) => {
  const me = await requireApiUser(req, "admin");
  const id = parseId((await params).id);
  if (id === me.id) throw new HttpError(422, "Você não pode excluir o próprio usuário.");
  const target = await findUserById(id);
  if (!target) throw new HttpError(404, "Usuário não encontrado.");
  if (target.role === "admin" && target.active && (await countActiveAdmins(id)) === 0) {
    throw new HttpError(422, "É necessário manter pelo menos um administrador ativo.");
  }
  await deleteUser(id);
  await logActivity(me.id, "delete", "user", id, `Excluiu o usuário ${target.email}`);
  return json({ ok: true });
});
