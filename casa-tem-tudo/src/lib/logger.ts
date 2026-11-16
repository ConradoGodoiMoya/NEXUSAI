import "server-only";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

type Level = "info" | "warn" | "error";

const LOG_DIR = process.env.LOG_DIR || "./logs";

function serializeError(err: unknown) {
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack?.split("\n").slice(0, 8).join("\n") };
  }
  return { message: String(err) };
}

async function writeFile(line: string) {
  try {
    await mkdir(LOG_DIR, { recursive: true });
    const file = path.join(LOG_DIR, `app-${new Date().toISOString().slice(0, 10)}.log`);
    await appendFile(file, line + "\n", "utf8");
  } catch {
    /* Ambientes sem disco gravável: mantém apenas o stdout. */
  }
}

function log(level: Level, message: string, meta?: Record<string, unknown>) {
  const entry = { ts: new Date().toISOString(), level, message, ...meta };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
  if (level !== "info") void writeFile(line);
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => log("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log("warn", message, meta),
  error: (message: string, err?: unknown, meta?: Record<string, unknown>) =>
    log("error", message, { ...meta, error: err === undefined ? undefined : serializeError(err) }),
};
