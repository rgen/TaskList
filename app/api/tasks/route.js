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
    const sort = searchParams.get('sort') || 'created_at'
    const order = searchParams.get('order') || 'desc'

    const validSorts = ['created_at', 'updated_at', 'due_date', 'priority', 'name', 'status']
    const sortCol = validSorts.includes(sort) ? sort : 'created_at'
    const sortDir = order === 'asc' ? 'ASC' : 'DESC'

    const conditions = []
    const values = []
    if (status) { conditions.push(`status = $${values.length + 1}`); values.push(status) }
    if (priority) { conditions.push(`priority = $${values.length + 1}`); values.push(priority) }

    conditions.push(`user_id = $${values.length + 1}`)
    values.push(Number(user.id))

    const where = `WHERE ${conditions.join(' AND ')}`
    const q = `SELECT *, (due_date IS NOT NULL AND due_date < CURRENT_DATE::text AND status != 'completed') AS is_overdue FROM tasks ${where} ORDER BY ${sortCol} ${sortDir}`
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
    const { name, notes, status = 'pending', priority = 'medium', due_date, duration } = await request.json()
    if (!name || name.trim() === '') return NextResponse.json({ message: 'Name is required' }, { status: 400 })
    const { rows } = await sql`
      INSERT INTO tasks (name, notes, status, priority, due_date, duration, user_id)
      VALUES (${name.trim()}, ${notes || null}, ${status}, ${priority}, ${due_date || null}, ${duration || null}, ${Number(user.id)})
      RETURNING *`
    return NextResponse.json({ ...rows[0], subtasks: [], attachments: [] }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
