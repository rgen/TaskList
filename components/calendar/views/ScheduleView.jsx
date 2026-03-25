'use client'
import { useMemo } from 'react'
import { format, parseISO, isBefore, startOfDay } from 'date-fns'
import clsx from 'clsx'
import CalendarTaskChip from '../CalendarTaskChip'

export default function ScheduleView({
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
}) {
  const today = startOfDay(new Date())
  const todayStr = format(today, 'yyyy-MM-dd')

  const { overdue, upcoming, unscheduled } = useMemo(() => {
    const overdue = []
    const upcoming = []
    const unscheduled = []

    tasks.forEach((task) => {
      if (!task.due_date) {
        unscheduled.push(task)
      } else if (task.due_date < todayStr && task.status !== 'completed') {
        overdue.push(task)
      } else {
        upcoming.push(task)
      }
    })

    overdue.sort((a, b) => a.due_date.localeCompare(b.due_date))
    upcoming.sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''))

    return { overdue, upcoming, unscheduled }
  }, [tasks, todayStr])

  // Group tasks by date
  function groupByDate(taskList) {
    const groups = {}
    taskList.forEach((task) => {
      const key = task.due_date || 'none'
      if (!groups[key]) groups[key] = []
      groups[key].push(task)
    })
    return Object.entries(groups)
  }

  const overdueGroups = groupByDate(overdue)
  const upcomingGroups = groupByDate(upcoming)

  function renderDateGroup(dateKey, groupTasks, isOverdue = false) {
    const isDrop = dropTarget === dateKey
    const date = dateKey !== 'none' ? parseISO(dateKey) : null

    return (
      <div
        key={dateKey}
        className={clsx(
          'rounded-lg border transition-colors mb-2',
          isDrop ? 'border-blue-300 bg-blue-50' : 'border-gray-100'
        )}
        onDragOver={date ? (e) => handleDragOver(e, date) : undefined}
        onDragLeave={date ? handleDragLeave : undefined}
        onDrop={date ? (e) => handleDrop(e, date) : undefined}
      >
        <div className={clsx(
          'sticky top-0 z-10 px-4 py-2 rounded-t-lg border-b',
          isOverdue ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'
        )}>
          <p className={clsx(
            'text-sm font-semibold',
            isOverdue ? 'text-red-600' : dateKey === todayStr ? 'text-blue-600' : 'text-gray-700'
          )}>
            {date ? format(date, 'EEEE, MMMM d, yyyy') : 'Unscheduled'}
            {dateKey === todayStr && ' — Today'}
            {isOverdue && ' — Overdue'}
          </p>
        </div>
        <div className="p-3 space-y-1.5">
          {groupTasks.map((task) => (
            <CalendarTaskChip
              key={task.id}
              task={task}
              color={getColor(task)}
              hexToRgb={hexToRgb}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onClick={openTask}
              size="lg"
            />
          ))}
        </div>
      </div>
    )
  }

  const isEmpty = overdue.length === 0 && upcoming.length === 0 && unscheduled.length === 0

  return (
    <div className="max-h-[600px] overflow-y-auto p-4">
      {isEmpty ? (
        <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">
          No tasks to display
        </div>
      ) : (
        <>
          {overdueGroups.map(([dateKey, groupTasks]) =>
            renderDateGroup(dateKey, groupTasks, true)
          )}
          {upcomingGroups.map(([dateKey, groupTasks]) =>
            renderDateGroup(dateKey, groupTasks)
          )}
          {unscheduled.length > 0 &&
            renderDateGroup('none', unscheduled)
          }
        </>
      )}
    </div>
  )
}
