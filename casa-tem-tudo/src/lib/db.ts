import "server-only";
import mysql, { type Pool, type ResultSetHeader, type RowDataPacket } from "mysql2/promise";
import { env } from "./env";

declare global {
  // eslint-disable-next-line no-var
  var __cttPool: Pool | undefined;
}

/**
 * Pool de conexões único por processo. Todas as consultas usam `execute`/`query`
 * com placeholders (`?`), o que garante proteção contra SQL Injection.
 */
export function getPool(): Pool {
  if (!globalThis.__cttPool) {
    const cfg = env.db;
    globalThis.__cttPool = mysql.createPool({
      ...cfg,
      waitForConnections: true,
      connectionLimit: 10,
      charset: "utf8mb4",
      decimalNumbers: true,
      dateStrings: false,
      timezone: "Z",
    });
  }
  return globalThis.__cttPool;
}

export type Param = string | number | boolean | Date | null;

export async function select<T>(sql: string, params: Param[] = []): Promise<T[]> {
  const [rows] = await getPool().query<RowDataPacket[]>(sql, params);
  return rows as T[];
}

export async function selectOne<T>(sql: string, params: Param[] = []): Promise<T | null> {
  const rows = await select<T>(sql, params);
  return rows[0] ?? null;
}

export async function run(sql: string, params: Param[] = []): Promise<ResultSetHeader> {
  const [result] = await getPool().query<ResultSetHeader>(sql, params);
  return result;
}

/** Escapa curingas do LIKE para buscas com texto do usuário. */
export function likeEscape(term: string) {
  return term.replace(/[\\%_]/g, (c) => `\\${c}`);
}
