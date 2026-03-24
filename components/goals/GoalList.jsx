'use client'
import { useState } from 'react'
import { useGoals, useDeleteGoal } from '@/hooks/useGoals'
import { format, parseISO } from 'date-fns'

function formatDate(d) {
  try { return format(parseISO(d), 'MMM d, yyyy') } catch { return d }
}

export default function GoalList() {
  const { data: goals = [], isLoading } = useGoals()
  const deleteGoal = useDeleteGoal()
  const [confirmId, setConfirmId] = useState(null)

  if (isLoading) return <p className="text-sm text-gray-400">Loading…</p>
  if (!goals.length) return (
    <p className="text-sm text-gray-400 text-center py-8">No goals yet. Create one above.</p>
  )

  return (
    <div className="space-y-3">
      {goals.map(goal => (
        <div key={goal.id} className="border border-gray-200 rounded-xl p-4 bg-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-gray-900 text-sm truncate">{goal.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {goal.category_name}{goal.subcategory_name ? ` › ${goal.subcategory_name}` : ''}
              </p>
            </div>
            <button
              onClick={() => setConfirmId(goal.id)}
              className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
              title="Delete goal"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
              {goal.tasks_per_week} task{goal.tasks_per_week !== 1 ? 's' : ''}/wk
            </span>
            <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
              {goal.hours_per_week}h/wk
            </span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {formatDate(goal.start_date)} → {formatDate(goal.end_date)}
            </span>
          </div>

          {confirmId === goal.id && (
            <div className="mt-3 flex items-center gap-2 bg-red-50 rounded-lg p-2">
              <p className="text-xs text-red-700 flex-1">Delete this goal? Tasks will remain but be unlinked.</p>
              <button
                onClick={async () => { await deleteGoal.mutateAsync(goal.id); setConfirmId(null) }}
                className="text-xs bg-red-600 text-white px-2.5 py-1 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
              <button onClick={() => setConfirmId(null)} className="text-xs text-gray-500 hover:text-gray-700 px-2">
                Cancel
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
