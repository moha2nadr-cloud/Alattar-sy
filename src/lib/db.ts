import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set");
}

export const sql = neon(url);

let migrated = false;
let migrating: Promise<void> | null = null;

export async function ensureSchema(): Promise<void> {
  if (migrated) return;
  if (migrating) return migrating;
  migrating = (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS shop_config (
        id TEXT PRIMARY KEY DEFAULT 'main',
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
    await sql`
      CREATE OR REPLACE FUNCTION update_shop_config_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `;
    await sql`DROP TRIGGER IF EXISTS shop_config_updated_at ON shop_config`;
    await sql`
      CREATE TRIGGER shop_config_updated_at
      BEFORE UPDATE ON shop_config
      FOR EACH ROW
      EXECUTE FUNCTION update_shop_config_updated_at()
    `;
    migrated = true;
  })();
  try {
    await migrating;
  } finally {
    migrating = null;
  }
}
