import "server-only";
import { run, selectOne } from "../db";
import { mergeSettings, type SiteSettings } from "../settings-schema";

const KEY = "site";

export async function readSettings(): Promise<SiteSettings> {
  const row = await selectOne<{ value: string }>("SELECT value FROM settings WHERE setting_key = ?", [KEY]);
  if (!row) return mergeSettings({});
  try {
    return mergeSettings(JSON.parse(row.value));
  } catch {
    return mergeSettings({});
  }
}

export async function writeSettings(value: SiteSettings): Promise<void> {
  await run(
    "INSERT INTO settings (setting_key, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)",
    [KEY, JSON.stringify(value)],
  );
}
