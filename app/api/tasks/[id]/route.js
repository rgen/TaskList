import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'

function addIsOverdue(task) {
  const today = new Date().toISOString().slice(0, 10)
  task.is_overdue =
    task.due_date !== null &&
    task.due_date !== undefined &&
    task.due_date < today &&
    task.status !== 'completed'
  return task
}

export async function GET(request, { params }) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = params
    const { rows: [task] } = await sql`SELECT * FROM tasks WHERE id = ${id}`
    if (!task || task.user_id !== Number(user.id)) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }

    const { rows: subtasks } = await sql`SELECT * FROM subtasks WHERE task_id = ${task.id} ORDER BY position, id`
    const { rows: attachments } = await sql`SELECT * FROM attachments WHERE task_id = ${task.id} ORDER BY id`

    addIsOverdue(task)
    task.subtasks = subtasks
    task.attachments = attachments

    return NextResponse.json(task)
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = params
    const { rows: [existing] } = await sql`SELECT * FROM tasks WHERE id = ${id}`
    if (!existing || existing.user_id !== Number(user.id)) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, notes, status, priority, due_date, duration, source, category_id, subcategory_id } = body

    if (!name || name.trim() === '') {
      return NextResponse.json({ message: 'name is required' }, { status: 400 })
    }

    let completed_at = existing.completed_at
    if (status === 'completed' && existing.status !== 'completed') {
      completed_at = new Date().toISOString()
    } else if (status !== 'completed') {
      completed_at = null
    }

    const { rows: [task] } = await sql`
      UPDATE tasks SET
        name = ${name.trim()},
        notes = ${notes || null},
        status = ${status || existing.status},
        priority = ${priority || existing.priority},
        due_date = ${due_date || null},
        duration = ${duration || null},
        source = ${source !== undefined ? (source || null) : existing.source},
        category_id = ${category_id !== undefined ? (category_id || null) : existing.category_id},
        subcategory_id = ${subcategory_id !== undefined ? (subcategory_id || null) : existing.subcategory_id},
        completed_at = ${completed_at},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *`

    const { rows: subtasks } = await sql`SELECT * FROM subtasks WHERE task_id = ${task.id} ORDER BY position, id`
    const { rows: attachments } = await sql`SELECT * FROM attachments WHERE task_id = ${task.id} ORDER BY id`

    addIsOverdue(task)
    task.subtasks = subtasks
    task.attachments = attachments

    return NextResponse.json(task)
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}

export async function PATCH(request, { params }) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = params
    const { rows: [existing] } = await sql`SELECT * FROM tasks WHERE id = ${id}`
    if (!existing || existing.user_id !== Number(user.id)) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }

    const body = await request.json()
    const { status, hours_logged } = body

    let task
    if (status !== undefined && hours_logged !== undefined) {
      const completed_at = status === 'completed' && existing.status !== 'completed'
        ? new Date().toISOString() : existing.completed_at
      ;({ rows: [task] } = await sql`
        UPDATE tasks SET status = ${status}, hours_logged = ${Number(hours_logged)}, completed_at = ${completed_at}, updated_at = NOW()
        WHERE id = ${id} RETURNING *`)
    } else if (status !== undefined) {
      const completed_at = status === 'completed' && existing.status !== 'completed'
        ? new Date().toISOString() : existing.completed_at
      ;({ rows: [task] } = await sql`
        UPDATE tasks SET status = ${status}, completed_at = ${completed_at}, updated_at = NOW()
        WHERE id = ${id} RETURNING *`)
    } else if (hours_logged !== undefined) {
      ;({ rows: [task] } = await sql`
        UPDATE tasks SET hours_logged = ${Number(hours_logged)}, updated_at = NOW()
        WHERE id = ${id} RETURNING *`)
    } else {
      return NextResponse.json({ message: 'No fields provided' }, { status: 400 })
    }

    return NextResponse.json(task)
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = params
    const { rows: [task] } = await sql`SELECT id, user_id FROM tasks WHERE id = ${id}`
    if (!task || task.user_id !== Number(user.id)) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }

    await sql`DELETE FROM tasks WHERE id = ${id}`
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
