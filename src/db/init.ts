import fs from "fs";
import path from "path";
import { PGlite } from "@electric-sql/pglite";
import { Pool } from "pg";
import "dotenv/config";

async function main() {
  console.log("🚀 Menyiapkan database Ayo-Olahraga...");

  const schemaPath = path.join(process.cwd(), "src", "db", "schema.sql");
  const seedPath = path.join(process.cwd(), "src", "db", "seed-muscles.sql");

  const schemaSql = fs.readFileSync(schemaPath, "utf-8");
  const seedSql = fs.readFileSync(seedPath, "utf-8");

  if (process.env.DATABASE_URL) {
    console.log("📦 Terhubung ke PostgreSQL eksternal (DATABASE_URL)...");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
      console.log("⚙️ Menjalankan migrasi skema...");
      await pool.query(schemaSql);
      console.log("🌱 Menjalankan seed data anatomi & peralatan...");
      await pool.query(seedSql);
      console.log("✅ Database PostgreSQL berhasil diinisialisasi!");
    } finally {
      await pool.end();
    }
  } else {
    console.log("⚡ Menjalankan embedded PostgreSQL (PGlite) di ./.data/pglite...");
    const dataDir = path.join(process.cwd(), ".data", "pglite");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const client = new PGlite(dataDir);
    console.log("⚙️ Menjalankan migrasi skema...");
    await client.exec(schemaSql);
    console.log("🌱 Menjalankan seed data anatomi & peralatan...");
    await client.exec(seedSql);
    await client.close();
    console.log("✅ Database lokal PGlite berhasil diinisialisasi dan siap digunakan!");
  }
}

main().catch((err) => {
  console.error("❌ Gagal inisialisasi database:", err);
  process.exit(1);
});

