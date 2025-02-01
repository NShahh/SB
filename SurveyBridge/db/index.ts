import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "./schema";

neonConfig.webSocketConstructor = ws;

// ✅ Ensure DATABASE_URL is Set & Valid
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ ERROR: DATABASE_URL is missing. Set it in Render environment variables.");
  throw new Error("DATABASE_URL is not set.");
}

console.log("📡 Connecting to Database:", databaseUrl);

const pool = new Pool({ connectionString: databaseUrl });
const db = drizzle({ client: pool, schema });

console.log("✅ Successfully Connected to Database");

// ✅ Export outside try/catch
export { pool, db };
