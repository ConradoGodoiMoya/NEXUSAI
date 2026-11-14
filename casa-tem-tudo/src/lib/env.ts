import "server-only";

function read(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === "") {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
}

export const env = {
  get db() {
    return {
      host: read("DATABASE_HOST", "127.0.0.1"),
      port: Number(process.env.DATABASE_PORT || 3306),
      user: read("DATABASE_USER"),
      password: process.env.DATABASE_PASSWORD ?? "",
      database: read("DATABASE_NAME"),
    };
  },
  get uploadDir() {
    return process.env.UPLOAD_DIR || "./uploads";
  },
  get isProduction() {
    return process.env.NODE_ENV === "production";
  },
};
