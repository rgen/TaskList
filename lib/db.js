import pkg from 'pg'
const { Pool } = pkg

const pool = new Pool({ connectionString: process.env.POSTGRES_URL })

// Tagged template literal compatible with @vercel/postgres sql``
export async function sql(strings, ...values) {
  const text = strings.reduce((acc, str, i) => acc + str + (i < values.length ? `$${i + 1}` : ''), '')
  const { rows } = await pool.query(text, values)
  return { rows }
}

export const db = {
  connect: () => pool.connect(),
}

// Run migrations on startup
let migrated = false
async function runMigrations() {
  if (migrated) return
  migrated = true
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type TEXT NOT NULL DEFAULT 'standard'`)
    await pool.query(`UPDATE users SET user_type = 'admin' WHERE username = 'robert' AND user_type = 'standard'`)
  } catch {}
}
runMigrations()
