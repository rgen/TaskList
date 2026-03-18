import { NextResponse } from 'next/server'
import db from '@/lib/db'

function addIsOverdue(task) {
  const today = new Date().toISOString().slice(0, 10)
  task.is_overdue =
    task.due_date !== null &&
    task.due_date !== undefined &&
    task.due_date < today &&
    task.status === 'pending'
  return task
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const sort = searchParams.get('sort') || 'created_at'
    const order = searchParams.get('order') || 'desc'

    const validSortCols = ['created_at', 'updated_at', 'due_date', 'priority', 'name', 'status']
    const validOrders = ['asc', 'desc']
    const sortCol = validSortCols.includes(sort) ? sort : 'created_at'
    const sortOrder = validOrders.includes(order.toLowerCase()) ? order.toUpperCase() : 'DESC'

    const conditions = []
    const params = []

    if (status) {
      conditions.push('status = ?')
      params.push(status)
    }
    if (priority) {
      conditions.push('priority = ?')
      params.push(priority)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const sql = `SELECT * FROM tasks ${where} ORDER BY ${sortCol} ${sortOrder}`

    const tasks = db.prepare(sql).all(...params)
    const result = tasks.map(addIsOverdue)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, notes, status, priority, due_date, duration } = body

    if (!name || name.trim() === '') {
      return NextResponse.json({ message: 'name is required' }, { status: 400 })
    }

    const stmt = db.prepare(`
      INSERT INTO tasks (name, notes, status, priority, due_date, duration)
      VALUES (?, ?, ?, ?, ?, ?)
    `)

    const info = stmt.run(
      name.trim(),
      notes || null,
      status || 'pending',
      priority || 'medium',
      due_date || null,
      duration || null
    )

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(info.lastInsertRowid)
    addIsOverdue(task)
    task.subtasks = []
    task.attachments = []

    return NextResponse.json(task, { status: 201 })
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
