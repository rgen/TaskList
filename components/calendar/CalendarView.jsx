'use client'
import { useState } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, parseISO } from 'date-fns'
import clsx from 'clsx'
import { useTasks } from '@/hooks/useTasks'
import TaskModal from '@/components/tasks/TaskModal'

const PRIORITY_COLORS = {
  high:   'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low:    'bg-green-100 text-green-700 border-green-200',
}

const STATUS_STRIKE = 'line-through opacity-60'

function buildCalendarDays(month) {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 })
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 })
  const days = []
  let cur = start
  while (cur <= end) {
    days.push(cur)
    cur = addDays(cur, 1)
  }
  return days
}

export default function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [editTaskId, setEditTaskId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  const { data: tasks = [] } = useTasks()

  const days = buildCalendarDays(currentMonth)
  const today = new Date()

  function getTasksForDay(day) {
    return tasks.filter((t) => {
      if (!t.due_date) return false
      try { return isSameDay(parseISO(t.due_date), day) } catch { return false }
    })
  }

  function openTask(id) {
    setEditTaskId(id)
    setModalOpen(true)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Previous month"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Next month"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dayTasks = getTasksForDay(day)
          const isToday = isSameDay(day, today)
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isLastRow = i >= days.length - 7

          return (
            <div
              key={day.toISOString()}
              className={clsx(
                'min-h-[120px] p-2 border-b border-r border-gray-100',
                !isCurrentMonth && 'bg-gray-50',
                isLastRow && 'border-b-0',
                (i + 1) % 7 === 0 && 'border-r-0'
              )}
            >
              {/* Day number */}
              <div className="mb-1.5">
                <span
                  className={clsx(
                    'inline-flex items-center justify-center w-7 h-7 text-sm font-medium rounded-full',
                    isToday ? 'bg-blue-600 text-white' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  )}
                >
                  {format(day, 'd')}
                </span>
              </div>

              {/* Tasks */}
              <div className="space-y-1">
                {dayTasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => openTask(task.id)}
                    className={clsx(
                      'w-full text-left text-xs px-1.5 py-0.5 rounded border font-medium truncate transition-opacity hover:opacity-80',
                      PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium,
                      task.status === 'completed' && STATUS_STRIKE
                    )}
                    title={task.name}
                  >
                    {task.name}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-6 py-3 border-t border-gray-100 bg-gray-50">
        <span className="text-xs text-gray-500 font-medium">Priority:</span>
        {[['high', 'High'], ['medium', 'Medium'], ['low', 'Low']].map(([p, label]) => (
          <span key={p} className={clsx('text-xs px-2 py-0.5 rounded border font-medium', PRIORITY_COLORS[p])}>
            {label}
          </span>
        ))}
      </div>

      <TaskModal
        isOpen={modalOpen}
        taskId={editTaskId}
        onClose={() => { setModalOpen(false); setEditTaskId(null) }}
      />
    </div>
  )
}
