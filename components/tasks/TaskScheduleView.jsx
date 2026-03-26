'use client'
import { useState, useCallback, useMemo } from 'react'
import { format } from 'date-fns'
import clsx from 'clsx'
import { useTasks, useUpdateTask } from '@/hooks/useTasks'
import { useCategories } from '@/hooks/useCategories'
import TaskModal from './TaskModal'
import ScheduleView from '@/components/calendar/views/ScheduleView'

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

const PALETTE = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444',
  '#06b6d4', '#f43f5e', '#84cc16', '#a855f7', '#14b8a6',
]

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}

export default function TaskScheduleView() {
  const { data: tasks = [] } = useTasks()
  const { data: categories = [] } = useCategories()
  const updateTask = useUpdateTask()
  const [editTaskId, setEditTaskId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [dropTarget, setDropTarget] = useState(null)
  const [colorBy, setColorBy] = useState(() => {
    if (typeof window === 'undefined') return 'priority'
    return localStorage.getItem('schedule_color_by') || 'priority'
  })

  const categoryColors = useMemo(() => {
    const map = {}
    categories.forEach((cat, i) => { map[cat.id] = PALETTE[i % PALETTE.length] })
    return map
  }, [categories])

  const getColor = useCallback((task) => {
    if (colorBy === 'priority') return PRIORITY_COLORS[task.priority] || '#6b7280'
    return task.category_id ? (categoryColors[task.category_id] || '#6b7280') : '#6b7280'
  }, [colorBy, categoryColors])

  const usedCategories = categories.filter(c => tasks.some(t => t.category_id === c.id))

  function openTask(id) {
    setEditTaskId(id)
    setModalOpen(true)
  }

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

  const handleDrop = useCallback((e, day) => {
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
        name: task.name, notes: task.notes, status: task.status,
        priority: task.priority, due_date: newDate, duration: task.duration,
        category_id: task.category_id, subcategory_id: task.subcategory_id,
      },
    })
  }, [tasks, updateTask])

  return (
    <div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Color-by toggle */}
        <div className="flex items-center justify-end px-4 py-3 border-b border-gray-100">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => { setColorBy('category'); localStorage.setItem('schedule_color_by', 'category') }}
              className={clsx(
                'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                colorBy === 'category' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              Category
            </button>
            <button
              onClick={() => { setColorBy('priority'); localStorage.setItem('schedule_color_by', 'priority') }}
              className={clsx(
                'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                colorBy === 'priority' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              Priority
            </button>
          </div>
        </div>

        <ScheduleView
          tasks={tasks}
          getColor={getColor}
          hexToRgb={hexToRgb}
          openTask={openTask}
          dropTarget={dropTarget}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
          handleDrop={handleDrop}
          handleDragStart={handleDragStart}
          handleDragEnd={handleDragEnd}
        />

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
      </div>

      <TaskModal
        isOpen={modalOpen}
        taskId={editTaskId}
        onClose={() => { setModalOpen(false); setEditTaskId(null) }}
      />
    </div>
  )
}
