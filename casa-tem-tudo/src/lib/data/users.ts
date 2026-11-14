import "server-only";
import bcrypt from "bcryptjs";
import { run, select, selectOne } from "../db";
import type { AdminUser, Role } from "../types";
import type { UserInput } from "../validation";

export interface UserRecord {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: Role;
  active: number;
  session_version: number;
  last_login_at: Date | null;
  created_at: Date;
}

const toAdminUser = (r: UserRecord): AdminUser => ({
  id: r.id,
  name: r.name,
  email: r.email,
  role: r.role,
  active: Boolean(r.active),
  lastLoginAt: r.last_login_at ? new Date(r.last_login_at).toISOString() : null,
  createdAt: new Date(r.created_at).toISOString(),
});

export const BCRYPT_ROUNDS = 12;

export async function findUserByEmail(email: string) {
  return selectOne<UserRecord>("SELECT * FROM users WHERE email = ?", [email.toLowerCase()]);
}

export async function findUserById(id: number) {
  return selectOne<UserRecord>("SELECT * FROM users WHERE id = ?", [id]);
}

export async function listUsers(): Promise<AdminUser[]> {
  const rows = await select<UserRecord>("SELECT * FROM users ORDER BY name ASC");
  return rows.map(toAdminUser);
}

export async function countActiveAdmins(excludeId?: number) {
  const row = await selectOne<{ n: number }>(
    "SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND active = 1 AND id <> ?",
    [excludeId ?? 0],
  );
  return Number(row?.n ?? 0);
}

export async function createUser(input: UserInput & { password: string }) {
  const hash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const res = await run("INSERT INTO users (name, email, password_hash, role, active) VALUES (?, ?, ?, ?, ?)", [
    input.name,
    input.email,
    hash,
    input.role,
    input.active,
  ]);
  return res.insertId;
}

export async function updateUser(id: number, input: UserInput) {
  if (input.password) {
    const hash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const res = await run(
      `UPDATE users SET name = ?, email = ?, role = ?, active = ?, password_hash = ?, session_version = session_version + 1 WHERE id = ?`,
      [input.name, input.email, input.role, input.active, hash, id],
    );
    return res.affectedRows > 0;
  }
  // Mudança de papel ou desativação também invalida sessões abertas.
  const res = await run(
    `UPDATE users SET session_version = session_version + IF(role <> ? OR active <> ?, 1, 0),
       name = ?, email = ?, role = ?, active = ? WHERE id = ?`,
    [input.role, input.active, input.name, input.email, input.role, input.active, id],
  );
  return res.affectedRows > 0;
}

export async function changePassword(id: number, newPassword: string) {
  const hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await run("UPDATE users SET password_hash = ?, session_version = session_version + 1 WHERE id = ?", [hash, id]);
}

export async function deleteUser(id: number) {
  const res = await run("DELETE FROM users WHERE id = ?", [id]);
  return res.affectedRows > 0;
}

export async function touchLogin(id: number) {
  await run("UPDATE users SET last_login_at = UTC_TIMESTAMP() WHERE id = ?", [id]);
}
