import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'

export async function PUT(request, { params }) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = params
    const { rows: [existing] } = await sql`SELECT * FROM custom_charts WHERE id = ${id}`
    if (!existing || existing.user_id !== Number(user.id)) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, chart_type, data_source, config = {}, span = 'half', show_on_dashboard = true } = body

    if (!name || !chart_type || !data_source) {
      return NextResponse.json({ message: 'name, chart_type, and data_source are required' }, { status: 400 })
    }

    const { rows: [chart] } = await sql`
      UPDATE custom_charts SET
        name = ${name.trim()},
        chart_type = ${chart_type},
        data_source = ${data_source},
        config = ${JSON.stringify(config)},
        span = ${span},
        show_on_dashboard = ${show_on_dashboard},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *`

    chart.config = typeof chart.config === 'string' ? JSON.parse(chart.config) : chart.config
    return NextResponse.json(chart)
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = params
    const { rows: [existing] } = await sql`SELECT * FROM custom_charts WHERE id = ${id}`
    if (!existing || existing.user_id !== Number(user.id)) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }

    await sql`DELETE FROM custom_charts WHERE id = ${id}`
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
