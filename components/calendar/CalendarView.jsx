'use client'
import { useState, useMemo, useCallback } from 'react'
import {
  format,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addYears,
  subYears,
  startOfWeek,
  endOfWeek,
} from 'date-fns'
import clsx from 'clsx'
import { useTasks, useUpdateTask } from '@/hooks/useTasks'
import { useCategories } from '@/hooks/useCategories'
import TaskModal from '@/components/tasks/TaskModal'

import MonthView from './views/MonthView'
import DayView from './views/DayView'
import WeekView from './views/WeekView'
import YearView from './views/YearView'
import ScheduleView from './views/ScheduleView'

const PALETTE = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444',
  '#06b6d4', '#f43f5e', '#84cc16', '#a855f7', '#14b8a6',
]

const PRIORITY_COLORS = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
}

const PRIORITY_LABELS = [
  { key: 'high', label: 'High' },
  { key: 'medium', label: 'Medium' },
  { key: 'low', label: 'Low' },
]

const VIEW_OPTIONS = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
  { key: 'schedule', label: 'Schedule' },
]

export function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}

function getHeaderLabel(viewMode, currentDate) {
  switch (viewMode) {
    case 'day':
      return format(currentDate, 'MMMM d, yyyy')
    case 'week': {
      const ws = startOfWeek(currentDate, { weekStartsOn: 0 })
      const we = endOfWeek(currentDate, { weekStartsOn: 0 })
      return `${format(ws, 'MMM d')} – ${format(we, 'MMM d, yyyy')}`
    }
    case 'month':
      return format(currentDate, 'MMMM yyyy')
    case 'year':
      return format(currentDate, 'yyyy')
    case 'schedule':
      return 'Schedule'
    default:
      return ''
  }
}

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window === 'undefined') return 'month'
    return localStorage.getItem('calendar_view_mode') || 'month'
  })
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

  const categoryColors = useMemo(() => {
    const map = {}
    categories.forEach((cat, i) => {
      map[cat.id] = PALETTE[i % PALETTE.length]
    })
    return map
  }, [categories])

  const getColor = useCallback((task) => {
    if (colorBy === 'priority') return PRIORITY_COLORS[task.priority] || '#6b7280'
    return task.category_id ? (categoryColors[task.category_id] || '#6b7280') : '#6b7280'
  }, [colorBy, categoryColors])

  function openTask(id) {
    setEditTaskId(id)
    setModalOpen(true)
  }

  // Navigation
  function goNext() {
    setCurrentDate((d) => {
      switch (viewMode) {
        case 'day': return addDays(d, 1)
        case 'week': return addWeeks(d, 1)
        case 'month': return addMonths(d, 1)
        case 'year': return addYears(d, 1)
        case 'schedule': return addMonths(d, 1)
        default: return d
      }
    })
  }

  function goPrev() {
    setCurrentDate((d) => {
      switch (viewMode) {
        case 'day': return subDays(d, 1)
        case 'week': return subWeeks(d, 1)
        case 'month': return subMonths(d, 1)
        case 'year': return subYears(d, 1)
        case 'schedule': return subMonths(d, 1)
        default: return d
      }
    })
  }

  function goToday() {
    setCurrentDate(new Date())
  }

  function handleViewChange(mode) {
    setViewMode(mode)
    localStorage.setItem('calendar_view_mode', mode)
  }

  function navigateToDay(day) {
    setCurrentDate(day)
    setViewMode('day')
    localStorage.setItem('calendar_view_mode', 'day')
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

      updateTask.mutate({
        id: taskId,
        data: {
          name: task.name,
          notes: task.notes,
          status: task.status,
          priority: task.priority,
          due_date: newDate,
          duration: task.duration,
          category_id: task.category_id,
          subcategory_id: task.subcategory_id,
        },
      })
    },
    [tasks, updateTask]
  )

  const usedCategories = categories.filter(c => tasks.some(t => t.category_id === c.id))

  const sharedProps = {
    currentDate,
    tasks,
    getColor,
    hexToRgb,
    openTask,
    dropTarget,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragStart,
    handleDragEnd,
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-gray-200">
        {/* Left: title + nav */}
        <div className="flex items-center gap-3">
          <button
            onClick={goPrev}
            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Previous"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-gray-900 min-w-[180px] text-center">
            {getHeaderLabel(viewMode, currentDate)}
          </h2>
          <button
            onClick={goNext}
            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Next"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={goToday}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Today
          </button>
        </div>

        {/* Right: view toggle + color-by */}
        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            {VIEW_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleViewChange(key)}
                className={clsx(
                  'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                  viewMode === key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Color-by toggle (hidden in schedule/year view) */}
          {viewMode !== 'year' && (
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
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
          )}
        </div>
      </div>

      {/* View content */}
      {viewMode === 'month' && <MonthView {...sharedProps} />}
      {viewMode === 'day' && <DayView {...sharedProps} />}
      {viewMode === 'week' && <WeekView {...sharedProps} />}
      {viewMode === 'year' && <YearView currentDate={currentDate} tasks={tasks} navigateToDay={navigateToDay} />}
      {viewMode === 'schedule' && <ScheduleView {...sharedProps} />}

      {/* Legend (hidden in year view) */}
      {viewMode !== 'year' && (
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
      )}

      <TaskModal
        isOpen={modalOpen}
        taskId={editTaskId}
        onClose={() => { setModalOpen(false); setEditTaskId(null) }}
      />
    </div>
  )
}
