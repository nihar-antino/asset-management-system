import { Pool } from "pg";

// Reuse a single pool across hot reloads / lambda invocations
let pool = global._pgPool;

if (!pool) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Add it to .env.local (dev) or Vercel env vars (prod).");
  }

  pool = new Pool({
    connectionString,
    // Neon requires SSL; local postgres does not.
    ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false },
    max: 5,
  });

  global._pgPool = pool;
}

export async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  if (process.env.NODE_ENV !== "production") {
    console.log("query", { text, duration: Date.now() - start, rows: res.rowCount });
  }
  return res;
}

// Use this for multi-statement transactions (BEGIN/COMMIT need the same connection)
export async function getClient() {
  return pool.connect();
}

export default pool;
