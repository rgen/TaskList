import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { generateUpcomingTasks } from '@/lib/goals'

export async function GET(request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get all users who have active goals
    const { rows: users } = await sql`
      SELECT DISTINCT user_id FROM weekly_goals
      WHERE end_date >= CURRENT_DATE`

    let totalCreated = 0
    for (const { user_id } of users) {
      const created = await generateUpcomingTasks(user_id)
      totalCreated += created
    }

    return NextResponse.json({
      success: true,
      tasksCreated: totalCreated,
      usersProcessed: users.length,
    })
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
