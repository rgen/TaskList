'use client'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay } from 'date-fns'
import clsx from 'clsx'
import CalendarTaskChip from '../CalendarTaskChip'

function buildCalendarDays(month) {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 })
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 })
  const days = []
  let cur = start
  while (cur <= end) { days.push(cur); cur = addDays(cur, 1) }
  return days
}

export default function MonthView({
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
  const days = buildCalendarDays(currentDate)
  const today = new Date()

  function getTasksForDay(day) {
    const dayStr = format(day, 'yyyy-MM-dd')
    return tasks.filter((t) => t.due_date === dayStr)
  }

  return (
    <>
      <div className="grid grid-cols-7 border-b border-gray-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dayTasks = getTasksForDay(day)
          const isToday = isSameDay(day, today)
          const isCurrentMonth = isSameMonth(day, currentDate)
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
    </>
  )
}
