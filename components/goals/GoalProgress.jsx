'use client'
import Link from 'next/link'
import { useGoalProgress } from '@/hooks/useGoals'
import { format, parseISO, startOfWeek } from 'date-fns'

function formatDate(d) {
  try {
    const date = typeof d === 'string' ? parseISO(d) : new Date(d)
    return format(date, 'MMM d, yyyy')
  } catch { return String(d) }
}

function ProgressBar({ value, max, color = 'bg-blue-500' }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  const over = pct >= 100
  return (
    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
      <div
        className={`h-2.5 rounded-full transition-all ${over ? 'bg-green-500' : color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function buildUrl(params) {
  const filtered = Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== '')
  if (!filtered.length) return '/tasks'
  return '/tasks?' + filtered.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
}

function GoalCard({ goal }) {
  const weekPct = goal.hours_per_week > 0
    ? Math.min(100, Math.round((Number(goal.week_hours_logged) / Number(goal.hours_per_week)) * 100))
    : 0
  const taskPct = goal.tasks_per_week > 0
    ? Math.min(100, Math.round((goal.week_tasks_done / goal.tasks_per_week) * 100))
    : 0

  const isActive = new Date(goal.start_date) <= new Date() && new Date(goal.end_date) >= new Date()

  const now = new Date()
  const ws = format(startOfWeek(now, { weekStartsOn: 0 }), 'yyyy-MM-dd')

  // All tasks for this goal
  const allGoalTasks = buildUrl({
    goal_id: goal.id,
    category_id: goal.category_id,
    subcategory_id: goal.subcategory_id,
  })

  // This week's tasks for this goal
  const thisWeekTasks = buildUrl({
    goal_id: goal.id,
    category_id: goal.category_id,
    subcategory_id: goal.subcategory_id,
    week_start: ws,
  })

  // This week's completed tasks for this goal
  const thisWeekCompleted = buildUrl({
    goal_id: goal.id,
    category_id: goal.category_id,
    subcategory_id: goal.subcategory_id,
    week_start: ws,
    status: 'completed',
  })

  // All completed tasks for this goal
  const allCompleted = buildUrl({
    goal_id: goal.id,
    category_id: goal.category_id,
    subcategory_id: goal.subcategory_id,
    status: 'completed',
  })

  return (
    <div className={`bg-white rounded-xl border p-5 ${isActive ? 'border-blue-200' : 'border-gray-200 opacity-70'}`}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div>
          <Link href={allGoalTasks} className="font-semibold text-gray-900 text-sm hover:text-blue-600 transition-colors">
            {goal.name}
          </Link>
          <p className="text-xs">
            <Link href={allGoalTasks} className="text-gray-500 hover:text-blue-600 transition-colors">
              {goal.category_name}{goal.subcategory_name ? ` › ${goal.subcategory_name}` : ''}
            </Link>
          </p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${isActive ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <p className="text-xs text-gray-400 mb-4">
        {formatDate(goal.start_date)} — {formatDate(goal.end_date)}
      </p>

      {/* Current week */}
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">This Week</p>

      <div className="space-y-3 mb-4">
        <Link href={thisWeekTasks} className="block group">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span className="group-hover:text-blue-600 transition-colors">Hours logged</span>
            <span className="font-medium">
              {Number(goal.week_hours_logged).toFixed(2)}h / {Number(goal.hours_per_week)}h
              <span className="text-gray-400 ml-1">({weekPct}%)</span>
            </span>
          </div>
          <ProgressBar value={Number(goal.week_hours_logged)} max={Number(goal.hours_per_week)} color="bg-blue-500" />
        </Link>

        <Link href={thisWeekCompleted} className="block group">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span className="group-hover:text-blue-600 transition-colors">Tasks completed</span>
            <span className="font-medium">
              {goal.week_tasks_done} / {goal.tasks_per_week}
              <span className="text-gray-400 ml-1">({taskPct}%)</span>
            </span>
          </div>
          <ProgressBar value={goal.week_tasks_done} max={goal.tasks_per_week} color="bg-purple-500" />
        </Link>
      </div>

      {/* All time */}
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">All Time</p>
      <div className="grid grid-cols-2 gap-3">
        <Link href={allGoalTasks} className="bg-gray-50 rounded-lg p-3 text-center hover:bg-blue-50 transition-colors">
          <p className="text-xl font-bold text-gray-900">{Number(goal.total_hours_logged).toFixed(1)}h</p>
          <p className="text-xs text-gray-500 mt-0.5">Hours logged</p>
        </Link>
        <Link href={allCompleted} className="bg-gray-50 rounded-lg p-3 text-center hover:bg-blue-50 transition-colors">
          <p className="text-xl font-bold text-gray-900">{goal.total_tasks_done}<span className="text-sm font-normal text-gray-400">/{goal.total_tasks}</span></p>
          <p className="text-xs text-gray-500 mt-0.5">Tasks done</p>
        </Link>
      </div>
    </div>
  )
}

export default function GoalProgress() {
  const { data: goals = [], isLoading, error } = useGoalProgress()

  if (isLoading) return (
    <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Loading…</div>
  )

  if (error) return (
    <div className="text-center py-16 text-red-500 text-sm">
      Error loading progress: {error.message}
    </div>
  )

  if (!goals.length) return (
    <div className="text-center py-16 text-gray-400 text-sm">
      No goals yet. Create one under <span className="font-medium">Goals → Manage</span>.
    </div>
  )

  const now = new Date()
  const active = goals.filter(g => new Date(g.start_date) <= now && new Date(g.end_date) >= now)
  const inactive = goals.filter(g => !active.includes(g))

  return (
    <div className="space-y-8">
      {active.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Active Goals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {active.map(g => <GoalCard key={g.id} goal={g} />)}
          </div>
        </section>
      )}

      {inactive.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Past / Future Goals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inactive.map(g => <GoalCard key={g.id} goal={g} />)}
          </div>
        </section>
      )}
    </div>
  )
}
