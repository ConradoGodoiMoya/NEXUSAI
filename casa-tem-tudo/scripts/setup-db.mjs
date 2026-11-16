// Cria as tabelas (idempotente) e insere as categorias sugeridas, caso ainda não existam.
// Uso: npm run db:setup
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import mysql from "mysql2/promise";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const required = ["DATABASE_HOST", "DATABASE_USER", "DATABASE_NAME"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Variáveis de ambiente ausentes: ${missing.join(", ")}. Veja .env.example.`);
  process.exit(1);
}

const conn = await mysql.createConnection({
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT || 3306),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD || "",
  database: process.env.DATABASE_NAME,
  multipleStatements: true,
  charset: "utf8mb4",
});

try {
  const schema = await readFile(path.join(root, "database", "schema.sql"), "utf8");
  await conn.query(schema);
  console.log("✔ Tabelas criadas/verificadas.");

  // Categorias SUGERIDAS para organização inicial do catálogo.
  // Podem (e devem) ser revisadas, editadas ou removidas pelo painel administrativo.
  const [[{ total }]] = await conn.query("SELECT COUNT(*) AS total FROM categories");
  if (Number(total) === 0) {
    const suggested = [
      ["Materiais básicos", "materiais-basicos", "Itens essenciais para a estrutura da obra, da fundação às paredes.", "brick"],
      ["Cimento e argamassa", "cimento-e-argamassa", "Para assentamento, reboco, contrapiso e acabamentos.", "package"],
      ["Ferramentas", "ferramentas", "Ferramentas manuais e acessórios para o dia a dia da obra.", "hammer"],
      ["Materiais hidráulicos", "materiais-hidraulicos", "Tubos, conexões e itens para instalações de água e esgoto.", "droplets"],
      ["Materiais elétricos", "materiais-eletricos", "Fios, cabos, tomadas e componentes para instalações elétricas.", "zap"],
      ["Tintas e acessórios", "tintas-e-acessorios", "Tintas, rolos, pincéis e tudo para pintura.", "paint"],
      ["Pisos e revestimentos", "pisos-e-revestimentos", "Opções para pisos, paredes e áreas internas ou externas.", "grid"],
      ["Acabamentos", "acabamentos", "Detalhes que fazem a diferença no resultado final.", "sparkles"],
    ];
    await conn.query(
      "INSERT INTO categories (name, slug, description, icon, sort_order) VALUES ?",
      [suggested.map((c, i) => [...c, (i + 1) * 10])],
    );
    console.log(`✔ ${suggested.length} categorias sugeridas inseridas (edite-as no painel).`);
  } else {
    console.log(`• ${total} categorias já existentes — nenhuma alteração.`);
  }
} finally {
  await conn.end();
}
