'use client'
import { useState, useCallback, useMemo } from 'react'
import { format } from 'date-fns'
import { useTasks, useUpdateTask } from '@/hooks/useTasks'
import { useCategories } from '@/hooks/useCategories'
import TaskModal from './TaskModal'
import ScheduleView from '@/components/calendar/views/ScheduleView'

const PRIORITY_COLORS = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
}

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

  const categoryColors = useMemo(() => {
    const map = {}
    categories.forEach((cat, i) => { map[cat.id] = PALETTE[i % PALETTE.length] })
    return map
  }, [categories])

  const getColor = useCallback((task) => {
    return PRIORITY_COLORS[task.priority] || '#6b7280'
  }, [])

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
      </div>
      <TaskModal
        isOpen={modalOpen}
        taskId={editTaskId}
        onClose={() => { setModalOpen(false); setEditTaskId(null) }}
      />
    </div>
  )
}
