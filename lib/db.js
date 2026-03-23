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
