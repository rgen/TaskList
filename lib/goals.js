import { sql } from '@/lib/db'

function toDateStr(d) {
  if (!d) return null
  if (typeof d === 'string') return d.slice(0, 10)
  return new Date(d).toISOString().slice(0, 10)
}

export function getSundayOfWeek(dateStr) {
  const str = toDateStr(dateStr)
  const d = new Date(str + 'T12:00:00Z')
  const day = d.getUTCDay()
  d.setUTCDate(d.getUTCDate() - day)
  return d.toISOString().slice(0, 10)
}

function getWeekNumber(goalStartDate, weekStartDate) {
  const start = new Date(getSundayOfWeek(goalStartDate) + 'T12:00:00Z')
  const current = new Date(toDateStr(weekStartDate) + 'T12:00:00Z')
  return Math.floor((current - start) / (7 * 24 * 60 * 60 * 1000)) + 1
}

export async function generateTasksForWeek(goal, weekStartDate, userId) {
  const tpw = Number(goal.tasks_per_week) || 1
  const hpw = Number(goal.hours_per_week)
  const hoursPerTask = Math.round((hpw / tpw) * 100) / 100
  const endDateStr = toDateStr(goal.end_date)
  const endDate = new Date(endDateStr + 'T12:00:00Z')
  const startDateStr = toDateStr(goal.start_date)
  const weekNum = getWeekNumber(startDateStr, weekStartDate)

  // Check if tasks already exist for this goal and week
  const weekEnd = new Date(weekStartDate + 'T12:00:00Z')
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6)
  const weekEndStr = weekEnd.toISOString().slice(0, 10)

  const { rows: existing } = await sql`
    SELECT id FROM tasks
    WHERE goal_id = ${goal.id} AND user_id = ${userId}
      AND due_date >= ${weekStartDate} AND due_date <= ${weekEndStr}`

  if (existing.length > 0) return 0 // Already generated

  let created = 0
  for (let t = 0; t < tpw; t++) {
    const dueDate = new Date(weekStartDate + 'T12:00:00Z')
    dueDate.setUTCDate(dueDate.getUTCDate() + t)
    if (dueDate > endDate) break
    const dueDateStr = dueDate.toISOString().slice(0, 10)
    const taskName = tpw > 1
      ? `${goal.name} — Wk ${weekNum} (${t + 1}/${tpw})`
      : `${goal.name} — Wk ${weekNum}`

    await sql`
      INSERT INTO tasks (user_id, name, status, priority, due_date, hours_goal, goal_id, category_id, subcategory_id)
      VALUES (${userId}, ${taskName}, 'pending', 'medium', ${dueDateStr}, ${hoursPerTask}, ${goal.id}, ${goal.category_id}, ${goal.subcategory_id || null})`
    created++
  }
  return created
}

// Generate upcoming week's tasks for all active goals for a user
export async function generateUpcomingTasks(userId) {
  const today = new Date().toISOString().slice(0, 10)
  const currentWeekStart = getSundayOfWeek(today)

  // Next week's Sunday
  const nextWeek = new Date(currentWeekStart + 'T12:00:00Z')
  nextWeek.setUTCDate(nextWeek.getUTCDate() + 7)
  const nextWeekStart = nextWeek.toISOString().slice(0, 10)

  // Get all active goals for this user
  const { rows: goals } = await sql`
    SELECT * FROM weekly_goals
    WHERE user_id = ${userId}
      AND start_date <= ${nextWeekStart}
      AND end_date >= ${nextWeekStart}`

  let totalCreated = 0
  for (const goal of goals) {
    const created = await generateTasksForWeek(goal, nextWeekStart, userId)
    totalCreated += created
  }

  return totalCreated
}

// Generate tasks for current week if missing (fallback)
export async function ensureCurrentWeekTasks(userId) {
  const today = new Date().toISOString().slice(0, 10)
  const currentWeekStart = getSundayOfWeek(today)

  const { rows: goals } = await sql`
    SELECT * FROM weekly_goals
    WHERE user_id = ${userId}
      AND start_date <= ${currentWeekStart}
      AND end_date >= ${currentWeekStart}`

  let totalCreated = 0
  for (const goal of goals) {
    const created = await generateTasksForWeek(goal, currentWeekStart, userId)
    totalCreated += created
  }

  return totalCreated
}
