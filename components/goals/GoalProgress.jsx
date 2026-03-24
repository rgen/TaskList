'use client'
import { useGoalProgress } from '@/hooks/useGoals'
import { format, parseISO } from 'date-fns'

function formatDate(d) {
  try { return format(parseISO(d), 'MMM d') } catch { return d }
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

function GoalCard({ goal }) {
  const weekPct = goal.hours_per_week > 0
    ? Math.min(100, Math.round((Number(goal.week_hours_logged) / Number(goal.hours_per_week)) * 100))
    : 0
  const taskPct = goal.tasks_per_week > 0
    ? Math.min(100, Math.round((goal.week_tasks_done / goal.tasks_per_week) * 100))
    : 0

  const isActive = new Date(goal.start_date) <= new Date() && new Date(goal.end_date) >= new Date()

  return (
    <div className={`bg-white rounded-xl border p-5 ${isActive ? 'border-blue-200' : 'border-gray-200 opacity-70'}`}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">{goal.name}</h3>
          <p className="text-xs text-gray-500">
            {goal.category_name}{goal.subcategory_name ? ` › ${goal.subcategory_name}` : ''}
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
        <div>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Hours logged</span>
            <span className="font-medium">
              {Number(goal.week_hours_logged).toFixed(2)}h / {Number(goal.hours_per_week)}h
              <span className="text-gray-400 ml-1">({weekPct}%)</span>
            </span>
          </div>
          <ProgressBar value={Number(goal.week_hours_logged)} max={Number(goal.hours_per_week)} color="bg-blue-500" />
        </div>

        <div>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Tasks completed</span>
            <span className="font-medium">
              {goal.week_tasks_done} / {goal.tasks_per_week}
              <span className="text-gray-400 ml-1">({taskPct}%)</span>
            </span>
          </div>
          <ProgressBar value={goal.week_tasks_done} max={goal.tasks_per_week} color="bg-purple-500" />
        </div>
      </div>

      {/* All time */}
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">All Time</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-gray-900">{Number(goal.total_hours_logged).toFixed(1)}h</p>
          <p className="text-xs text-gray-500 mt-0.5">Hours logged</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-gray-900">{goal.total_tasks_done}<span className="text-sm font-normal text-gray-400">/{goal.total_tasks}</span></p>
          <p className="text-xs text-gray-500 mt-0.5">Tasks done</p>
        </div>
      </div>
    </div>
  )
}

export default function GoalProgress() {
  const { data: goals = [], isLoading } = useGoalProgress()

  if (isLoading) return (
    <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Loading…</div>
  )

  if (!goals.length) return (
    <div className="text-center py-16 text-gray-400 text-sm">
      No goals yet. Create one under <span className="font-medium">Goals → Manage</span>.
    </div>
  )

  const active = goals.filter(g => new Date(g.start_date) <= new Date() && new Date(g.end_date) >= new Date())
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
