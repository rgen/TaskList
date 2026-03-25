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

const DEFAULT_CHARTS_FOR_CHRIS = [
  {
    name: 'Task Status Breakdown',
    chart_type: 'donut',
    data_source: 'status',
    config: { color_scheme: 'default', exclude_archived: true },
    span: 'half',
    position: 0,
  },
  {
    name: 'Tasks Due This Week',
    chart_type: 'bar_vertical',
    data_source: 'due_this_week',
    config: { color_scheme: 'cool', exclude_archived: true },
    span: 'half',
    position: 1,
  },
  {
    name: 'Tasks by Priority',
    chart_type: 'donut',
    data_source: 'priority',
    config: { color_scheme: 'warm', exclude_archived: true },
    span: 'half',
    position: 2,
  },
  {
    name: 'Tasks by Category',
    chart_type: 'bar_vertical',
    data_source: 'category',
    config: { color_scheme: 'default', exclude_archived: true },
    span: 'half',
    position: 3,
  },
  {
    name: 'School Work — Tasks by Subcategory',
    chart_type: 'bar_vertical',
    data_source: 'subcategory',
    config: { color_scheme: 'cool', exclude_archived: true, filter_category_name: 'School Work' },
    span: 'full',
    position: 4,
  },
  {
    name: 'Tasks Due by Week',
    chart_type: 'bar_vertical',
    data_source: 'due_by_week',
    config: { color_scheme: 'default', exclude_archived: true },
    span: 'full',
    position: 5,
  },
]

async function seedChartsForChris() {
  // Find user chris
  const { rows: users } = await sql`SELECT id FROM users WHERE LOWER(username) = 'chris'`
  if (!users.length) return

  const chrisId = users[0].id

  // Check if chris already has charts
  const { rows: existing } = await sql`SELECT id FROM custom_charts WHERE user_id = ${chrisId} LIMIT 1`
  if (existing.length > 0) return

  // Insert default charts for chris
  for (const chart of DEFAULT_CHARTS_FOR_CHRIS) {
    await sql`
      INSERT INTO custom_charts (user_id, name, chart_type, data_source, config, span, show_on_dashboard, position)
      VALUES (${chrisId}, ${chart.name}, ${chart.chart_type}, ${chart.data_source}, ${JSON.stringify(chart.config)}, ${chart.span}, TRUE, ${chart.position})`
  }
}

export async function GET(request) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    await ensureTable()
    await seedChartsForChris()

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
