'use client'
import { useState, useMemo, useCallback } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay } from 'date-fns'
import clsx from 'clsx'
import { useTasks, useUpdateTask } from '@/hooks/useTasks'
import { useCategories } from '@/hooks/useCategories'
import TaskModal from '@/components/tasks/TaskModal'

const PALETTE = [
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
  '#f43f5e', // rose
  '#84cc16', // lime
  '#a855f7', // purple
  '#14b8a6', // teal
]

const PRIORITY_COLORS = {
  high:   '#ef4444',
  medium: '#f59e0b',
  low:    '#22c55e',
}

const PRIORITY_LABELS = [
  { key: 'high',   label: 'High' },
  { key: 'medium', label: 'Medium' },
  { key: 'low',    label: 'Low' },
]

const STATUS_STRIKE = 'line-through opacity-50'

function buildCalendarDays(month) {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 })
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 })
  const days = []
  let cur = start
  while (cur <= end) { days.push(cur); cur = addDays(cur, 1) }
  return days
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}

export default function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [editTaskId, setEditTaskId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [dropTarget, setDropTarget] = useState(null)
  const [colorBy, setColorBy] = useState(() => {
    if (typeof window === 'undefined') return 'priority'
    return localStorage.getItem('calendar_color_by') || 'priority'
  })

  const { data: tasks = [] } = useTasks()
  const { data: categories = [] } = useCategories()
  const updateTask = useUpdateTask()

  // Build a stable color map: category id → hex color
  const categoryColors = useMemo(() => {
    const map = {}
    categories.forEach((cat, i) => {
      map[cat.id] = PALETTE[i % PALETTE.length]
    })
    return map
  }, [categories])

  const days = buildCalendarDays(currentMonth)
  const today = new Date()

  function getTasksForDay(day) {
    const dayStr = format(day, 'yyyy-MM-dd')
    return tasks.filter((t) => t.due_date === dayStr)
  }

  function getColor(task) {
    if (colorBy === 'priority') return PRIORITY_COLORS[task.priority] || '#6b7280'
    return task.category_id ? (categoryColors[task.category_id] || '#6b7280') : '#6b7280'
  }

  function openTask(id) {
    setEditTaskId(id)
    setModalOpen(true)
  }

  // Drag-and-drop handlers
  const handleDragStart = useCallback((e, task) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', task.id.toString())
    e.currentTarget.style.opacity = '0.5'
  }, [])

  const handleDragEnd = useCallback((e) => {
    e.currentTarget.style.opacity = '1'
    setDropTarget(null)
  }, [])

  const handleDragOver = useCallback((e, day) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropTarget(format(day, 'yyyy-MM-dd'))
  }, [])

  const handleDragLeave = useCallback(() => {
    setDropTarget(null)
  }, [])

  const handleDrop = useCallback(
    (e, day) => {
      e.preventDefault()
      setDropTarget(null)
      const taskId = parseInt(e.dataTransfer.getData('text/plain'), 10)
      if (!taskId) return

      const newDate = format(day, 'yyyy-MM-dd')
      const task = tasks.find((t) => t.id === taskId)
      if (!task || task.due_date === newDate) return

      updateTask.mutate({ id: taskId, data: { due_date: newDate } })
    },
    [tasks, updateTask]
  )

  // Only show categories that appear in tasks
  const usedCategories = categories.filter(c => tasks.some(t => t.category_id === c.id))

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-4">
          {/* Color-by toggle */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => { setColorBy('category'); localStorage.setItem('calendar_color_by', 'category') }}
              className={clsx(
                'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                colorBy === 'category' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              Category
            </button>
            <button
              onClick={() => { setColorBy('priority'); localStorage.setItem('calendar_color_by', 'priority') }}
              className={clsx(
                'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                colorBy === 'priority' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              Priority
            </button>
          </div>

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
          const dateKey = format(day, 'yyyy-MM-dd')
          const isDrop = dropTarget === dateKey

          return (
            <div
              key={day.toISOString()}
              className={clsx(
                'min-h-[120px] p-2 border-b border-r border-gray-100 transition-colors',
                !isCurrentMonth && 'bg-gray-50',
                isLastRow && 'border-b-0',
                (i + 1) % 7 === 0 && 'border-r-0',
                isDrop && 'bg-blue-50 ring-2 ring-inset ring-blue-300'
              )}
              onDragOver={(e) => handleDragOver(e, day)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, day)}
            >
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

              <div className="space-y-1">
                {dayTasks.map((task) => {
                  const color = getColor(task)
                  return (
                    <button
                      key={task.id}
                      type="button"
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                      onClick={() => openTask(task.id)}
                      className={clsx(
                        'w-full text-left text-xs px-1.5 py-0.5 rounded font-medium truncate transition-opacity hover:opacity-80 cursor-grab active:cursor-grabbing',
                        task.status === 'completed' && STATUS_STRIKE
                      )}
                      style={{
                        backgroundColor: `rgba(${hexToRgb(color)}, 0.15)`,
                        color,
                        borderLeft: `3px solid ${color}`,
                      }}
                      title={task.name}
                    >
                      {task.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center flex-wrap gap-3 px-6 py-3 border-t border-gray-100 bg-gray-50">
        {colorBy === 'category' ? (
          <>
            <span className="text-xs text-gray-500 font-medium">Category:</span>
            {usedCategories.length === 0 && (
              <span className="text-xs text-gray-400">No categories assigned</span>
            )}
            {usedCategories.map((cat) => (
              <span key={cat.id} className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                <span className="inline-block w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: categoryColors[cat.id] }} />
                {cat.name}
              </span>
            ))}
            {tasks.some(t => !t.category_id) && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <span className="inline-block w-3 h-3 rounded-full bg-gray-400 shrink-0" />
                Uncategorized
              </span>
            )}
          </>
        ) : (
          <>
            <span className="text-xs text-gray-500 font-medium">Priority:</span>
            {PRIORITY_LABELS.map(({ key, label }) => (
              <span key={key} className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                <span className="inline-block w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: PRIORITY_COLORS[key] }} />
                {label}
              </span>
            ))}
          </>
        )}
      </div>

      <TaskModal
        isOpen={modalOpen}
        taskId={editTaskId}
        onClose={() => { setModalOpen(false); setEditTaskId(null) }}
      />
    </div>
  )
}
