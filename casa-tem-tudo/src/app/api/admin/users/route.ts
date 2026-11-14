import type { NextRequest } from "next/server";
import { handler, HttpError, json, parseBody, requireApiUser } from "@/lib/api";
import { logActivity } from "@/lib/data/activity";
import { createUser, listUsers } from "@/lib/data/users";
import { userInputSchema } from "@/lib/validation";

export const GET = handler(async (req: NextRequest) => {
  await requireApiUser(req, "admin");
  return json({ items: await listUsers() });
});

export const POST = handler(async (req: NextRequest) => {
  const user = await requireApiUser(req, "admin");
  const input = await parseBody(req, userInputSchema);
  if (!input.password) throw new HttpError(422, "Defina uma senha inicial.", { password: "Obrigatória para novos usuários" });
  const id = await createUser({ ...input, password: input.password });
  await logActivity(user.id, "create", "user", id, `Criou o usuário ${input.email}`);
  return json({ id }, 201);
});
