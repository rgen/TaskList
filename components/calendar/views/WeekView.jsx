'use client'
import { format, startOfWeek, addDays, isSameDay } from 'date-fns'
import clsx from 'clsx'
import CalendarTaskChip from '../CalendarTaskChip'

export default function WeekView({
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
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const today = new Date()

  return (
    <div className="grid grid-cols-7">
      {days.map((day, i) => {
        const dateKey = format(day, 'yyyy-MM-dd')
        const dayTasks = tasks.filter((t) => t.due_date === dateKey)
        const isToday = isSameDay(day, today)
        const isDrop = dropTarget === dateKey
        const isLast = i === 6

        return (
          <div
            key={dateKey}
            className={clsx(
              'min-h-[450px] border-r border-gray-100 transition-colors',
              isLast && 'border-r-0',
              isDrop && 'bg-blue-50 ring-2 ring-inset ring-blue-300'
            )}
            onDragOver={(e) => handleDragOver(e, day)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, day)}
          >
            {/* Column header */}
            <div className={clsx(
              'py-3 text-center border-b border-gray-200',
              isToday && 'bg-blue-50'
            )}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {format(day, 'EEE')}
              </p>
              <span
                className={clsx(
                  'inline-flex items-center justify-center w-8 h-8 text-sm font-bold rounded-full mt-1',
                  isToday ? 'bg-blue-600 text-white' : 'text-gray-900'
                )}
              >
                {format(day, 'd')}
              </span>
            </div>

            {/* Tasks */}
            <div className="p-1.5 space-y-1">
              {dayTasks.map((task) => (
                <CalendarTaskChip
                  key={task.id}
                  task={task}
                  color={getColor(task)}
                  hexToRgb={hexToRgb}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onClick={openTask}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
