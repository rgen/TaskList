import { sql, db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'

export async function GET(request) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const client = await db.connect()
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const category_id = searchParams.get('category_id')
    const subcategory_id = searchParams.get('subcategory_id')
    const due_date_exact = searchParams.get('due_date')
    const week_start = searchParams.get('week_start')
    const overdue = searchParams.get('overdue')
    const sort = searchParams.get('sort') || 'created_at'
    const order = searchParams.get('order') || 'desc'
    const showArchived = searchParams.get('show_archived') === 'true'

    const validSorts = ['created_at', 'updated_at', 'due_date', 'priority', 'name', 'status']
    const sortCol = validSorts.includes(sort) ? sort : 'created_at'
    const sortDir = order === 'asc' ? 'ASC' : 'DESC'

    const conditions = []
    const values = []
    if (status) { conditions.push(`t.status = $${values.length + 1}`); values.push(status) }
    else if (!showArchived) { conditions.push(`t.status != $${values.length + 1}`); values.push('archived') }
    if (priority) { conditions.push(`t.priority = $${values.length + 1}`); values.push(priority) }
    if (category_id) { conditions.push(`t.category_id = $${values.length + 1}`); values.push(Number(category_id)) }
    if (subcategory_id) { conditions.push(`t.subcategory_id = $${values.length + 1}`); values.push(Number(subcategory_id)) }
    if (due_date_exact) { conditions.push(`t.due_date = $${values.length + 1}`); values.push(due_date_exact) }
    if (week_start) {
      conditions.push(`t.due_date::date >= $${values.length + 1}::date AND t.due_date::date < $${values.length + 2}::date`)
      values.push(week_start)
      const end = new Date(week_start); end.setDate(end.getDate() + 7)
      values.push(end.toISOString().slice(0, 10))
    }
    if (overdue === 'true') { conditions.push(`t.due_date IS NOT NULL AND t.due_date < CURRENT_DATE::text AND t.status != 'completed'`) }

    conditions.push(`t.user_id = $${values.length + 1}`)
    values.push(Number(user.id))

    const where = `WHERE ${conditions.join(' AND ')}`
    const orderExpr = sortCol === 'due_date'
      ? `t.due_date::date ${sortDir} NULLS LAST`
      : sortCol === 'priority'
      ? `CASE t.priority WHEN 'low' THEN 1 WHEN 'medium' THEN 2 WHEN 'high' THEN 3 ELSE 4 END ${sortDir}`
      : `t.${sortCol} ${sortDir}`
    const q = `
      SELECT t.*,
        c.name AS category_name,
        sc.name AS subcategory_name,
        (t.due_date IS NOT NULL AND t.due_date < CURRENT_DATE::text AND t.status != 'completed') AS is_overdue,
        COUNT(s.id)::int AS subtask_count
      FROM tasks t
      LEFT JOIN subtasks s ON s.task_id = t.id
      LEFT JOIN categories c ON c.id = t.category_id
      LEFT JOIN subcategories sc ON sc.id = t.subcategory_id
      ${where}
      GROUP BY t.id, c.name, sc.name
      ORDER BY ${orderExpr}`
    const { rows } = await client.query(q, values)
    return NextResponse.json(rows)
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  } finally {
    client.release()
  }
}

export async function POST(request) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { name, notes, status = 'pending', priority = 'medium', due_date, duration, source, category_id, subcategory_id } = await request.json()
    if (!name || name.trim() === '') return NextResponse.json({ message: 'Name is required' }, { status: 400 })
    const { rows } = await sql`
      INSERT INTO tasks (name, notes, status, priority, due_date, duration, source, category_id, subcategory_id, user_id)
      VALUES (${name.trim()}, ${notes || null}, ${status}, ${priority}, ${due_date || null}, ${duration || null}, ${source || null}, ${category_id || null}, ${subcategory_id || null}, ${Number(user.id)})
      RETURNING *`
    return NextResponse.json({ ...rows[0], subtasks: [], attachments: [] }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
