import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS custom_charts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      chart_type TEXT NOT NULL DEFAULT 'donut',
      data_source TEXT NOT NULL DEFAULT 'status',
      config JSONB DEFAULT '{}',
      span TEXT NOT NULL DEFAULT 'half',
      show_on_dashboard BOOLEAN NOT NULL DEFAULT TRUE,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`
}

export async function GET(request) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    await ensureTable()
    const { rows } = await sql`
      SELECT * FROM custom_charts
      WHERE user_id = ${Number(user.id)}
      ORDER BY position ASC, created_at ASC`
    // Parse JSON config
    const charts = rows.map((r) => ({ ...r, config: typeof r.config === 'string' ? JSON.parse(r.config) : r.config }))
    return NextResponse.json(charts)
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}

export async function POST(request) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { name, chart_type, data_source, config = {}, span = 'half', show_on_dashboard = true } = body

    if (!name || !chart_type || !data_source) {
      return NextResponse.json({ message: 'name, chart_type, and data_source are required' }, { status: 400 })
    }

    // Get next position
    const { rows: [{ max: maxPos }] } = await sql`
      SELECT COALESCE(MAX(position), -1) as max FROM custom_charts WHERE user_id = ${Number(user.id)}`

    const { rows: [chart] } = await sql`
      INSERT INTO custom_charts (user_id, name, chart_type, data_source, config, span, show_on_dashboard, position)
      VALUES (${Number(user.id)}, ${name.trim()}, ${chart_type}, ${data_source}, ${JSON.stringify(config)}, ${span}, ${show_on_dashboard}, ${(maxPos ?? -1) + 1})
      RETURNING *`

    chart.config = typeof chart.config === 'string' ? JSON.parse(chart.config) : chart.config
    return NextResponse.json(chart, { status: 201 })
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
