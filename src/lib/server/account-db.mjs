import pg from "pg";

let pool;
export function accountDb() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing.");
  pool ??= new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 4,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 5000,
    allowExitOnIdle: true,
  });
  return pool;
}
