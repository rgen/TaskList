'use client'
import { format, isSameDay } from 'date-fns'
import clsx from 'clsx'
import CalendarTaskChip from '../CalendarTaskChip'

export default function DayView({
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
}) {
  const dateKey = format(currentDate, 'yyyy-MM-dd')
  const dayTasks = tasks.filter((t) => t.due_date === dateKey)
  const isToday = isSameDay(currentDate, new Date())
  const isDrop = dropTarget === dateKey

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <span
          className={clsx(
            'inline-flex items-center justify-center w-12 h-12 text-2xl font-bold rounded-full',
            isToday ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
          )}
        >
          {format(currentDate, 'd')}
        </span>
        <div>
          <p className="text-lg font-semibold text-gray-900">
            {format(currentDate, 'EEEE')}
          </p>
          <p className="text-sm text-gray-500">
            {format(currentDate, 'MMMM yyyy')}
          </p>
        </div>
      </div>

      <div
        className={clsx(
          'min-h-[300px] rounded-lg border-2 border-dashed p-4 transition-colors',
          isDrop ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
        )}
        onDragOver={(e) => handleDragOver(e, currentDate)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, currentDate)}
      >
        {dayTasks.length === 0 ? (
          <div className="flex items-center justify-center h-[260px] text-gray-400 text-sm">
            No tasks for this day
          </div>
        ) : (
          <div className="space-y-2">
            {dayTasks.map((task) => (
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
        )}
      </div>

      <p className="mt-3 text-xs text-gray-400 text-center">
        {dayTasks.length} {dayTasks.length === 1 ? 'task' : 'tasks'}
      </p>
    </div>
  )
}
