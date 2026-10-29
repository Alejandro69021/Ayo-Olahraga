import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import { Pool } from "pg";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const isPostgresUrl = Boolean(process.env.DATABASE_URL);

let dbInstance: ReturnType<typeof drizzlePg<typeof schema>> | ReturnType<typeof drizzlePglite<typeof schema>>;

if (isPostgresUrl) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  dbInstance = drizzlePg(pool, { schema });
} else {
  const dataDir = path.join(process.cwd(), ".data", "pglite");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const client = new PGlite(dataDir);
  dbInstance = drizzlePglite(client, { schema });
}

export const db = dbInstance;
export { schema };

