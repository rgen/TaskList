'use client'
import { useMemo } from 'react'
import {
  format,
  startOfYear,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  isSameMonth,
  isSameDay,
} from 'date-fns'
import clsx from 'clsx'

export default function YearView({ currentDate, tasks, navigateToDay }) {
  const year = currentDate.getFullYear()
  const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1))
  const today = new Date()

  // Pre-compute a set of dates that have tasks for fast lookup
  const taskDateSet = useMemo(() => {
    const set = new Set()
    tasks.forEach((t) => {
      if (t.due_date) set.add(t.due_date)
    })
    return set
  }, [tasks])

  function buildMiniDays(month) {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 })
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 })
    const days = []
    let cur = start
    while (cur <= end) { days.push(cur); cur = addDays(cur, 1) }
    return days
  }

  return (
    <div className="grid grid-cols-3 md:grid-cols-4 gap-6 p-6">
      {months.map((month) => {
        const miniDays = buildMiniDays(month)

        return (
          <div key={month.toISOString()}>
            <h3 className="text-sm font-semibold text-gray-900 mb-2 text-center">
              {format(month, 'MMMM')}
            </h3>

            {/* Mini day headers */}
            <div className="grid grid-cols-7 mb-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} className="text-center text-[10px] font-medium text-gray-400">
                  {d}
                </div>
              ))}
            </div>

            {/* Mini grid */}
            <div className="grid grid-cols-7">
              {miniDays.map((day) => {
                const dateKey = format(day, 'yyyy-MM-dd')
                const inMonth = isSameMonth(day, month)
                const isToday = isSameDay(day, today)
                const hasTasks = taskDateSet.has(dateKey)

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => hasTasks && navigateToDay(day)}
                    className={clsx(
                      'relative flex flex-col items-center justify-center h-7 text-[11px] rounded transition-colors',
                      !inMonth && 'text-gray-300',
                      inMonth && !isToday && 'text-gray-700',
                      isToday && 'bg-blue-600 text-white font-bold',
                      hasTasks && inMonth && !isToday && 'font-bold hover:bg-gray-100 cursor-pointer',
                      !hasTasks && 'cursor-default'
                    )}
                  >
                    {format(day, 'd')}
                    {hasTasks && inMonth && (
                      <span
                        className={clsx(
                          'absolute bottom-0.5 w-1 h-1 rounded-full',
                          isToday ? 'bg-white' : 'bg-blue-500'
                        )}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
