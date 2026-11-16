// Cria (ou redefine a senha de) um usuário administrador.
// Uso: ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run admin:create
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

const name = (process.env.ADMIN_NAME || "Administrador").trim();
const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || "";

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("Defina ADMIN_EMAIL com um e-mail válido.");
  process.exit(1);
}
if (password.length < 10) {
  console.error("Defina ADMIN_PASSWORD com pelo menos 10 caracteres.");
  process.exit(1);
}

const conn = await mysql.createConnection({
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT || 3306),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD || "",
  database: process.env.DATABASE_NAME,
  charset: "utf8mb4",
});

try {
  const hash = await bcrypt.hash(password, 12);
  await conn.execute(
    `INSERT INTO users (name, email, password_hash, role, active)
     VALUES (?, ?, ?, 'admin', 1)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = 'admin', active = 1,
       session_version = session_version + 1`,
    [name, email, hash],
  );
  console.log(`✔ Administrador ${email} pronto. Remova ADMIN_PASSWORD do arquivo .env.`);
} finally {
  await conn.end();
}
