import "server-only";
import { run, select } from "../db";
import { logger } from "../logger";

export async function logActivity(userId: number, action: string, entity: string, entityId: number | string | null, summary: string) {
  try {
    await run("INSERT INTO activity_log (user_id, action, entity, entity_id, summary) VALUES (?, ?, ?, ?, ?)", [
      userId,
      action,
      entity,
      entityId === null ? null : String(entityId),
      summary.slice(0, 255),
    ]);
  } catch (err) {
    logger.error("Falha ao registrar atividade", err);
  }
}

export async function recentActivity(limit = 8) {
  const rows = await select<{ id: number; action: string; entity: string; summary: string; created_at: Date; user_name: string | null }>(
    `SELECT a.id, a.action, a.entity, a.summary, a.created_at, u.name AS user_name
     FROM activity_log a LEFT JOIN users u ON u.id = a.user_id ORDER BY a.created_at DESC, a.id DESC LIMIT ?`,
    [limit],
  );
  return rows.map((r) => ({ ...r, created_at: new Date(r.created_at).toISOString() }));
}
